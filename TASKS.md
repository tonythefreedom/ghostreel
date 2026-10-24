# GhostReel — Tasks

One task at a time per lane. Each has a done line; a task is done when that line is true on the deployed URL or in
the gate output. Hours count from the start (H0). Lane A = loop and Shorti, Lane B = ghost and render (RULES.md).

## H0–H1 — Foundation (upstream first)

- [ ] **T1 · A** Scaffold Next.js 16 + TS strict + Tailwind v4, DESIGN.md tokens in `globals.css`, Pretendard,
  `npm run gate`, `.env.example`. Done: `gate` green, empty dark page deployed to Vercel prod.
- [ ] **T2 · A+B** Land `lib/types.ts` exactly as ARCHITECTURE.md, both lanes agree. Done: merged on `master`.
- [ ] **T3 · B** Confirm the NEWTYPE path from a server: endpoint, token, character list, a render's real latency.
  Done: one line each in PROGRESS.md.
- [ ] **T4 · A** Record real Shorti answers (`shorti_what_to_shoot` lens radar for 2 niches, `shorti_format` flow and
  scene, `shorti_recipe` scene) into `fixtures/shorti/`. Done: files committed, shapes noted in `lib/shorti.ts`.

## H1–H3 — Two lanes in parallel

- [ ] **T5 · A** `lib/shorti.ts` MCP client (keyless, `lang: 'en'`, fixture fallback) + `/api/shorti/trending`.
  Done: route returns ≥8 `TrendCard` live; with `GHOSTREEL_OFFLINE=1` returns the fixture marked offline.
- [ ] **T6 · B** `lib/newtype.ts` `listCharacters` + `render` + `getJob`; `/api/render` POST/GET.
  Done: a curl starts a real render and polls it to `done` with a `videoUrl`.
- [ ] **T7 · B** Start 3 real renders now (Yuna, English, 10 s, from the T4 format) so finished clips exist by H5;
  save them to `public/prerender/`. Done: three AI-labelled MP4s committed or linked.
- [ ] **T8 · A** `/onboard`: `GhostCard` grid from `listCharacters` (fixture until T6 lands), niche, market, language.
  Done: choosing a ghost stores it and routes to `/taste`.
- [ ] **T9 · A** `/taste`: `TasteSwipe` + `KeepChips`, picks saved through `lib/store.ts`. Done: 8 live cards swipe,
  picks persist across reload.

## H3–H5 — The brief and the render

- [ ] **T10 · A** `lib/claude.ts` + `/api/brief`: taste + format plan + ghost → `Brief` JSON (schema-checked).
  Done: brief for a kept card in < 15 s, valid against the type.
- [ ] **T11 · A** `/brief/[id]`: `BriefSheet`, inline line edits, Approve → POST `/api/render`. Done: an approved
  brief creates a `RenderJob`; an unapproved one cannot.
- [ ] **T12 · B** `ReelPlayer` + `RenderJob` components: poll, shimmer, AI label pill always on, `prerender` tag.
  Done: a finished render plays on a phone-width screen with the label visible.

## H5–H6 — Channel

- [ ] **T13 · A** `/ghost/[id]`: reels grid, `QueueWeek` (7 slots), Approve per item via `/api/queue`.
  Done: approving a slot persists; nothing calls a posting API.
- [ ] **T14 · A** `/api/shorti/check` + `FixList` on a done render. Done: ≤3 fixes shown, or an honest "check
  unavailable" if Shorti needs sign-in for it.
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
