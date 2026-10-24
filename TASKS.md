# GhostReel — Tasks

One task at a time per lane. Each has a done line; a task is done when that line is true on the deployed URL or in
the gate output. Hours count from the start (H0). Lane A = loop and Shorti, Lane B = ghost and render (RULES.md).

## H0–H1 — Foundation (upstream first)

- [x] **T0 · A** Public-boundary hardening: hashed denylist, secret scan, adapter rules, fixture allowlist, pre-commit
  and commit-msg hooks, CI gate, spend guard (owner passcode, burst, daily cap).
- [x] **T1 · A** Scaffold Next.js 16 + TS strict + Tailwind v4, DESIGN.md tokens in `globals.css`, Pretendard,
  `npm run gate`, `.env.example`. Done: `gate` green, empty dark page deployed to Vercel prod.
- [~] **T2 · A+B** `lib/types.ts` (zod) landed as a draft from the live Shorti shapes. Done when Lane B agrees or amends `Ghost` and `RenderJob`.
- [ ] **T3 · B** Confirm the NEWTYPE path from a server: endpoint, token, character list, a render's real latency.
  Done: one line each in PROGRESS.md.
- [x] **T4 · A** Reduced Shorti fixtures for beauty and fashion (cards, readings, format plans) via `npm run record:shorti`.

## H1–H3 — Two lanes in parallel

- [x] **T5 · A** `lib/mcp.ts` + `lib/shorti/` (keyless, `lang: 'en'`, 4-wide enrich with backoff, cache, fixture
  fallback with provenance). Pages call it server-side; no public proxy route.
- [ ] **T6 · B** `lib/newtype/` `listCharacters` + `render` + `getJob` (stub with roster is there). `/api/render` is
  scaffolded with the shared rules (approved only, one job per brief, spend guard); fill the adapter, own the route.
  Done: a curl starts a real render and polls it to `done` with a `videoUrl`.
- [ ] **T7 · B** Start 3 real renders now (Yuna, English, 10 s, from the T4 format) so finished clips exist by H5;
  save them to `public/prerender/`. Done: three AI-labelled MP4s committed or linked.
- [ ] **T8 · A** `/onboard`: `GhostCard` grid from `listCharacters` (fixture until T6 lands), niche, market, language.
  Done: choosing a ghost stores it and routes to `/taste`.
- [x] **T9 · A** `/taste`: swipe deck (drag, ←/→, Z undo), keep chips, picks via `/api/taste`. 15 live cards; picks
  survive reload (memory store in dev; prod needs Redis for the same).

## H3–H5 — The brief and the render

- [~] **T10 · A** `lib/claude.ts` + `lib/brief.ts` + `/api/brief` (spend-guarded) + brief starter (keep / adapt / twist)
  + read-only `/brief/[id]`. Guards verified on a prod build. Open: the live < 15 s check needs `ANTHROPIC_API_KEY`.
- [x] **T11 · A** `/brief/[id]` editor (hook, timed beats ±, outfit, scene, caption, hashtags, 10/15 s), owner-only
  `PATCH /api/brief`, approve locks it, then `POST /api/render`. Verified: unapproved → 409, approved → a `RenderJob`
  (failed honestly until T6), edits after approval → 409.
- [ ] **T12 · B** `ReelPlayer` + `RenderJob` components: poll, shimmer, AI label pill always on, `prerender` tag.
  Done: a finished render plays on a phone-width screen with the label visible.

## H5–H6 — Channel

- [ ] **T13 · A** `/ghost/[id]`: reels grid, `QueueWeek` (7 slots), Approve per item via `/api/queue`.
  Done: approving a slot persists; nothing calls a posting API.
- [ ] **T14 · A** Keyless `shorti_check` hands off to a Shorti page (verified). Show that hand-off link on a done
  render, labelled; no inline fixes promised.
- [ ] **T15 · B** `DealCard`: product photo → `fitProduct` → queued short, money shown with `demo` tag.
  Done: one deal visible in the queue.

## H6–H7 — Stage-proofing

- [ ] **T16 · A+B** Full run on prod with `GHOSTREEL_OFFLINE` unset, then with it set. Done: both runs complete the
  demo script in PRD.md without a dead end.
- [ ] **T17 · A** Korean / English toggle on all copy; captions in English + one more language. Done: toggle works.
- [ ] **T18 · B** Mobile pass at 390 px: no horizontal scroll, label never clipped. Done: screenshots in PROGRESS.md.

## H7–H8 — Pitch

- [ ] **T19 · A+B** Rehearse the 3-minute script twice on the prod URL from a phone; fix only what breaks the run.
- [ ] **T20 · A** Freeze: tag `hackathon-final`, record the prod URL and a 60 s screen capture in PROGRESS.md.
