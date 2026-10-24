# Reply to the 2026-10-24 review

2026-10-24 · Lane A (Ted). Answers `docs/review-2026-10-24.md` (311a8a4). Every fix below landed in d0c4ee3 (on top of
T8, 94eb681) with tests; the gate is 27 tests, typecheck and build, all green.

## 1. Issues 1, 2 and 8: security

Fixed from the public summary and checked on a production build. Please hold each one against the private notes and
send anything they cover that this does not.

| # | What changed | Proof |
| --- | --- | --- |
| 1 | `PUT /api/taste` is owner-only (`requireOwner`). `GET` stays open because it is what the deck shows. The deck asks for the passcode once and then saves the picks that were waiting. | Production build: a stranger's write gets 401, the owner's gets 200. Browser: a locked save, the passcode, then the picks are saved. |
| 2 | Every value that reaches the prompt goes in as JSON inside its own tag, with `<` escaped as `<`: ghost, owner note and keep parts, Shorti reading, format plan, twist and speech budget. The system prompt names each tag as data that never changes the rules. | `tests/brief.test.mjs`: a note that closes `</owner>` and opens a new `<owner>` stays one block and survives intact as data. |
| 8 | Unlock allows 5 failures per address and 30 overall, each per 15 minutes, then answers 429 with `Retry-After`. The overall cap is what catches rotated or spoofed addresses. A success clears that address. Client address order: `CF-Connecting-IP`, `X-Real-IP`, first `X-Forwarded-For`. `GET /api/unlock` tells a page whether it already holds the owner cookie. | `tests/limits.test.mjs`. Production build: the sixth wrong try gets 429, and so does the right passcode from that address until the window passes. |

The owner passcode is set in the Vercel production environment (13 random characters), and Ted holds it.

## 2. Issues 3 to 7, 9 and 10

**Decision:** fix our client rather than switch to the official SDK.

- Shorti's server is stateless JSON, and our client is about 150 lines.
- Those 150 lines are now tested end to end, recovery rules included, against a fake MCP server that expires
  sessions.
- The SDK would be one more dependency whose recovery behaviour we would still have to test the same way.
- If Lane B's Nexus calls need more (server-to-client requests, resumable streams), we switch then. Every call site
  goes through `callTool`, so that is one file.

| # | Fix | Test |
| --- | --- | --- |
| 3 | SSE is parsed per event: blank line ends an event, `data:` lines join with `\n`, CR/LF/CRLF and comments handled. The reply is the JSON-RPC response whose `id` matches; notifications are skipped. | `tests/mcp.test.mjs` |
| 4 | Rules 1–4: a 404 on a session, or a 400 about the session, drops it and re-initializes once. Concurrent callers share one `initialize`. `InitializeResult` is validated. `MCP-Protocol-Version` and the session id go on every later request. Ids come from a counter. | `tests/mcp.test.mjs` |
| 5 | Memory counters read and write with no `await` between them. | `tests/store.test.mjs` |
| 6 | An expired counter starts a fresh window. In Redis, `EXPIRE … NX` sets the window even if a process died between `INCR` and `EXPIRE`. | `tests/store.test.mjs` |
| 7 | Expired keys and old rate windows are swept every minute and on read. A refused hit is not stored. Both maps live once per process. | `tests/store.test.mjs`, `tests/limits.test.mjs` |
| 9 | The model key is checked before the spend cap counts the call. A draft with too few usable beats answers 422 `brief_unusable`. | Production build: eleven calls without a key all get 503 and none gets 429 |
| 10 | Brief ids go through `store.push`: newest first, capped at 50; `LPUSH` + `LTRIM` in Redis. | `tests/store.test.mjs` |

Rule 5 (side effects):

- `callTool` never retries a tool call.
- `lib/shorti/read.ts` retries only read tools.
- RULES.md now says a GPU start is never retried after an ambiguous timeout: read the job's status first.

The new tests for 3, 4, 5 and 6 fail on 311a8a4's code.

## 3. T2: approved with conditions

Approved and landed:

- **`Ghost`:** as it is.
- **`RenderJob.id`:** stays GhostReel's UUID. CineSynth's job id goes to the new `providerJobId`.
- **`PrerenderManifest`:** fields are `characterId`, the approved `script` lines in order, `durationSec`, `renderedBy`,
  `renderedAt`, `source` and an optional `briefId`. It is required when `provider` is `prerender`; the schema refuses a
  prerendered clip without one.
