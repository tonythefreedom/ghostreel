# GhostReel — Architecture

One Next.js app on Vercel. It owns no models and no video pipeline: Shorti reads short-form, NEWTYPE renders the
ghost, Claude writes the brief. GhostReel is the loop, the taste record, and the channel.

## Stack

| Layer | Choice | Why |
| --- | --- | --- |
| App | Next.js 16 (App Router), TypeScript strict, Node 24 | Same stack as Shorti's web; server routes keep keys off the client. |
| Style | Tailwind CSS v4, CSS variables from DESIGN.md | Fastest path to a consistent mobile UI. |
| Short-form data | Shorti public MCP, keyless, `https://shorti.ai/mcp` (streamable HTTP) via `@modelcontextprotocol/sdk` client | Verified 2026-10-24: `initialize` and `tools/list` return 200 from a server, no key. |
| Ghost render | NEWTYPE CineSynth through Nexus (MCP `lic.newtype-ai.com/mcp`, or the CineSynth API the teammate exposes) | Already in production: characters, voice consent, AI label, v-seal watermark. |
| Brief and captions | Claude via `@anthropic-ai/sdk`, model `claude-sonnet-5-5` | Fast enough for a live edit loop; writes multilingual captions. |
| State | Upstash Redis (`@upstash/redis`, REST) when env is set; in-memory `Map` otherwise | JSON doc per ghost, no schema or migration in an 8-hour build; works on serverless. |
| Deploy | `vercel deploy --prod` from a teammate's machine | Ted has push, not admin, on the repo; CLI deploy needs no Git integration. |

## Folders

```
ghostreel/
  app/
    page.tsx                  landing → start
    onboard/page.tsx          pick ghost, niche, market, language
    taste/page.tsx            the daily game: swipe Shorti radar shorts
    brief/[id]/page.tsx       read, edit, approve the brief → render
    ghost/[id]/page.tsx       channel: reels, 7-day queue, deals, check results
    api/
      shorti/trending/route.ts    GET  → TrendCard[]
      shorti/format/route.ts      GET  → FormatPlan
      shorti/check/route.ts       POST → CheckResult
      brief/route.ts              POST → Brief (Claude)
      render/route.ts             POST → RenderJob, GET ?id= → RenderJob
      queue/route.ts              GET/POST → QueueItem[]
  components/                 UI pieces named in DESIGN.md
  lib/
    types.ts                  the contracts below; changed by agreement only
    shorti.ts                 Lane A: the only file that talks to Shorti
    newtype.ts                Lane B: the only file that talks to NEWTYPE
    claude.ts                 brief and caption prompts
    store.ts                  Redis or memory, same interface
  fixtures/
    shorti/*.json             recorded real Shorti answers; offline fallback and test input
    newtype/*.json            recorded render job answers
  public/prerender/           finished, AI-labelled ghost clips for stage fallback
  tests/                      node --test against fixtures
```

## Data flow

```
 person                GhostReel (Next.js on Vercel)                       outside
 ──────                ─────────────────────────────                       ───────
 pick ghost ───────▶ /onboard ── listCharacters() ─────────────────────▶ NEWTYPE (characters)
 swipe keep/skip ──▶ /taste ──── GET /api/shorti/trending ── shorti_what_to_shoot(lens=radar, lang=en) ─▶ Shorti
                         │        store TastePick[]
 approve brief ────▶ /brief ──── GET /api/shorti/format ── shorti_format(part=flow|scene), shorti_recipe ─▶ Shorti
                         │        POST /api/brief ── Claude(taste + format + ghost) ──▶ Brief (draft)
                         │        person edits, approves (no render before this)
                         └──────▶ POST /api/render ── newtype.render(brief) ──────────────────────▶ CineSynth on Nexus
                                  GET /api/render?id= (poll) ◀── status, videoUrl (AI label burned in)
 read fixes ───────▶ /ghost ──── POST /api/shorti/check ── shorti_check(url) ─────────────────────▶ Shorti
 approve post ─────▶ /ghost ──── POST /api/queue (state: approved; no real posting in the hackathon)
```

