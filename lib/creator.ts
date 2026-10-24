// Lane B. Where a registered creator (T8) is kept; the contract itself lives in lib/types.ts.
export const creatorKey = (id: string) => `creator:${id}`;
export const creatorsKey = (accountId: number) => `creators:${accountId}`; // the account's creators, newest first
export const CREATOR_TTL = 60 * 60 * 24 * 7;

// Ten judges sign in at once (Ted, 10-24): each signed-in account keeps its own picks and briefs. The passcode owner
// (no account) keeps the shared keys the demo seeded.
export const tasteKey = (ghostId: string, accountId?: number | null) => (accountId ? `taste:${accountId}:${ghostId}` : `taste:${ghostId}`);
export const accountBriefsKey = (accountId: number) => `briefs:acct:${accountId}`; // newest first, every ghost
export const ghostBriefsKey = (ghostId: string) => `briefs:${ghostId}`; // the ghost's public channel
