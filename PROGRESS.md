# GhostReel — Progress

Newest first. Each entry: what is true now, what broke, what is next. Keep it short; long output goes in files.

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
- `GHOSTREEL_PASSCODE` in Vercel prod before any spend route ships (Ted).
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
