# GhostReel — Architecture

One Next.js app on Vercel. It owns no models and no video pipeline: Shorti reads short-form, NEWTYPE renders the
ghost, Claude writes the brief. GhostReel is the loop, the taste record, and the channel.

## Heritage and the public boundary

This repo is public. The team's private products have years of know-how; GhostReel shows their *output*, never
their *insides*.

- **Call, never copy.** Every reading of short-form (hooks, beats, cues, formats, open spots, counts) comes from
  Shorti's public, keyless MCP at `https://shorti.ai/mcp` at run time. No engine, measurement, scoring, prompt,
  corpus, schema, pipeline, or infra code from any private repo enters this one, rewritten or not.
- **Port patterns, rewritten small.** What we take from the private repos is UI and simple shapes, re-written
  from scratch here: the pick-the-breakout game as a swipe deck with hotkeys and undo; the 9:16 hit card; the
  honest count line ("platform count · read on 10.21"); 만/억 and K/M with three significant digits; KO/EN words
  side by side; a three-way "how close to the original" sheet (keep / adapt / twist); a persona avatar with a job
  ring; timed say/do lines; a seven-part shot card (camera, subject, action, setting, lighting, audio, avoid).
- **Fixtures are reduced.** `scripts/record-shorti.ts` stores only GhostReel's own types (fields on the allowlist
  in `tests/boundary.test.mjs`), never raw answers, UI resources, or internal links.
- **Enforced, not trusted.** `tests/boundary.test.mjs` runs in the gate, in CI, and as a pre-commit hook. It fails
  on: a private name (held only as SHA-256 in `tests/deny.sha256`) in any file or commit message; secrets; private
  file types; absolute local paths; a page or component calling an outside host; a provider host named outside its
  adapter; a secret env name read outside `lib/env.ts`; a fixture field off the allowlist or over 64 KB.

## Stack

| Layer | Choice | Why |
| --- | --- | --- |
| App | Next.js 16.4 (App Router), React 19, TypeScript strict (`erasableSyntaxOnly`), Node 24 | Server routes keep keys off the client; Node runs `lib/` TS directly for scripts and tests. |
| Style | Tailwind CSS v4 on DESIGN.md tokens | Fastest consistent mobile UI. |
| Contracts | zod 4 in `lib/types.ts` | Every outside answer and request body is parsed at the edge. |
| Short-form data | Shorti public MCP, keyless (`lib/mcp.ts` ~90-line client, JSON or SSE) | Verified 2026-10-24: stateless, plain JSON; keyless limit 20 req/s per IP, so enrich 4 at a time with backoff. |
| Ghost render | NEWTYPE CineSynth on Nexus, endpoint and token from env (`lib/newtype/`) | Production characters, voice consent, AI label, watermark. |
| Brief and captions | Claude via `@anthropic-ai/sdk`, `claude-sonnet-5-5` (`lib/claude.ts`, T10) | Fast enough for a live edit loop; multilingual captions. |
| State | Upstash Redis over REST when env is set, process memory otherwise (`lib/store.ts`) | No schema in an 8-hour build. Memory resets between serverless instances, so prod wants Redis. |
| Deploy | `vercel deploy --prod` from a teammate machine; CI runs the gate on every push | Ted has push, not admin, on the repo. |

## What Shorti answers keyless (and what it does not)

| Tool | GhostReel use | Keyless |
| --- | --- | --- |
| `shorti_what_to_shoot` `lens: radar`, `field` | the swipe deck: rising shorts abroad, with format | yes |
| `shorti_video` `url` | poster, hook, turn, beats, checklist, needs, props: the brief's raw material | yes |
| `shorti_format` `part: flow` | the format's one-line move and its open spots (the "twist") | yes |
| `shorti_format` `part: scene` `url` | camera setups of a hit | yes (not used yet) |
| `shorti_arena` `view: spots` | open spots across formats | yes (not used yet) |
| `shorti_check` | a take or post check | **no**: hands off to a Shorti page; show the link, promise nothing inline |
| `shorti_recipe` `kind: brief` / `remake` | product brief, character remake | **no** (sign-in) / model name unresolved |

## Folders

```
app/
  page.tsx                    landing → /taste
  taste/page.tsx              the daily game (live Shorti deck, fixture fallback)
  brief/…  ghost/…            T11, T13
  api/taste/route.ts          GET/PUT picks (cheap, size-capped)
  api/unlock/route.ts         owner passcode → httpOnly cookie
  api/brief, api/render, …    spend routes: always behind lib/guard.ts
components/                   TrendCard, TrustLine, TasteSwipe, … (DESIGN.md names)
lib/
  types.ts                    contracts (zod); change by agreement
  mcp.ts                      minimal MCP client
  shorti/read.ts              Lane A: live reads + reducers (Node-safe, used by the recorder)
  shorti/index.ts             Lane A: what pages call: cache, fixture fallback, provenance
  newtype/index.ts            Lane B: roster, render, job status
  claude.ts                   Lane A: brief and captions (T10)
  env.ts                      the only reader of secrets (server-only)
  guard.ts                    spend guard: owner cookie, per-IP burst, daily cap
  store.ts                    Redis or memory
  words.ts                    KO/EN copy, counts, KST dates
fixtures/shorti/              reduced, recorded Shorti answers (offline + tests)
fixtures/newtype/             roster and recorded jobs (Lane B)
scripts/record-shorti.ts      re-record fixtures: npm run record:shorti
scripts/deny.mjs              hashed denylist: hash a term, check a file
tests/                        node --test: boundary, tokens, words, …
.githooks/                    pre-commit (boundary), commit-msg (denylist); installed by npm install
.github/workflows/gate.yml    CI: npm ci && npm run gate
```

## Data flow

```
 person               GhostReel (Next.js on Vercel)                              outside
 swipe keep/skip ──▶ /taste ── shorti.trending(field) ── what_to_shoot(radar) + video(url)×n ──▶ Shorti
                       │         picks ── PUT /api/taste ──▶ store
 approve brief ────▶ /brief ── shorti.reading + formatPlan ──▶ Claude (guarded) ──▶ Brief draft → person edits, approves
                       └────── POST /api/render (guarded) ── newtype.render(brief) ──────────────▶ CineSynth on Nexus
                               GET /api/render?id= ◀── status, videoUrl (AI label burned in)
 approve post ─────▶ /ghost ── POST /api/queue (state only; nothing is ever posted from GhostReel)
```

## Contracts

`lib/types.ts` is the single home: `Ghost`, `TrendCard`, `VideoReading`, `FormatPlan`, `OpenSpot`, `TastePick`,
`Brief`, `RenderJob`, `QueueItem`, and `Sourced<T>` (data + provenance: `live` or `fixture`, and when it was read).

## Environment

| Name | Used by |
| --- | --- |
| `ANTHROPIC_API_KEY` | `lib/claude.ts` via `lib/env.ts` |
| `NEWTYPE_MCP_URL`, `NEWTYPE_TOKEN` | `lib/newtype/` via `lib/env.ts` (teammate supplies) |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | `lib/store.ts` |
| `GHOSTREEL_PASSCODE` | `lib/guard.ts`; unset in prod = no spend at all |
| `GHOSTREEL_DAILY_CAP` | spend calls per day, default 40 |
| `SHORTI_MCP_URL` | defaults to the public MCP |
| `GHOSTREEL_OFFLINE=1` | adapters serve fixtures only (CI, stage fallback) |

## Gate

`npm run gate` = `tsc --noEmit` + `node --test tests/**/*.test.mjs` + `next build`. Green `master` deploys to prod.
