// Lane A. What pages and routes call. Live first, recorded fixture on failure or when GHOSTREEL_OFFLINE=1,
// always with provenance so the UI can say which one it is showing.
import "server-only";
import beauty from "@/fixtures/shorti/trending-beauty.json";
import fashion from "@/fixtures/shorti/trending-fashion.json";
import recordedFormats from "@/fixtures/shorti/formats.json";
import { enrich, readFormatPlan, readTrending, readVideo } from "./read.ts";
import { FormatPlan, TrendCard, VideoReading, type Sourced } from "../types.ts";
import { z } from "zod";

export const FIELDS = ["beauty", "fashion"] as const;
export type Field = (typeof FIELDS)[number];

const Recorded = z.object({
  recordedAt: z.string(),
  cards: z.array(TrendCard),
  readings: z.record(z.string(), VideoReading),
});
const fixtures: Record<Field, z.infer<typeof Recorded>> = {
  beauty: Recorded.parse(beauty),
  fashion: Recorded.parse(fashion),
};
const fixtureFormats = z.record(z.string(), FormatPlan).parse(recordedFormats.formats);

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

const readingsByVideo = new Map<string, z.infer<typeof VideoReading>>();
for (const f of Object.values(fixtures)) for (const [id, r] of Object.entries(f.readings)) readingsByVideo.set(id, r);

type Deck = { cards: z.infer<typeof TrendCard>[] };

export async function trending(field: Field): Promise<Sourced<Deck>> {
  const fallback = (): Sourced<Deck> => ({
    data: { cards: fixtures[field].cards },
    provenance: { source: "fixture", readAt: fixtures[field].recordedAt },
  });
  if (offline()) return fallback();
  try {
    return await cached(`trending:${field}`, async () => {
      const { cards } = await readTrending(field);
      const rich = await enrich(cards);
      for (const [id, r] of rich.readings) readingsByVideo.set(id, r);
      if (rich.cards.length < 4) throw new Error("shorti: too few cards");
      return { data: { cards: rich.cards }, provenance: { source: "live", readAt: new Date().toISOString() } } as const;
    });
  } catch (e) {
    console.warn(`[shorti] trending ${field} → fixture: ${(e as Error).message}`);
    return fallback();
  }
}

export async function reading(videoId: string, url: string): Promise<z.infer<typeof VideoReading> | null> {
  const known = readingsByVideo.get(videoId);
  if (known || offline()) return known ?? null;
  try {
    const { reading } = await cached(`video:${url}`, () => readVideo(url));
    readingsByVideo.set(videoId, { ...reading, videoId });
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
