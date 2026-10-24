// Lane A. Live reads from Shorti's public, keyless MCP, reduced to GhostReel's own types.
// Node-safe (no Next imports) so scripts/record-shorti.ts can reuse it.
import { callTool, type ToolResult } from "../mcp.ts";
import {
  CameraSetup,
  PencilMark,
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

/** «0:03» or «0:03.7» → seconds; a range «0:01–0:03» takes its start. */
export function seconds(at: string | undefined): number | undefined {
  const m = /^(\d+):(\d{1,2}(?:\.\d+)?)/.exec((at ?? "").trim());
  return m ? Number(m[1]) * 60 + Number(m[2]) : undefined;
}

export function toVideoReading(structured: unknown): { reading: VideoReadingT; card: Partial<TrendCardT> } {
  const v = obj(obj(structured).video);
  const shoot = obj(v.to_shoot);
  const hit = obj(obj(obj(structured).context).hit);
  const reading = VideoReading.parse({
    videoId: str(v.video_id) ?? "",
    hook: str(v.hook),
    turn: str(v.turn),
    whatHappens: str(v.what_happens),
    beats: arr(v.beats).map((b) => ({ at: str(obj(b).at) ?? "", do: str(obj(b).do) ?? "" })),
    checklist: arr(v.checklist).filter((x): x is string => typeof x === "string"),
    needs: arr(shoot.needs).filter((x): x is string => typeof x === "string"),
    props: arr(shoot.props).filter((x): x is string => typeof x === "string"),
    cues: arr(v.cues).flatMap((raw) => {
      const c = obj(raw);
      const t = seconds(str(c.at));
      const cue = str(c.cue);
      return t !== undefined && cue ? [{ t, cue, do: str(c.do) ?? "", look: strs(c.look_at).slice(0, 3) }] : [];
    }),
    cuts: arr(obj(hit.clock).cuts_s).filter((x): x is number => typeof x === "number" && Number.isFinite(x)),
  });
  const card: Partial<TrendCardT> = {
    by: str(v.by),
    views: num(v.views),
    viewsAsOf: str(v.views_as_of),
    posterUrl: str(v.poster),
    clipUrl: str(hit.clip),
    page: str(v.page),
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

// ── the coaching film: a hit's cues with their marks on the frame ──

// Shorti's MCP says each cue in words; where on the frame it points is published with the video's public page, as
// its film (`/v/<slug>/film`, keyless, the same data Shorti's own pencil draws from). A plain GET on that page's
// host; nothing else is read from it.
export const SHORTI_SITE = new URL(SHORTI_MCP).origin;

const share = (v: unknown) => typeof v === "number" && Number.isFinite(v) && v >= -0.05 && v <= 1.05;
const SHAPES = new Set(["box", "circle", "outline", "line", "arrow", "bracket"]);

/** A film's cues as GhostReel reads them, in one language; the slug is the video page's last segment. */
export function toFilmCues(film: unknown, lang: ReadLang): VideoReadingT["cues"] {
  const word = (v: unknown) => str(obj(v)[lang]) ?? str(obj(v).en) ?? str(v);
  return arr(obj(obj(film).cues).cues).flatMap((raw) => {
    const c = obj(raw);
    const t = num(c.t);
    const cue = word(c.title);
    if (t === undefined || !cue) return [];
    const marks = arr(c.marks).flatMap((m) => {
      const k = obj(m);
      const shape = str(k.shape);
      if (!shape || !SHAPES.has(shape)) return [];
      const box = arr(k.box);
      const pts = arr(k.pts).filter((p) => Array.isArray(p) && p.length === 2 && share(p[0]) && share(p[1])) as [number, number][];
      const parsed = PencilMark.safeParse({
        shape,
        box: box.length === 4 && box.every(share) ? box : undefined,
        pts: pts.length >= 2 ? pts.map(([x, y]) => [x, y]) : undefined,
        label: word(k.label),
      });
      return parsed.success && (parsed.data.box || parsed.data.pts) ? [parsed.data] : [];
    });
    return [{ t: t / 1000, cue, do: word(c.say) ?? "", look: marks.flatMap((m) => (m.label ? [m.label] : [])).slice(0, 3), marks: marks.slice(0, 4) }];
  });
}

/** The film of a video by its Shorti page; empty when the page has none or Shorti is unreachable. */
export async function readFilm(page: string | undefined, lang: ReadLang): Promise<VideoReadingT["cues"]> {
  const slug = page?.split("?")[0]?.split("/").filter(Boolean).pop();
  if (!slug || !/^[a-z]+_[A-Za-z0-9_-]+$/.test(slug)) return [];
  const res = await fetch(`${SHORTI_SITE}/v/${slug}/film`, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(10_000) });
  if (!res.ok) return [];
  return toFilmCues(await res.json(), lang);
}

/** A reading whose cues carry their marks: the film's cues when it has them, else the words-only cues. */
export async function withFilm(reading: VideoReadingT, page: string | undefined, lang: ReadLang): Promise<VideoReadingT> {
  const film = await readFilm(page, lang).catch(() => []);
  return film.length ? { ...reading, cues: film } : reading;
}

// ── live reads ──

export type ReadLang = "en" | "ko";

// The season the deck leans into this week (10-24: a week before Halloween). Shorti's find reads it keyless.
export const SEASON = { key: "halloween", query: "halloween", tag: { ko: "할로윈", en: "Halloween" } } as const;
export const DECK_MAX = 20;

/** Every format Shorti described in an answer, by id: its lineage (number, videos, stage, how long it has run). */
export function toLineages(structured: unknown): Map<string, NonNullable<TrendCardT["lineage"]>> {
  const s = obj(structured);
  const out = new Map<string, NonNullable<TrendCardT["lineage"]>>();
  const lists = [s.formats, s.formats_many_are_shooting, s.rising_abroad_not_in_korea, obj(s.this_week).formats];
  for (const raw of lists.flatMap(arr)) {
    const f = obj(raw);
    const id = str(f.format_id);
    if (!id) continue;
    out.set(id, { number: str(f.number), videos: num(f.videos), stage: str(obj(f.stage).words), ride: str(f.ride) });
  }
  for (const raw of arr(s.today)) {
    const f = obj(obj(raw).format);
    const id = str(f.format_id);
    if (id && !out.has(id) && num(f.videos)) out.set(id, { videos: num(f.videos) });
  }
  return out;
}

/** A find answer's formats as cards: each format's strongest video, with its lineage. */
export function toFormatCards(structured: unknown, tag?: string, season?: string): TrendCardT[] {
  return arr(obj(structured).formats).flatMap((raw) => {
    const f = obj(raw);
    const ex = obj(f.example);
    const card = TrendCard.safeParse({
      videoId: str(ex.video_id),
      url: str(ex.url),
      platform: str(ex.platform) ?? "unknown",
      by: str(ex.by),
      tag,
      formatId: str(f.format_id),
      formatTitle: str(f.title),
      formatKind: str(f.same),
      views: num(ex.views),
      viewsAsOf: str(ex.views_as_of) ?? str(ex.posted),
      posterUrl: str(ex.poster),
      whatHappens: str(f.idea),
      season,
      lineage: { number: str(f.number), videos: num(f.videos), ride: str(f.ride) },
    });
    return card.success ? [card.data] : [];
  });
}

/**
 * This week's deck for a field: the radar (rising abroad), this week's hits, and the season's formats (Halloween),
 * merged without repeats, the season's first card leading and the rest spread through. Each card carries its format's
 * lineage when Shorti counted one. Three keyless reads; any one failing leaves the others.
 */
export async function readTrending(field: string, lang: ReadLang = "en"): Promise<{ cards: TrendCardT[]; asOf?: string }> {
  const category = field === "fashion" ? "fashion" : "beauty";
  const [radar, week, season] = await Promise.all([
    call("shorti_what_to_shoot", { lens: "radar", field, limit: 10, lang }).catch(() => null),
    call("shorti_what_to_shoot", { lens: "week", category, limit: 10, lang }).catch(() => null),
    call("shorti_find", { query: SEASON.query, category, limit: 6, lang }).catch(() => null),
  ]);
  if (!radar && !week) throw new Error("shorti: no deck");
  const lineages = new Map([...toLineages(season?.structured), ...toLineages(week?.structured), ...toLineages(radar?.structured)]);
  const seasonal = season ? toFormatCards(season.structured, SEASON.tag[lang], SEASON.key) : [];
  const rest = [...(radar ? toTrendCards(radar.structured) : []), ...(week ? toTrendCards(week.structured) : [])];
  const merged: TrendCardT[] = [];
  const seen = new Set<string>();
  const add = (c: TrendCardT | undefined) => {
    if (!c || seen.has(c.url) || seen.has(c.videoId)) return;
    seen.add(c.url);
    seen.add(c.videoId);
    const lineage = c.lineage ?? (c.formatId ? lineages.get(c.formatId) : undefined);
    merged.push(lineage ? { ...c, lineage: { ...lineages.get(c.formatId ?? ""), ...c.lineage, ...lineage } } : c);
  };
  // The season leads, then one season card every third place while they last.
  add(seasonal[0]);
  let s = 1;
  for (const c of rest) {
    if (merged.length % 3 === 0 && seasonal[s]) add(seasonal[s++]);
    add(c);
  }
  while (seasonal[s]) add(seasonal[s++]);
  return { cards: merged.slice(0, DECK_MAX), asOf: str(obj(radar?.structured ?? week?.structured).as_of) };
}

export async function readVideo(url: string, lang: ReadLang = "en") {
  return toVideoReading((await call("shorti_video", { url, lang })).structured);
}

export async function readFormatPlan(formatId: string) {
  return toFormatPlan((await call("shorti_format", { format_id: formatId, part: "flow" })).structured);
}

// Enrich cards with posters and hooks, four at a time to stay well under the keyless rate limit.
export async function enrich(cards: TrendCardT[], lang: ReadLang = "en"): Promise<{ cards: TrendCardT[]; readings: Map<string, VideoReadingT> }> {
  const readings = new Map<string, VideoReadingT>();
  const out = [...cards];
  for (let i = 0; i < out.length; i += 4) {
    await Promise.all(
      out.slice(i, i + 4).map(async (c, j) => {
        try {
          const { reading, card } = await readVideo(c.url, lang);
          const merged = TrendCard.parse({ ...c, ...Object.fromEntries(Object.entries(card).filter(([, v]) => v !== undefined)) });
          out[i + j] = merged;
          readings.set(c.videoId, await withFilm({ ...reading, videoId: c.videoId }, merged.page, lang));
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
      tMs: num(u.t_ms) ?? 0, mount: str(u.mount), move: str(u.move), height: str(u.height), distM: num(u.dist_m),
      heightM: num(u.height_m), tiltDeg: num(u.tilt_deg), vfovDeg: num(u.vfov_deg), zoom: num(u.zoom),
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
export async function readCameraSetups(url: string, lang: ReadLang = "en"): Promise<CameraSetupT[]> {
  return toCameraSetups((await call("shorti_format", { part: "scene", url, lang })).structured);
}

/** Formats that match words or a product line (e.g. a seller's product for a deal). */
export async function readFind(query: string, limit = 5): Promise<FindMatchT[]> {
  return toFindMatches((await call("shorti_find", { query, limit })).structured);
}

/** Open spots across formats: variations nobody has taken yet. */
export async function readOpenSpots(limit = 6): Promise<OpenSpotT[]> {
  return toOpenSpots((await call("shorti_arena", { view: "spots", limit })).structured);
}
