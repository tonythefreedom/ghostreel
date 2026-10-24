# Lane B answers to the review reply

2026-10-24 · Lane B (Tony). Answers "What Lane A needs from Lane B" in `docs/review-2026-10-24-reply.md`.

## Issues 1, 2 and 8 against the private notes

All three are covered. One small item is left, and it is optional for the demo.

| # | Private note asked for | d0c4ee3 | Left |
| --- | --- | --- | --- |
| 1 | Owner-only taste writes, ghost must exist, size cap, same-origin check on cookie writes | Owner-only, 60-pick cap | An `Origin` check on cookie-authenticated writes (`PUT /api/taste`, `PATCH /api/brief`). The owner cookie is `SameSite=Lax`, so a cross-site `fetch` already goes without it; the check is defence in depth. `POST /api/creator` has it. |
| 2 | Note and twist spot fenced and escaped as data, trust line extended to them | Every input is escaped JSON in its own tag; the system prompt names each tag as data | None |
| 8 | Per-address attempt limit, long passcode | 5 per address and 30 overall per 15 min, 13-character passcode | None |

## The CineSynth confirm step: confirmed

We accept the proposal as written. That closes T2.

- `RenderJob.status` gains `needs_confirm`, with a `previewUrl`.
- `POST /api/render/confirm {id}` is owner-only and spend-guarded. It sends `confirm_token` from the server, so the
  token never reaches the browser.
- GhostReel's Approve and CineSynth's confirm are two separate consents. Both are needed.
- An expired token means preview again, never render.

Two additions from the CineSynth guides:

- talking_ad asks for confirmation three times: `cf_keyframe` (scene), `cf_take` (voice) and `cf_create` (lip-sync).
  The route keeps one `needs_confirm` state and stores which step it is on.
- The storyboard (T23, `/storyboard/[id]`) shows the scene prompts that `cf_keyframe` will take. The owner sees them
  before the first confirm.

**Not confirmed yet:** whether a server process can hold a CineSynth credential at all (T3). Until that is answered,
the live path stays behind the adapter, and the demo plays `public/prerender/` clips with their manifests.

## Creator in T2

Done in this commit:

- `Creator` and `CreatorInput` moved into `lib/types.ts`.
- `works` is optional, from 0 to 10 links.
- `/onboard` accepts no links and says so; `/profile/[id]` explains the trend path instead.
- `lib/creator.ts` keeps only the store key and the TTL.
- `tests/creator.test.mjs` covers it.

## T3 and T7

Waiting on one person step: Tony reconnects the Nexus MCP in the hackathon session, so the CineSynth generation tools
load. After that:

1. One 10-second talking_ad, timed stage by stage. Tony confirms each GPU step.
2. The numbers go into PROGRESS.md: credential, token lifetime, the timings, the daily limit.
3. The T7 clips go into `public/prerender/` with their manifests.

The prerender adapter and `ReelPlayer` (G1) are being built on branch `b/prerender-t12` against Ted's `ProviderJob`
and `PrerenderManifest`.
