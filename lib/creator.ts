// Lane B. Where a registered creator (T8) is kept; the contract itself lives in lib/types.ts.
export const creatorKey = (id: string) => `creator:${id}`;
export const CREATOR_TTL = 60 * 60 * 24 * 7;
