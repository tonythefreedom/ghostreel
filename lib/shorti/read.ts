// Lane A. Live reads from Shorti's public, keyless MCP, reduced to GhostReel's own types.
// Node-safe (no Next imports) so scripts/record-shorti.ts can reuse it.
import { callTool, type ToolResult } from "../mcp.ts";
import {
  FormatPlan,
  TrendCard,
  VideoReading,
  type FormatPlan as FormatPlanT,
  type TrendCard as TrendCardT,
  type VideoReading as VideoReadingT,
} from "../types.ts";

export const SHORTI_MCP = process.env.SHORTI_MCP_URL ?? "https://shorti.ai/mcp";

export class ShortiRefusal extends Error {
  readonly tool: string;
  readonly reason: string;
  constructor(tool: string, reason: string, hint?: string) {
    super(`shorti ${tool} refused: ${reason}${hint ? ` (${hint})` : ""}`);
    this.tool = tool;
    this.reason = reason;
  }
}

type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj => (v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : {});
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const str = (v: unknown): string | undefined => (typeof v === "string" && v.length > 0 ? v : undefined);
const num = (v: unknown): number | undefined => (typeof v === "number" && Number.isFinite(v) ? v : undefined);

// Keyless door: 20 req/s per IP, then 429. Two gentle retries, then give up.
async function call(tool: string, args: Obj): Promise<ToolResult> {
  for (let attempt = 0; ; attempt++) {
    try {
      const r = await callTool(SHORTI_MCP, tool, { lang: "en", ...args }, { timeoutMs: 25_000 });
      const s = obj(r.structured);
      if (r.isError || s.refusal || s.state === "refused") {
        throw new ShortiRefusal(tool, String(s.refusal ?? s.reason ?? "error"), str(s.hint));
      }
      return r;
    } catch (e) {
      const retryable = e instanceof Error && /HTTP 429|HTTP 5\d\d|timeout|aborted/i.test(e.message);
      if (!retryable || attempt >= 2) throw e;
      await new Promise((ok) => setTimeout(ok, 800 * (attempt + 1)));
    }
  }
}

// ── reducers: Shorti's public answer → GhostReel types (only the fields we use) ──

export function toTrendCards(structured: unknown): TrendCardT[] {
  const s = obj(structured);
  const today = arr(s.today).map((raw) => {
    const t = obj(raw);
    const f = obj(t.format);
    return {
      videoId: str(t.video_id),
      url: str(t.url),
      platform: str(t.platform) ?? "unknown",
      tag: str(t.tag),
      formatId: str(f.format_id),
      formatTitle: str(f.title),
      formatKind: str(f.kind),
      views: num(t.views),
      viewsAsOf: str(t.views_as_of),
      page: str(t.page),
    };
  });
  const breakouts = arr(s.breakouts).map((raw) => {
    const b = obj(raw);
    const page = str(b.page);
    return {
      videoId: page?.split("/").pop(), // the public page slug identifies the video
      url: str(b.url),
      platform: str(b.platform) ?? "unknown",
      by: str(b.by),
      tag: "Breakout",
      views: num(b.views),
      whatHappens: str(b.what),
      page,
    };
  });
  const seen = new Set<string>();
  return [...today, ...breakouts].flatMap((c) => {
    const parsed = TrendCard.safeParse(c);
    if (!parsed.success || seen.has(parsed.data.url)) return [];
    seen.add(parsed.data.url);
    return [parsed.data];
  });
}

export function toVideoReading(structured: unknown): { reading: VideoReadingT; card: Partial<TrendCardT> } {
  const v = obj(obj(structured).video);
  const shoot = obj(v.to_shoot);
  const reading = VideoReading.parse({
    videoId: str(v.video_id) ?? "",
    hook: str(v.hook),
    turn: str(v.turn),
    whatHappens: str(v.what_happens),
    beats: arr(v.beats).map((b) => ({ at: str(obj(b).at) ?? "", do: str(obj(b).do) ?? "" })),
    checklist: arr(v.checklist).filter((x): x is string => typeof x === "string"),
    needs: arr(shoot.needs).filter((x): x is string => typeof x === "string"),
    props: arr(shoot.props).filter((x): x is string => typeof x === "string"),
  });
  const card: Partial<TrendCardT> = {
    by: str(v.by),
    views: num(v.views),
    viewsAsOf: str(v.views_as_of),
    posterUrl: str(v.poster),
    hook: str(v.hook),
    whatHappens: str(v.what_happens),
    lengthS: num(v.length_s),
  };
  return { reading, card };
}

export function toFormatPlan(structured: unknown): FormatPlanT {
  const s = obj(structured);
  return FormatPlan.parse({
    formatId: str(s.id) ?? "",
    line: str(s.line) ?? "",
    open: arr(s.open).map((o) => ({ label: str(obj(o).label) ?? "", what: str(obj(o).what) ?? "", how: str(obj(o).how) })),
    page: str(s.link),
  });
}

// ── live reads ──

export async function readTrending(field: string): Promise<{ cards: TrendCardT[]; asOf?: string }> {
  const r = await call("shorti_what_to_shoot", { lens: "radar", field, limit: 8 });
  return { cards: toTrendCards(r.structured), asOf: str(obj(r.structured).as_of) };
}

export async function readVideo(url: string) {
  return toVideoReading((await call("shorti_video", { url })).structured);
}

export async function readFormatPlan(formatId: string) {
  return toFormatPlan((await call("shorti_format", { format_id: formatId, part: "flow" })).structured);
}

// Enrich cards with posters and hooks, four at a time to stay well under the keyless rate limit.
export async function enrich(cards: TrendCardT[]): Promise<{ cards: TrendCardT[]; readings: Map<string, VideoReadingT> }> {
  const readings = new Map<string, VideoReadingT>();
  const out = [...cards];
  for (let i = 0; i < out.length; i += 4) {
    await Promise.all(
      out.slice(i, i + 4).map(async (c, j) => {
        try {
          const { reading, card } = await readVideo(c.url);
          const merged = { ...c, ...Object.fromEntries(Object.entries(card).filter(([, v]) => v !== undefined)) };
          out[i + j] = TrendCard.parse(merged);
          readings.set(c.videoId, { ...reading, videoId: c.videoId });
        } catch {
          // keep the bare card; a missing poster is drawn as a plain tile
        }
      }),
    );
  }
  return { cards: out, readings };
}