## Contracts (`lib/types.ts`)

```ts
type Lang = 'en' | 'ko' | 'ja' | 'es';
type Platform = 'tiktok' | 'reels' | 'shorts';

interface Ghost {
  id: string;
  name: string;               // e.g. "Yuna"
  characterId: string;        // NEWTYPE character id
  portraitUrl: string;
  voiceId: string;            // synthetic, or the owner's voice with a NEWTYPE consent record
  niche: string;              // "K-beauty for the US"
  market: string;             // "US"
  languages: Lang[];
}

interface TrendCard {         // one Shorti reading; counts are the platform's, as read
  videoId: string;
  url: string;
  platform: Platform;
  formatId: string;
  title: string;
  thumbnailUrl?: string;
  views?: number;
  readAt: string;             // ISO time Shorti read it
}

interface TastePick {
  ghostId: string;
  videoId: string;
  formatId: string;
  kept: boolean;
  keep: Array<'hook' | 'beat' | 'look' | 'sound'>;
  note?: string;
  at: string;
}

interface Brief {
  id: string;
  ghostId: string;
  formatId: string;
  sourceVideoId: string;
  lang: Lang;
  durationSec: 10 | 15;
  hook: string;
  lines: Array<{ t: number; say: string; do: string }>;
  outfit: string;
  scene: string;
  caption: string;
  hashtags: string[];
  status: 'draft' | 'approved';
}

interface RenderJob {
  id: string;
  briefId: string;
  provider: 'newtype' | 'prerender';   // prerender is shown as such in the UI
  status: 'queued' | 'running' | 'done' | 'failed';
  videoUrl?: string;
  error?: string;
  startedAt: string;
  finishedAt?: string;
}

interface CheckResult {
  renderId: string;
  fixes: string[];            // at most three
  keep: string[];
}

interface QueueItem {
  id: string;
  ghostId: string;
  renderId: string;
  slot: string;               // ISO date
  platform: Platform;
  state: 'awaiting_approval' | 'approved';
  deal?: { seller: string; product: string; demo: true };
}
```

## Adapter interfaces

`lib/shorti.ts` (Lane A) — wraps the keyless MCP; always passes `lang: 'en'`; returns typed values or throws.

```ts
trending(opts: { field?: string; platform?: Platform; limit?: number }): Promise<TrendCard[]>  // shorti_what_to_shoot lens=radar
openSpots(): Promise<TrendCard[]>                                                             // shorti_arena
formatPlan(formatId: string): Promise<FormatPlan>                                             // shorti_format part=flow + scene
recipe(formatId: string, ghost: Ghost): Promise<RecipeRef>                                    // shorti_recipe kind=scene
check(videoUrl: string): Promise<CheckResult>                                                 // shorti_check
```

`lib/newtype.ts` (Lane B) — the teammate fills the bodies against CineSynth/Nexus.

```ts
listCharacters(): Promise<Ghost[]>
render(brief: Brief, ghost: Ghost): Promise<RenderJob>     // starts a GPU job only for an approved brief
getJob(id: string): Promise<RenderJob>
fitProduct(photoUrl: string, ghost: Ghost): Promise<RenderJob>   // seller deal (should-have)
```

Both adapters fall back to `fixtures/` when `GHOSTREEL_OFFLINE=1` or the call fails, and mark the result so the UI can
say so.

## Environment

| Name | Where | Used by |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | server | `lib/claude.ts` |
| `NEWTYPE_MCP_URL`, `NEWTYPE_TOKEN` | server | `lib/newtype.ts` (teammate supplies) |
| `SHORTI_MCP_URL` | server, default `https://shorti.ai/mcp` | `lib/shorti.ts` |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | server, optional | `lib/store.ts` |
| `GHOSTREEL_OFFLINE` | server, optional | adapters use fixtures only |

No key is ever read in a client component. `.env.local` is git-ignored; `.env.example` lists names only.

## Gate

`npm run gate` = `tsc --noEmit` + `next build` + `node --test tests/`. Green gate on `master` → deploy to prod.
