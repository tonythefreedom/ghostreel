// Lane B. Signing in with the same Google account CineSynth uses, so GhostReel acts as that CineSynth user.
// The browser gets a Google ID token for CineSynth's own (public) client id; this server trades it at CineSynth for a
// CineSynth session token and keeps that token only in an httpOnly cookie. Every later CineSynth call, the result
// downloads included, carries it as a Bearer token. Nothing here is a GhostReel secret.
import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import { env } from "../env.ts";
import { OWNER_COOKIE, ownerToken } from "../guard.ts";
import { CinesynthAccount } from "../types.ts";

export const CINESYNTH_URL = (process.env.CINESYNTH_URL ?? "https://vs.newtype-ai.com").replace(/\/+$/, "");
export const SESSION_COOKIE = "gr_cs";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // CineSynth's session lasts 168 h

export class CinesynthAuthError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(`cinesynth auth: ${message}`);
    this.status = status;
  }
}

async function call(path: string, init: RequestInit & { token?: string; timeoutMs?: number } = {}): Promise<unknown> {
  const headers: Record<string, string> = { accept: "application/json" };
  if (init.body) headers["content-type"] = "application/json";
  if (init.token) headers.authorization = `Bearer ${init.token}`;
  const res = await fetch(`${CINESYNTH_URL}${path}`, { ...init, headers, cache: "no-store", signal: AbortSignal.timeout(init.timeoutMs ?? 10_000) });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = z.object({ detail: z.string() }).safeParse(body);
    throw new CinesynthAuthError(res.status, detail.success ? detail.data.detail : `HTTP ${res.status}`);
  }
  return body;
}

let clientId: string | null = null;
/** CineSynth's Google client id (public; the sign-in button needs it). */
export async function googleClientId(): Promise<string> {
  if (clientId) return clientId;
  const config = z.object({ google_client_id: z.string().min(10) }).parse(await call("/api/config"));
  clientId = config.google_client_id;
  return clientId;
}

/** Trades a Google ID token for a CineSynth session. A new email starts as "pending" until CineSynth approves it. */
export async function signInWithGoogle(credential: string): Promise<{ token: string; account: CinesynthAccount }> {
  const body = z
    .object({ token: z.string().min(20), user: CinesynthAccount })
    .parse(await call("/api/auth/google", { method: "POST", body: JSON.stringify({ credential }) }));
  return { token: body.token, account: body.user };
}

// Every owner-only write asks who is signed in (a swipe saves picks), so an answer is kept for half a minute.
const seen = new Map<string, { account: CinesynthAccount | null; until: number }>();
const SEEN_MS = 30_000;

/** The signed-in CineSynth user, or null when the token is missing, expired, pending or suspended. */
export async function currentAccount(token: string | undefined): Promise<CinesynthAccount | null> {
  if (!token) return null;
  const key = createHash("sha256").update(token).digest("hex");
  const hit = seen.get(key);
  if (hit && hit.until > Date.now()) return hit.account;
  let account: CinesynthAccount | null = null;
  try {
    account = CinesynthAccount.parse(z.object({ user: z.unknown() }).parse(await call("/api/auth/me", { token })).user);
  } catch {
    account = null;
  }
  if (seen.size > 500) seen.clear();
  seen.set(key, { account, until: Date.now() + SEEN_MS });
  return account;
}

/**
 * Tony (10-24): an approved CineSynth account is the owner, so no passcode is needed. The owner cookie Lane A's guard
 * already checks is set alongside the session; the passcode stays as a fallback. Without a passcode configured there
 * is no owner token to give, and the guard's own rule (dev open, prod closed) applies.
 */
export function ownerCookieFor(account: CinesynthAccount): { name: string; value: string } | null {
  const passcode = env.passcode();
  if (account.status !== "approved" || !passcode) return null;
  return { name: OWNER_COOKIE, value: ownerToken(passcode) };
}

