// Lane A. What pages and routes call. Live first, recorded fixture on failure or when GHOSTREEL_OFFLINE=1,
// always with provenance so the UI can say which one it is showing.
import "server-only";
import beauty from "@/fixtures/shorti/trending-beauty.json";
import fashion from "@/fixtures/shorti/trending-fashion.json";
import beautyKo from "@/fixtures/shorti/trending-beauty.ko.json";
import fashionKo from "@/fixtures/shorti/trending-fashion.ko.json";
import recordedFormats from "@/fixtures/shorti/formats.json";
import recordedRecipes from "@/fixtures/shorti/recipes.json";
import { enrich, readCameraSetups, readFind, readFormatPlan, readOpenSpots, readRecipeEdit, readTrending, readVideo, withFilm, type ReadLang } from "./read.ts";
import { FormatPlan, RecipeEdit, TrendCard, VideoReading, type CameraSetup, type FindMatch, type OpenSpot, type Sourced } from "../types.ts";
import { z } from "zod";

export const FIELDS = ["beauty", "fashion"] as const;
export type Field = (typeof FIELDS)[number];

const Recorded = z.object({
  recordedAt: z.string(),
  cards: z.array(TrendCard),
  readings: z.record(z.string(), VideoReading),
});
// Recorded in each language Shorti speaks; a page in Korean shows Shorti's own Korean, never a translation.
const fixtures: Record<ReadLang, Record<Field, z.infer<typeof Recorded>>> = {
  en: { beauty: Recorded.parse(beauty), fashion: Recorded.parse(fashion) },
  ko: { beauty: Recorded.parse(beautyKo), fashion: Recorded.parse(fashionKo) },
};
const fixtureFormats = z.record(z.string(), FormatPlan).parse(recordedFormats.formats);
const fixtureRecipes = z.record(z.string(), RecipeEdit).parse(recordedRecipes.recipes); // by video url

const offline = () => process.env.GHOSTREEL_OFFLINE === "1";
const TTL_MS = 10 * 60_000;
const cache = new Map<string, { at: number; value: unknown }>();
async function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value as T;
  const value = await load();
  cache.set(key, { at: Date.now(), value });
  return value;
}

// Readings by language and video: `${lang}:${videoId}`.
const readingsByVideo = new Map<string, z.infer<typeof VideoReading>>();
for (const [lang, byField] of Object.entries(fixtures))
  for (const f of Object.values(byField)) for (const [id, r] of Object.entries(f.readings)) readingsByVideo.set(`${lang}:${id}`, r);

type Deck = { cards: z.infer<typeof TrendCard>[] };

export async function trending(field: Field, lang: ReadLang = "en"): Promise<Sourced<Deck>> {
  const fallback = (): Sourced<Deck> => ({
    data: { cards: fixtures[lang][field].cards },
    provenance: { source: "fixture", readAt: fixtures[lang][field].recordedAt },
  });
  if (offline()) return fallback();
  try {
    return await cached(`trending:${lang}:${field}`, async () => {
      const { cards } = await readTrending(field, lang);
      const rich = await enrich(cards, lang);
      for (const [id, r] of rich.readings) readingsByVideo.set(`${lang}:${id}`, r);
      if (rich.cards.length < 4) throw new Error("shorti: too few cards");
      return { data: { cards: rich.cards }, provenance: { source: "live", readAt: new Date().toISOString() } } as const;
    });
  } catch (e) {
    console.warn(`[shorti] trending ${field} → fixture: ${(e as Error).message}`);
    return fallback();
  }
}

export async function reading(videoId: string, url: string, lang: ReadLang = "en"): Promise<z.infer<typeof VideoReading> | null> {
  const known = readingsByVideo.get(`${lang}:${videoId}`);
  if (known || offline()) return known ?? null;
  try {
    const { reading: words, card } = await cached(`video:${lang}:${url}`, () => readVideo(url, lang));
    const reading = await cached(`film:${lang}:${url}`, () => withFilm({ ...words, videoId }, card.page, lang));
    readingsByVideo.set(`${lang}:${videoId}`, reading);
    return { ...reading, videoId };
  } catch {
    return null;
  }
}

export async function formatPlan(formatId: string): Promise<z.infer<typeof FormatPlan> | null> {
  const recorded = fixtureFormats[formatId];
  if (offline()) return recorded ?? null;
  try {
    return await cached(`format:${formatId}`, () => readFormatPlan(formatId));
  } catch {
    return recorded ?? null;
  }
}

/**
 * One hit as a card (its clip, poster, page), wherever it is known: a deck already read in this language, the
 * recorded decks, else Shorti's own read of the video. Null when Shorti has none.
 */
export async function hitCard(videoId: string, url: string, lang: ReadLang = "en"): Promise<z.infer<typeof TrendCard> | null> {
  for (const field of FIELDS) {
    const hit = cache.get(`trending:${lang}:${field}`)?.value as Sourced<Deck> | undefined;
    const card = hit?.data.cards.find((c) => c.videoId === videoId) ?? fixtures[lang][field].cards.find((c) => c.videoId === videoId);
    if (card) return card;
  }
  if (offline()) return null;
  try {
    const { card } = await cached(`video:${lang}:${url}`, () => readVideo(url, lang));
    return TrendCard.parse({ videoId, url, platform: "unknown", ...Object.fromEntries(Object.entries(card).filter(([, v]) => v !== undefined)) });
  } catch {
    return null;
  }
}

// Every reader below is a keyless Shorti read: no sign-in ever reaches a viewer. A miss returns null or [] and the
// caller carries on without it.

export async function recipeEdit(url: string): Promise<z.infer<typeof RecipeEdit> | null> {
  const recorded = fixtureRecipes[url] ?? null;
  if (offline()) return recorded;
  try {
    return await cached(`edit:${url}`, () => readRecipeEdit(url));
  } catch {
    return recorded;
  }
}

export async function cameraSetups(url: string, lang: ReadLang = "en"): Promise<CameraSetup[]> {
  if (offline()) return [];
  return cached(`scene:${lang}:${url}`, () => readCameraSetups(url, lang)).catch(() => []);
}

export async function findFormats(query: string, limit = 5): Promise<FindMatch[]> {
  if (offline() || !query.trim()) return [];
  return cached(`find:${limit}:${query.trim().toLowerCase()}`, () => readFind(query.trim(), limit)).catch(() => []);
}

export async function openSpots(limit = 6): Promise<OpenSpot[]> {
  if (offline()) return [];
  return cached(`spots:${limit}`, () => readOpenSpots(limit)).catch(() => []);
}
