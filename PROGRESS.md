# GhostReel — Progress

Newest first. Each entry: what is true now, what broke, what is next. Keep it short; long output goes in files.

## 2026-10-24 · review 311a8a4 answered — fixes and T2

Done
- Lane B's review (docs/review-2026-10-24.md) answered in docs/review-2026-10-24-reply.md.
- Fixed and tested: 1 taste writes owner-only (+ unlock prompt in the deck), 2 every prompt input is escaped JSON
  in its own tag, 3 SSE per event + response by id, 4 session recovery on 404/400 with one shared initialize and
  `MCP-Protocol-Version`, 5 atomic memory counters, 6 fresh window after expiry, 7 swept stores and windows, refused
  hits not stored, 8 unlock limited per IP (5/15 min) and globally (30/15 min), 9 key check before the cap and 422 for
  unusable drafts, 10 brief ids pushed to a capped list. Reproductions for 3, 4, 5, 6 fail on the old code.
- T2 approved with conditions and landed: `providerJobId`, `PrerenderManifest` required for prerender,
  `prerenderMatches`; adapter returns `ProviderJob`; the editor tags prerendered clips and shows a speech meter.
- Deploy: the demo is one `next start` process behind a Cloudflare tunnel; Vercel stays a read-only preview.
- Verified on a production build: stranger taste write 401, sixth wrong passcode 429 (the right one too, from that IP),
  owner write 200, eleven brief calls without a key all 503 and never 429. Browser: locked save → passcode → saved.
- Gate: 27 tests, typecheck, build green.

Open
- Ted: demo machine and who runs it (T16a); `ANTHROPIC_API_KEY`.
- Lane B: confirm the CineSynth confirm step for T2's last condition; check fixes 1, 2, 8 against the private details.

## 2026-10-24 · T8 (B) — creator registration, first cut

Done
- `/onboard`: the creator's name, niche, background, market, languages, own past short links (1–10), a past plan
  and script as text, and the virtual human who performs (`GhostCard` grid from `listCharacters`).
- `POST /api/creator`: owner-only (`requireOwner`), same-origin check, 16 KB body cap, ghost must exist; stores a
  `Creator` for 7 days. No model or GPU, so no spend guard. No public GET: plans and scripts stay server-side.
- `/profile/[id]`: what was registered, the performer, and a "분석 준비 중 (T21)" tag until Lane A's StyleProfile
  route lands; its button goes on to `/taste` for the trend step.
- `lib/creator.ts` holds the `Creator` schema until T2 moves it into `lib/types.ts` by agreement.
- Verified in the browser at 375 px: fill → save → `/profile/<id>` shows both links and Yuna.

Open
- The landing page still links to `/taste`; pointing it at `/onboard` is Ted's call (PRD change proposal).

## 2026-10-24 · ops — owner passcode live

- `GHOSTREEL_PASSCODE` set in Vercel production (generated, 13 chars); Ted's copy is in `.env.local` (git-ignored).
  Verified on prod: wrong passcode 401, right one sets the owner cookie and owner-only routes open.
- Waiting on Ted: `ANTHROPIC_API_KEY` (prompt open in his terminal), then a redeploy and the live brief check.
- Still open: Redis in prod, without which a brief written by the API is not visible to its page.

## 2026-10-24 · T11 — brief editor and approve-to-render

Done
- `/brief/[id]` is an editor: hook, timed beats (add, remove, retime), outfit, scene, caption, hashtags, 10/15 s.
  Save keeps a draft; "승인하고 렌더" approves (locks the brief), then asks `/api/render` for one job.
- `PATCH /api/brief` is owner-only (`requireOwner`); `applyEdits` keeps ids fixed and refuses edits after approval.
- `/api/render` scaffolded for Lane B with the shared rules: approved only (409 otherwise), one job per brief (a
  second click never pays twice), spend guard; a render that cannot start is stored as a failed job and shown.
- Verified in the browser at 390 px on a `[dev]` seeded brief: edit → save → reload keeps it → approve → job
  `failed: newtype render not wired yet (T6)`; unapproved render 409; edit after approve 409.

Broke / learned
- Pages and route handlers load modules separately, so the memory store is now one process-wide map. On Vercel they
  are separate functions: **without Redis, a brief written by the API is not visible to its page.** Redis is now a
  must before the demo, not a nice-to-have.
- The Next dev badge covered the bottom action bar; `devIndicators: false`.

## 2026-10-24 · T10 — brief writer (live call pending a key)

Done
- `lib/brief.ts`: GhostReel's own prompt (Shorti reading + format plan + ghost + what the owner kept + intent),
  outside text fenced as data, the original creator never named; `finishBrief` clamps the draft into `Brief`. Tested.
