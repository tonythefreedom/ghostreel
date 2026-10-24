// Lane A. Live reads from Shorti's public, keyless MCP, reduced to GhostReel's own types.
// Node-safe (no Next imports) so scripts/record-shorti.ts can reuse it.
import { callTool, type ToolResult } from "../mcp.ts";
import {
  CameraSetup,
  FindMatch,
  FormatPlan,
  OpenSpot,
  RecipeEdit,
  TrendCard,
  VideoReading,
  type FormatPlan as FormatPlanT,
  type TrendCard as TrendCardT,
  type VideoReading as VideoReadingT,
  type RecipeEdit as RecipeEditT,
  type CameraSetup as CameraSetupT,
  type FindMatch as FindMatchT,
  type OpenSpot as OpenSpotT,
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

// The only Shorti calls GhostReel makes: keyless reads. Shorti's writes (recipe brief, cut, check, share, board,
// arena join, my_*) need a person signed in and approving at that moment, so an unattended server never calls them
// and a demo never shows a Shorti sign-in. Anything off this list throws before it leaves the process.
export const KEYLESS_READS: Record<string, readonly string[] | null> = {
  shorti_what_to_shoot: null,
  shorti_video: null,
  shorti_find: null,
  shorti_format: ["plan", "flow", "scene"], // by `part`
  shorti_recipe: ["edit", "remake", "scene"], // by `kind`
  shorti_arena: ["spots", "board"], // by `view`; never `join` or `leave`
};

export function isKeylessRead(tool: string, args: Obj): boolean {
  if (!(tool in KEYLESS_READS)) return false;
  const kinds = KEYLESS_READS[tool];
  if (!kinds) return true;
  if ("join" in args || "leave" in args || "idempotency_key" in args) return false;
  const which = args.part ?? args.kind ?? args.view;
  return typeof which === "string" && kinds.includes(which);
}

// Keyless door: 20 req/s per IP, then 429. Two gentle retries, then give up. Reads only, so a retry is safe.
async function call(tool: string, args: Obj): Promise<ToolResult> {
  if (!isKeylessRead(tool, args)) throw new ShortiRefusal(tool, "not_a_keyless_read");
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

const strs = (v: unknown): string[] => arr(v).filter((x): x is string => typeof x === "string" && x.length > 0);
const en = (v: unknown): string | undefined => str(obj(v).en) ?? str(v);

export function toRecipeEdit(structured: unknown): RecipeEditT {
  const s = obj(structured);
  const r = obj(s.recipe);
  const f = obj(s.formula);
  return RecipeEdit.parse({
    videoId: str(s.video_id) ?? str(obj(r.reference).video) ?? "",
    lengthMs: num(r.length_ms),
    bpm: num(obj(r.beats).bpm),
    hookFacts: arr(r.hook).flatMap((h) => (str(obj(h).en) ? [str(obj(h).en)!] : [])),
    cues: arr(f.cues).flatMap((c) => {
      const cue = en(obj(c).cue);
      const doIt = en(obj(c).do);
      return cue && doIt ? [{ cue, do: doIt, share: en(obj(c).share) ?? "" }] : [];
    }),
    makeItYours: strs(obj(f.make_it_yours).en),
    free: arr(r.free).flatMap((x) => (str(obj(x).en) ? [str(obj(x).en)!] : [])),
  });
}

export function toCameraSetups(structured: unknown): CameraSetupT[] {
  return arr(obj(structured).setups).flatMap((raw) => {
    const u = obj(raw);
    const parsed = CameraSetup.safeParse({
      tMs: num(u.t_ms) ?? 0, mount: str(u.mount), move: str(u.move), height: str(u.height), distM: num(u.dist_m), tiltDeg: num(u.tilt_deg),
    });
    return parsed.success ? [parsed.data] : [];
  });
}

export function toFindMatches(structured: unknown): FindMatchT[] {
  const s = obj(structured);
  return [...arr(s.matches), ...arr(s.formats)].flatMap((raw) => {
    const m = obj(raw);
    const parsed = FindMatch.safeParse({
      formatId: str(m.format_id), title: str(m.title), idea: str(m.idea), videos: num(m.videos), exampleUrl: str(obj(m.example).url),
    });
    return parsed.success ? [parsed.data] : [];
  });
}

export function toOpenSpots(structured: unknown): OpenSpotT[] {
  return arr(obj(structured).spots).flatMap((raw) => {
    const sp = obj(raw);
    const parsed = OpenSpot.safeParse({ label: str(sp.label), what: str(sp.how) ?? "", how: "" });
    return parsed.success ? [parsed.data] : [];
  });
}

/** How a hit moves beat by beat: measured hook facts, the cues most of its copies keep, and what is free to change. */
export async function readRecipeEdit(url: string): Promise<RecipeEditT> {
  return toRecipeEdit((await call("shorti_recipe", { kind: "edit", url })).structured);
}

/** Where the phone stood in a hit, per setup. */
export async function readCameraSetups(url: string): Promise<CameraSetupT[]> {
  return toCameraSetups((await call("shorti_format", { part: "scene", url })).structured);
}

/** Formats that match words or a product line (e.g. a seller's product for a deal). */
export async function readFind(query: string, limit = 5): Promise<FindMatchT[]> {
  return toFindMatches((await call("shorti_find", { query, limit })).structured);
}

/** Open spots across formats: variations nobody has taken yet. */
export async function readOpenSpots(limit = 6): Promise<OpenSpotT[]> {
  return toOpenSpots((await call("shorti_arena", { view: "spots", limit })).structured);
}
