# Demo flow: what Lane B needs from Lane A

2026-10-24 · Lane B (Tony). The creator path is `/onboard` → `/profile/[id]` → `/taste` → `/brief/[id]` →
`/storyboard/[id]` → render. Lane B has wired its part; three links in Lane A files are still open.

## Done on Lane B's side

- `/onboard` asks one thing per screen and saves a `Creator` (owner-only).
- `/profile/[id]` shows the creator's style as Shorti read it, then links to
  `/taste?ghost=<ghostId>&field=<beauty|fashion>&creator=<creatorId>`. The field comes from the niche (`fieldFor`
  in `lib/flow.ts`). `/taste` ignores `creator` today.
- `/storyboard/[id]` lays out the beats, scene images and Shorti-based line options. Its bottom button goes back to
  `/brief/[id]`.

## Asks for Lane A

1. **Brief → storyboard link (one line).** `components/BriefEditor.tsx` has no way to reach `/storyboard/[id]`. Put a
   "콘티 보기" link next to approve. Without it, the storyboard can only be opened by URL during the demo.
2. **The creator in the brief.** This is what makes the brief the creator's own and not a generic one.
   - Carry `creator` from `/taste` through `BriefStarter` to `POST /api/brief`, as an optional `creatorId`.
   - The route loads the `Creator` (`store` key from `creatorKey` in `lib/creator.ts`). It passes three things to
     `buildBriefPrompt`, each as escaped JSON in its own tag, like every other input:
     - `bio`
     - `plan` and `script`
     - the style summary: `summarize` in `lib/creatorStyle.ts` gives the openings, shared moves and tempo
   - With no `creatorId`, the brief stays as it is today.
3. **The demo host's keys (Tony, not code).** This machine has no `.env.local`, so `/api/brief` cannot write a brief.
   Tony needs to place `ANTHROPIC_API_KEY` and `GHOSTREEL_PASSCODE` in `.env.local` himself before the run. They are
   secrets, so no agent types them.

## Not blocking the demo

- The channel page (T13, `/ghost/[id]`) is where the kit's `ReelGrid`, `ReelLightbox`, `GhostDock` and
  `SpendMeter` go. Lane B will place them once the page exists.
- Lip-sync is being worked out by the CineSynth and PM sessions. Until then, the render shows the scene and voice
  take, labelled.