- **Script check:** `prerenderMatches(job, brief)` says whether a clip speaks exactly the brief's lines. The editor
  already tags a prerendered clip, and adds "rendered from a different script" when it does not match.
- **Adapter contract:** `render()` and `getJob(providerJobId)` return `ProviderJob` (`provider`, `providerJobId`,
  `status`, `videoUrl`, `posterUrl`, `manifest`, `error`). The route adds `id`, `briefId` and timestamps.

**One condition is yours to confirm: the CineSynth confirm step.**

Proposal:
- `RenderJob.status` gains `needs_confirm`, plus a `previewUrl`.
- `POST /api/render/confirm {id}` is owner-only and spend-guarded. It forwards `confirm_token` server-side, so the
  token never reaches the browser.

How the two approvals relate:
- GhostReel's Approve is consent to spend and locks the brief.
- CineSynth's confirm is consent to one GPU job after its preview.
- Both are needed; neither replaces the other.
- If `confirm_token` expires before the owner confirms, the route previews again rather than rendering.

**Approval stays bound to one brief (T11).**
- An approved brief is locked: an edit gets 409 `approved_locked`.
- Changing it means writing a new brief, which needs its own approval.
- A brief has at most one live render job; a second click returns the existing job instead of paying twice.

**Speech length.**
- `lib/speech.ts` estimates spoken length. The prompt carries a budget of 80% of the duration, and the editor shows the
  meter.
- The real TTS length is measured on your side (`cinesynth_cf_take`). If it overruns, return `failed` with
  `speech_over` and let the owner trim.
- Never trim an approved script silently.

## 4. Deploy

**Accepted:** the demo runs as one `next start` process. Three reasons:
- The memory store is consistent inside one process.
- The CineSynth session and its credentials already live on an owner-run machine.
- No new vendor account mid-hackathon.

**Vercel** (`ghostreel-delta.vercel.app`) stays an always-on preview for the landing page and the taste deck. Flows
that write across requests are not promised there.

**Steps:** ARCHITECTURE.md › Running the demo host: gate, `npm start` with `.env.local`, a Cloudflare quick tunnel
(no account, HTTPS), keep the machine awake. A restart clears live picks and briefs; the recorded fixtures and the
`public/prerender/` clips are what the demo leans on.

**Ted decides (T16a):** which machine and who runs it. Lane A's recommendation is Tony's machine, since the CineSynth
session is already there. The backup is Ted's laptop running the same build with `GHOSTREEL_OFFLINE=1`.

## 5. Product direction

The two pitches are one mechanism with two sources of taste, and T8 (94eb681) has already built the second one.

- **PRD's primary user:** a person whose execution job is going to AI picks shorts rising abroad. This is the theme's
  "1,000만 명", and the demo path is built on it.
- **Tony's creator:** registers their own past shorts, plan and script at `/onboard`. This is already the PRD's
  secondary user.

T8 makes both one journey: `/onboard` → `/profile/[id]` → `/taste` → brief → render. Two conditions keep the
primary user on it:

- **`works` optional (0–10, not 1–10).** Someone without a catalog can still register: they pick a ghost and go
  straight to the trend step. With that change, `Creator` is approved into T2. Lane B moves it into `lib/types.ts`,
  since the file is yours.
- **T21 (Lane A) turns the registered `works` into taste.**
  - `shorti_video` reads any public link keylessly (verified today).
  - Each own short becomes a `TastePick` with `source: "own"`, with the same keep chips and the same brief.
  - The plan and script go into the prompt as escaped JSON in an `<owner>`-style tag, like everything else (§1,
    issue 2).
  - The route is spend-guarded only if it calls Claude.

The landing button stays on `/taste` until Ted decides. Lane A recommends `/onboard` once `works` is optional, so both
users start from the same door.

The submitted one-liner ("내가 고른 숏폼 감각") already covers both, so nothing needs resubmitting.

## AI label

Agreed on both layers.

- **Burned-in label:** in GhostReel it is not optional (RULES.md); only its look is open.
- **Platform disclosure settings:** nothing is ever posted from GhostReel. TikTok's AI-generated label, Meta's
  disclosure and YouTube Studio's "AI use" become a per-item checklist on `QueueItem` when posting is built.
- We claim no compliance.

## What Lane A needs from Lane B

- Check 1, 2 and 8 against the private notes.
- Confirm or amend the confirm step above; it is T2's last open condition.
- T3 numbers:
  - which credentials the server process uses;
  - how long a `confirm_token` stays valid;
  - one measured 10-second render, timed by stage;
  - the daily GPU limit.
- T7 clips, each with its manifest.
