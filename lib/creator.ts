// Lane B. The creator who registers their own work (PRD change proposal, T8). Lives here until T2 moves the
// contract into lib/types.ts by agreement; nothing outside Lane B imports it yet.
import { z } from "zod";
import { Lang } from "./types.ts";

export const Market = z.enum(["US", "KR", "JP", "Global"]);
export type Market = z.infer<typeof Market>;

export const CreatorInput = z.object({
  name: z.string().trim().min(1).max(40),
  bio: z.string().trim().max(600).default(""),
  niche: z.string().trim().min(1).max(80),
  market: Market.default("US"),
  languages: z.array(Lang).min(1).max(4),
  ghostId: z.string().regex(/^[a-z0-9-]{1,40}$/), // the virtual human who performs; never the creator's own face
  works: z.array(z.string().trim().url().max(300)).min(1).max(10), // the creator's own past shorts
  plan: z.string().trim().max(4000).default(""), // a past plan or pitch, pasted as text
  script: z.string().trim().max(4000).default(""), // a past script, pasted as text
});
export type CreatorInput = z.infer<typeof CreatorInput>;

export const Creator = CreatorInput.extend({
  id: z.string().uuid(),
  createdAt: z.string(),
});
export type Creator = z.infer<typeof Creator>;

export const creatorKey = (id: string) => `creator:${id}`;
export const CREATOR_TTL = 60 * 60 * 24 * 7;