/** Fetches one of the user's own CineSynth results (a link an MCP or job answer gave) with their session. */
export async function fetchMedia(url: string, token: string): Promise<Response> {
  const target = new URL(url);
  if (target.origin !== CINESYNTH_URL || !/^\/api\/mcp\/media\/[A-Za-z0-9_-]{8,64}$/.test(target.pathname)) {
    throw new CinesynthAuthError(400, "only CineSynth result links can be fetched");
  }
  const res = await fetch(target, { headers: { authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new CinesynthAuthError(res.status, `media HTTP ${res.status}`);
  return res;
}

// The signed-in user's CineSynth characters (their 3-view sets), so onboarding shows each performer's real picture.
// CineSynth lists every set and says which are complete; only a complete one can perform.
const CharacterRow = z.object({
  name: z.string().min(1),
  complete: z.boolean().optional(),
  thumbnail: z.string().nullish(),
});
export type AccountCharacter = { name: string; complete: boolean; thumbnail: string | null };

/** The account's characters, thumbnails as CineSynth URLs (on its own host only). */
export async function accountCharacters(token: string): Promise<AccountCharacter[]> {
  const body = z.object({ characters: z.array(z.unknown()).default([]) }).parse(await call("/api/characters", { token }));
  return body.characters.flatMap((raw) => {
    const row = CharacterRow.safeParse(raw);
    if (!row.success) return [];
    let thumbnail: string | null = null;
    try {
      const url = row.data.thumbnail ? new URL(row.data.thumbnail, CINESYNTH_URL) : null;
      thumbnail = url && url.origin === CINESYNTH_URL ? url.href : null;
    } catch {
      thumbnail = null;
    }
    return [{ name: row.data.name, complete: row.data.complete ?? false, thumbnail }];
  });
}

/** One character's thumbnail, fetched with the user's session: only a thumbnail the account's own list names. */
export async function characterThumb(name: string, token: string): Promise<Response> {
  const own = (await accountCharacters(token)).find((c) => c.name === name);
  if (!own?.thumbnail) throw new CinesynthAuthError(404, "no such character thumbnail");
  const res = await fetch(own.thumbnail, { headers: { authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new CinesynthAuthError(res.status, `thumbnail HTTP ${res.status}`);
  return res;
}

// ── Live render (Lane B, 10-24) ─────────────────────────────────────────────────────────────────────────────────
// CineSynth's own REST routes for a talking ad, called as the signed-in user (its MCP tools only take calls signed by
// the Nexus gateway). The same owner checks and GPU caps apply there. Each start returns a task id to poll.

/** A character's reference views: the full-body front (keyframe reference) and the face views (identity for S2V). */
export async function characterViews(name: string, token: string): Promise<{ front: string; faces: string[]; complete: boolean } | null> {
  const View = z.object({ path: z.string().min(1) }).passthrough();
  const Row = z.object({
    name: z.string(),
    complete: z.boolean().optional(),
    body_views: z.record(z.string(), z.unknown()).nullish(),
    face_views: z.record(z.string(), z.unknown()).nullish(),
  });
  const body = z.object({ characters: z.array(z.unknown()).default([]) }).parse(await call("/api/characters", { token }));
  for (const raw of body.characters) {
    const row = Row.safeParse(raw);
    if (!row.success || row.data.name !== name) continue;
    const path = (v: unknown) => View.safeParse(v).data?.path ?? null;
    const front = path(row.data.body_views?.front);
    if (!front) return null;
    const faces = Object.values(row.data.face_views ?? {}).map(path).filter((p): p is string => Boolean(p));
    return { front, faces, complete: row.data.complete ?? false };
  }
  return null;
}

const Started = z.object({ task_id: z.string().min(8) });

/** Step 1: the opening frame — the character in the scene. About a minute of GPU. */
export async function startKeyframe(token: string, scenePrompt: string, characterRef: string): Promise<string> {
  const body = JSON.stringify({ scene_prompt: scenePrompt, character_ref: characterRef });
  return Started.parse(await call("/api/cf/keyframe", { method: "POST", body, token, timeoutMs: 30_000 })).task_id;
}

/** Step 2: the voice take of the whole script, in the language's default voice. Seconds of GPU. */
export async function startTake(token: string, text: string, language: string): Promise<string> {
  const body = JSON.stringify({ text, language, voice_sample: `preset:${language}` });
  return Started.parse(await call("/api/cf/tts-preview", { method: "POST", body, token, timeoutMs: 30_000 })).task_id;
}

export class LipSyncUnavailable extends Error {}

/** Step 3: the lip-synced video (Wan-S2V) from the approved frame and take. Hours of GPU; refused up front (503) when
 * no GPU can hold it, with nothing started. */
export async function startTalking(token: string, args: {
  keyframe: string; take: string; text: string; language: string; scenePrompt: string;
  beats: { entry: string; delivery: string; exit: string }; faces: string[];
}): Promise<string> {
  const body = JSON.stringify({
    image: args.keyframe, keyframe_path: args.keyframe, audio_path: args.take, text: args.text, language: args.language,
    voice_sample: `preset:${args.language}`, scene_prompt: args.scenePrompt, motion_beats: args.beats, aspect: "9:16",
    frame_scale: 0.22, frame_cy: 0.22, face_refs: args.faces, seed: -1,
  });
  try {
    return Started.parse(await call("/api/cf/generate", { method: "POST", body, token, timeoutMs: 60_000 })).task_id;
  } catch (e) {
    if (e instanceof CinesynthAuthError && e.status === 503) throw new LipSyncUnavailable(e.message);
    throw e;
  }
}

export class TaskLost extends Error {}

export const TaskState = z.object({
  status: z.string(),
  progress: z.number().optional(),
  message: z.string().optional(),
  started_at: z.string().optional(),
  output_path: z.string().nullish(),
  keyframe: z.object({ path: z.string() }).passthrough().optional(),
  audio: z.object({ path: z.string(), duration: z.number().optional() }).passthrough().optional(),
}).passthrough();
export type TaskState = z.infer<typeof TaskState>;

/** A task's state. CineSynth keeps it in memory, so after its restart the task is gone: that is TaskLost. */
export async function taskStatus(token: string, taskId: string): Promise<TaskState> {
  try {
    return TaskState.parse(await call(`/api/status/${encodeURIComponent(taskId)}`, { token }));
  } catch (e) {
    if (e instanceof CinesynthAuthError && e.status === 404) throw new TaskLost(taskId);
    throw e;
  }
}

/** One of the user's own CineSynth files (uploads/… or outputs/…), with their session; CineSynth checks ownership. */
export async function fetchOwnFile(path: string, token: string): Promise<Response> {
  const rel = path.replace(/\\/g, "/").replace(/^.*?\/((?:uploads|outputs)\/)/, "$1").replace(/^\/+/, "");
  if (!/^(uploads|outputs)\/[A-Za-z0-9_\-/.]+$/.test(rel) || rel.split("/").some((s) => s === ".." || s === ".")) {
    throw new CinesynthAuthError(400, "only the user's uploads or outputs can be fetched");
  }
  const res = await fetch(`${CINESYNTH_URL}/${rel}`, { headers: { authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.timeout(120_000) });
  if (!res.ok) throw new CinesynthAuthError(res.status, `file HTTP ${res.status}`);
  return res;
}
