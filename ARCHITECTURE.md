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
| Short-form data | Shorti public MCP, keyless, through `lib/mcp.ts`: Streamable HTTP 2025-06-18 (one shared initialize per URL, `MCP-Protocol-Version` and session headers, 404/400 session recovery, SSE parsed per event, response matched by id) | Stateless JSON today; the client also handles sessions and SSE so Lane B can reuse it. Keyless limit 20 req/s per IP, so enrich 4 at a time with backoff. Tested against a fake session-expiring server. |
| Ghost render | NEWTYPE CineSynth on Nexus, endpoint and token from env (`lib/newtype/`) | Production characters, voice consent, AI label, watermark. |
| Brief and captions | Claude via `@anthropic-ai/sdk` 1.3: `claude-opus-5-5`, effort `low`, zod structured output (`beta.messages.parse`), `fallbacks: "default"` (`lib/claude.ts`; prompt and clean-up in `lib/brief.ts`) | Current default model; `low` effort keeps a live edit loop short; a policy decline is retried server-side on Anthropic's recommended fallback. |
| State | One process-wide memory map (`lib/store.ts`: atomic counters, fresh windows, swept expiries, capped lists); Upstash Redis over REST when its env is set | The demo runs as one `next start` process, so memory is consistent until a restart; anything the demo needs survives as fixtures or prerender clips. |
| Deploy | **Demo:** one `next start` process on an owner-run machine, public through a Cloudflare quick tunnel. **Preview:** Vercel (`ghostreel-delta.vercel.app`), always on, landing and the taste deck only. CI runs the gate on every push. | One process keeps memory state consistent and sits next to the CineSynth session that renders; Vercel's separate functions share no state without Redis, so write flows are not promised there. |

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
  brief/[id]/page.tsx         the brief editor: edit the draft, approve (locks it), render
  ghost/…                     T13
  api/taste/route.ts          GET/PUT picks (cheap, size-capped)
  api/unlock/route.ts         owner passcode → httpOnly cookie
  api/brief/route.ts          POST: kept short → brief (spend-guarded); PATCH: owner edits / approve; GET ?id=
  api/render/route.ts         POST: approved brief → one RenderJob (spend-guarded); GET ?brief= polls (Lane B owns)
  api/dev/seed/route.ts       development only (404 in builds): a [dev] brief to exercise the flow without a key
  api/render, …               spend routes: always behind lib/guard.ts
components/                   TrendCard, TrustLine, TasteSwipe, … (DESIGN.md names)
lib/
  types.ts                    contracts (zod); change by agreement
  mcp.ts                      MCP client (Streamable HTTP, session recovery, SSE)
  shorti/read.ts              Lane A: live reads + reducers (Node-safe, used by the recorder)
  shorti/index.ts             Lane A: what pages call: cache, fixture fallback, provenance
  newtype/index.ts            Lane B: roster, render, job status
  claude.ts                   Lane A: the Claude call (server-only)
  brief.ts                    Lane A: brief prompt + clean-up (pure, tested without a model)
  env.ts                      the only reader of secrets (server-only)
  guard.ts                    owner cookie, requireOwner, spend guard (burst + daily cap)
  limits.ts                   rate windows: per-IP and global unlock limits, client IP (Node-safe)
  store.ts                    Redis or memory
  words.ts                    KO/EN copy, counts, KST dates
  speech.ts                   spoken-length estimate and budget (prompt, editor meter)
fixtures/shorti/              reduced, recorded Shorti answers (offline + tests)
fixtures/newtype/             roster and recorded jobs (Lane B)
scripts/record-shorti.ts      re-record fixtures: npm run record:shorti
scripts/deny.mjs              hashed denylist: hash a term, check a file
tests/                        node --conditions=react-server --test: boundary, mcp, store, limits, brief, contract, …
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

## Running the demo host

```bash
npm ci && npm run gate
```

```bash
npm start
```

```bash
cloudflared tunnel --url http://localhost:3000
```

`npm start` reads `.env.local` (git-ignored: `GHOSTREEL_PASSCODE`, `ANTHROPIC_API_KEY`, `NEWTYPE_*`). The tunnel needs no
account and serves HTTPS; guards read the client address from `CF-Connecting-IP` first. Keep the
machine awake (`caffeinate -dims` on macOS). A restart clears picks and briefs made live; the recorded fixtures and
`public/prerender/` clips are what the demo can always fall back on.

## Gate

`npm run gate` = `tsc --noEmit` + `node --test tests/**/*.test.mjs` + `next build`. Green `master` deploys to prod.