- `lib/claude.ts`: `claude-opus-5-5`, effort `low`, zod structured output, server-side `fallbacks: "default"`.
- `/api/brief`: cheap checks first (body, ghost, kept pick), then `guardSpend`, then Claude. Verified on `next start`:
  not kept 409, locked 401, wrong passcode 401, unlock sets an httpOnly cookie, no key 503, burst 429.
- `/taste` ends in a brief starter (그대로 / 내 식대로 / 비틀기, passcode prompt when locked) → `/brief/[id]`.

Open
- No Anthropic key on this machine or in Vercel, so no live brief yet; the < 15 s check is the first thing to run.

## 2026-10-24 · T0 T4 T5 T9 — public boundary hardened, taste game live

Done
- Heritage surveyed in both private repos. Decision: Shorti is **called** through its public MCP, never copied;
  only UI patterns and simple shapes are ported, rewritten small (ARCHITECTURE.md › Heritage and the public boundary).
- Boundary enforced by `tests/boundary.test.mjs` (gate + CI + pre-commit), private names held only as SHA-256;
  proved by planting a private host and a fake key: both caught. `commit-msg` hook checks messages the same way.
- Spend guard for future Claude/GPU routes: owner passcode cookie, per-IP burst, daily cap; prod with no passcode
  spends nothing.
- `lib/types.ts` draft (zod), `lib/mcp.ts`, `lib/shorti/` with reduced fixtures; `/taste` swipe deck on live data
  (15 beauty cards with posters, hooks, counts read on 10.21), keep chips, undo, picks persist across reload.

Broke / learned
- Keyless `shorti_check` and `shorti_recipe kind: brief` need sign-in; `kind: remake` rejects every model name tried.
  The brief will be written from `shorti_video` + `shorti_format` readings instead (T10).
- Node strip-types rejects parameter properties: `erasableSyntaxOnly` is now on.

Open (owner)
- Upstash Redis for prod, or picks reset between serverless instances (A).
- T2 contract sign-off on `Ghost` / `RenderJob`; T3 NEWTYPE path (B).

## 2026-10-24 · T1 — scaffold live

Done
- Next.js 16.4.2 + React 19.3.1, TS strict (`typescript` = `@typescript/typescript6@6.0.2`, as Shorti's web, because
  Next's type check needs the JS compiler API), Tailwind 4.3.3, Node 24.
- DESIGN.md colour tokens in `app/globals.css`, exposed to Tailwind as `bg-bg`, `text-text-dim`, `bg-accent`,
  `text-ghost`, …; `tests/tokens.test.mjs` fails if the two drift. Pretendard Variable (local) + JetBrains Mono.
- `npm run gate` = typecheck + `node --test` + `next build`: green (1 test, 0 fail).
- Prod: **https://ghostreel-delta.vercel.app** (200, public). Vercel project `ghostreel` in team `shorti`, deployed
  with `vercel deploy --prod` from Ted's machine. `ghostreel.vercel.app` belongs to someone else.
- Landing page is a dark placeholder; its button reads "준비 중" until `/onboard` lands (T8).

Broke
- Nothing. `turbopack.root` is pinned in `next.config.mjs` because a stray `~/package-lock.json` was taken as root.

Next
- T2 (A+B) `lib/types.ts`; T3 (B) NEWTYPE path; T4 (A) Shorti fixtures.
- Teammate: to deploy, ask Ted for a seat on the `shorti` Vercel team, or Ted deploys from green `master`.

## 2026-10-24 · H0 — kickoff

Done
- Mission and one-line idea written and handed to Ted for submission (they live in PRD.md › Submission).
- The six docs landed: PRD, ARCHITECTURE, DESIGN, RULES, TASKS, PROGRESS.
- Shorti public MCP verified from a server, no key: `POST https://shorti.ai/mcp` `initialize` → 200,
  `tools/list` → `shorti_video`, `shorti_format`, `shorti_what_to_shoot`, `shorti_find`, `shorti_check`,
  `shorti_recipe`, `shorti_arena`.
- Repo `tonythefreedom/ghostreel`: public, default branch `master`, Ted has push.

Broke
- Nothing yet.

Open (owner)
- NEWTYPE server path: endpoint, token, real render latency per format (B, T3).
- Whether `shorti_check` works keyless or needs a signed-in token (A, T14).
- Upstash Redis provisioned or in-memory for the demo (A, T1).
- Brand: DESIGN.md is a working proposal; Ted decides.

Next
- T1 (A) scaffold and first prod deploy; T2 (A+B) agree `lib/types.ts`; T3 (B) NEWTYPE path.
