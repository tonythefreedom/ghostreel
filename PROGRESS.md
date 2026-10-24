# GhostReel — Progress

Newest first. Each entry: what is true now, what broke, what is next. Keep it short; long output goes in files.

## 2026-10-24 · A — the pencil draws where it points; onboarding shows CineSynth's own characters

Ted, 10-24: «코칭 색연필이 … 화면 구도나 미쟝센 그 좌표에 그려지지않는데», «온보딩시 캐릭터 고르는 것도 CineSynth로».
- Shorti's MCP says each cue in words only; where it points is published with the video's public page as its film
  (`/v/<slug>/film`, keyless). lib/shorti/read.ts `readFilm`/`withFilm` read it (cue time in ms, title and say in
  KO/EN, marks in shares of the frame). The Player maps each mark onto the covered picture and draws it by hand: a box
  with turned corners, a ring, an outline, a line or arrow, a bracket; a frame-wide box is a viewfinder's corners;
  each mark's name is lettered by it, clear of the keys; the cue's words move to the top when the marks sit low.
  Fixtures re-recorded in both languages (decks written compact to stay under 64 KB).
- Onboarding's "who performs" asks CineSynth for the signed-in account's characters (`GET /api/characters` with the
  session, through `/api/newtype/characters`, thumbnails streamed back through it) and shows each ghost's real
  picture with the AI label and whether its character is ready, incomplete or missing in that account.
- Also: the top bar spans the window; the brief starter offers "write it with your own Claude".
- Gate: 90 tests, typecheck, build. Not verified: the CineSynth character list with a real session.

## 2026-10-24 · B — every ghost has a face on "Who performs for you"
- Only Yuna had a keyframe, so Rina, Jihyun and Miyeon showed empty tiles. `withFace` (lib/ghostFace.ts) now falls back
  to the CineSynth character portraits in `public/ghosts/` (768×960 webp, from the CineSynth landing). A keyframe still
  wins, so Yuna keeps her real CineSynth frame. `lib/types.ts` is unchanged.
- Gate: 89 tests, typecheck, build. All four show at 375 px on onboarding step 4.
## 2026-10-24 · A — every flow overhauled: KO/EN, one player with the coaching pencil, 4D camera preset, Connect as steps

Ted, 10-24: «한/영 토글도 없고 … 재생 음소거나 코칭 색연필 등등도 안되어있고 … 대대적인 개선이 필요하다».
- Language: a top bar on every page (brand · Connect Claude · 한/EN). Cookie `gr_lang`, else the browser's first
  language. Every screen's copy lives in lib/words.ts in both; Shorti's own Korean is recorded and read for KO pages
  (fixtures `trending-*.ko.json`, reads take `lang`), never translated.
- One Player for every video (components/ui/Player.tsx): play · sound · pencil keys top right, same place everywhere;
  a scrub line with measured cuts and cue dots. The pencil (`--pencil` #6CC6FF, DESIGN.md): at each cue the clip
  stands on its frame while the cue is written by hand (underline, rings round what to look at), "Next" jumps cues.
  Hits use Shorti's cues (`shorti_video` → `cues`, `look_at`, `clock.cuts_s`, the 720p clip); ghost reels use their
  brief's beats. The taste deck's top card now plays the hit itself; the lightbox uses the same Player.
- 4D camera preset (components/CameraPreset.tsx): Shorti's scene read (`shorti_format part=scene`: height, distance,
  tilt, FOV per setup over time) drawn to scale on the brief and storyboard, with "Open in 4D on Shorti". It also
  reaches the brief prompt as `<camera>` (our route and the MCP context), so the ghost's beats are framed from it.
- /connect is four steps: Google sign-in in place, a token shown once (masked, copy), Claude Code command or Claude
  Desktop config, a live check that calls `/mcp` with that token (initialize + tools/list), then what to ask.
- Brief model: Haiku 5.5 at medium effort (Ted). The API key is not in the repo; set `ANTHROPIC_API_KEY` on the host.
- Also: ghost faces from its own CineSynth keyframe (AI label on any full frame), back links on brief and storyboard,
  onboarding says why Next is off, the landing hero plays Yuna's preview with its beats pencilled.
- Gate: 83 tests, typecheck, build. Verified at 375 px in KO and EN. Not verified: a real Google sign-in and token.
## 2026-10-24 · A+B — the memory store survives a restart (Tony's decision, Ted's yes)

- Each redeploy restarted `next start` and wiped the memory store: sign-ups, kept shorts, briefs and MCP connect
  tokens. Tony had to sign up, keep, reconnect Claude and rewrite the brief after every deploy.
- Without Redis, `lib/store.ts` now also keeps the map in `.data/store.json`. `lib/storeFile.ts` writes it 300 ms
  after the last change: written whole, temp file then rename, mode 600 in a 700 folder. Expired entries are
  neither written nor loaded. `GHOSTREEL_STORE_FILE` moves it; `off` turns it off.
- `.data/` is in `.gitignore`. The file holds creators' plans and scripts, picks, briefs and token hashes (never
  tokens or CineSynth sessions).
- Verified on the dev server: seeded a brief, stopped and restarted it, and the brief read back.
  `tests/store-file.test.mjs`: 5 tests.
- The first deploy of this commit still starts empty (the old process had no file); every restart after it keeps
  the data.

## 2026-10-24 · B — a locked action asks Google before the passcode

- Tony hit the passcode prompt on approve. The brief came from his Claude over MCP, and the browser he opened its
  link in had no GhostReel sign-in, or had signed in before sign-in started setting the owner cookie.
- `UnlockForm` (Lane A, on Tony's say-so that an approved account replaces the passcode) now calls
  `GET /api/auth/session` first. For an approved account that route sets the owner cookie, and the refused action
  runs again with no prompt. Otherwise it shows the passcode box plus "No passcode? Sign in with Google in this
  browser". It tries once per page load, so it cannot loop. Gate: 78 tests.

## 2026-10-24 · B — /llms.txt: an AI can read it and connect GhostReel itself (Tony)

- `public/llms.txt` (served at `/llms.txt`, linked from every page's head as `rel="alternate" type="text/markdown"`)
  tells an AI assistant how to use GhostReel. It marks the person's own steps:
  - Google sign-in, onboarding, keeping a short on /taste
  - the `grk_` token from /connect
  Everything else the AI does itself:
  - the `claude mcp add --transport http …` command (Claude Code)
  - the `mcp-remote` bridge config (Claude Desktop); claude.ai is not supported until OAuth
  - a curl check with 200, 401 and 429 meanings
  - the three tools in order, the answer schema, the error codes, and the rules (virtual human only, no claims,
    draft only, no posting)
- `/onboard` opens with a notice: "Works with your own Claude", a link to Connect, and "Tell Claude Code: Read
  ghost.newtype-ai.com/llms.txt and connect GhostReel."
- `tests/llms.test.mjs`: the file names exactly the tools `/mcp` offers, has the add command and PERSON steps, and
  carries no real token. Gate: 76 tests, typecheck, build. Verified at 375 px.

## 2026-10-24 · Google sign-in refused every real browser behind the tunnel: fixed (A)

- Cause: `/api/auth/google` and `/api/creator` matched the browser's Origin against `req.nextUrl.origin`. Behind
  Cloudflare the browser says `https://ghost.newtype-ai.com` while Next sees itself as plain http (localhost), so every
  real sign-in and creator save got `403 cross_origin` (probed live: with the site's Origin → 403, without → 401 at
  CineSynth). The Google button itself rendered fine.
- Fix: `requireSameSite` (lib/guard.ts, pure `sameSite` in lib/limits.ts) compares hosts (Origin vs Host /
  X-Forwarded-Host); other sites still get 403. Tested. Tony: pull and restart `next start` on the demo host.

## 2026-10-24 · B — GhostReel MCP server: the person's own Claude writes the brief (Tony's decision, Ted's yes)

- Tony: the public server holds no model key; users write briefs with their own Claude. Connect token now, OAuth
  after the hackathon. Ted agreed: new files only; `lib/brief.ts` used read-only; `/api/brief` unchanged.
- `/mcp` (Streamable HTTP 2025-06-18, JSON answers, POST only). Three tools, scoped to the token's account:
  - `ghostreel_ghosts`: your ghosts and kept shorts
  - `ghostreel_brief_context`: Lane A's `buildBriefPrompt` system and user prompt, plus the `Draft` JSON schema
  - `ghostreel_brief_submit`: `Draft` + `finishBrief` → a DRAFT brief and its link
  No approve, render, spend or post tool exists.
- Tokens (`lib/ghostmcp/tokens.ts`):
  - `grk_` + 32 random bytes, shown once on `/connect` with the `claude mcp add` command.
  - Only the SHA-256 is stored, compared in constant time.
  - 7-day expiry, at most 3 live per account, Revoke and Revoke all; sign-out revokes all.
  - Bad, expired or revoked tokens get 401 with `WWW-Authenticate`; 30 calls a minute per token.
  - `/connect` warns that the add command leaves the token in shell history and the Claude config.
- Ownership: an account owns the ghosts of its own `Creator` records (`creators:<accountId>`, written at sign-up).
- An approved CineSynth account is now the owner without the passcode (Tony): sign-in also sets Lane A's owner
  cookie when a passcode is configured; the passcode stays as a fallback. `lib/guard.ts` is unchanged.
- `tests/ghostmcp.test.mjs` (6) covers PM's list: wrong-account ghost refused, expired and revoked tokens refused,
  submit stores only a DRAFT with no approve or render path, and the token never in an answer or a log.
- Local smoke: `GET /mcp` 405; no or bad token 401; `/api/mcp-tokens` without a session 401. Gate: 71 tests,
  typecheck, build. End to end with a real token needs a Google sign-in (Tony).

## 2026-10-24 · T7 (B) — a labelled preview clip until lip-sync is back

- `public/prerender/yuna-percent-ready-preview.mp4` (720×1280, 7.76 s, 463 KB) + poster: the four storyboard scenes
  cut to the pauses of a CineSynth voice take (`tts_a576d5e0`, "Getting ready — twenty percent. Serum on: sixty. One
  swipe of tint: a hundred. Done."). Burned in: "AI-generated · Virtual human" and "Not lip-synced · scene + voice
  preview". Listed in `public/prerender/manifest.json` with the keyframe and take ids.
- The take came straight from its MCP result link after CineSynth's fix (no session needed for an hour).
- Verified: a `[dev]` brief approved → `/api/render` returns `provider: prerender`, `done`, the clip and poster;
  `/brief/[id]` plays it with the AI label and "rendered from a different script" (the clip's lines differ).
- Swap for a lip-synced `cf_create` render once CineSynth can run it; the keyframe and take ids are reusable.

## 2026-10-24 · B — sign in with Google as the CineSynth user (Tony's decision)

- Tony: Nexus and CineSynth need Google sign-in, so GhostReel onboarding uses CineSynth's own Google sign-in. This
  replaces PRD's "no accounts or sign-in" for the creator path; the owner passcode still guards spend routes.
- `/onboard` starts with "Continue with Google" (Google Identity Services, CineSynth's public client id read from its
  `/api/config`). `POST /api/auth/google` trades the Google ID token at CineSynth `/api/auth/google` for a CineSynth
  session; that token stays in the httpOnly cookie `gr_cs` (7 days) and never reaches the page.
  `GET /api/auth/session` returns the account and client id; `DELETE` signs out.
- `POST /api/creator` now needs an approved CineSynth account (CineSynth marks a new email "pending") and stores it on
  `Creator.account`. `CinesynthAccount` is in `lib/types.ts`.
- `GET /api/newtype/media?url=` streams the signed-in user's own CineSynth result links with their session; only
  CineSynth `/api/mcp/media/…` links pass. (CineSynth now also serves those links without a session for an hour.)
- Tony added `http://localhost:3000` and `https://ghost.newtype-ai.com` as JavaScript origins on the Google client.
  The button renders on both lanes' new design. The sign-in itself is to be checked by Tony on the deployed site.
- `tests/google-signin.test.mjs`: 4 tests. Gate: 65 tests, typecheck, build.

## 2026-10-24 · Lane A screens on the new design: landing, taste, brief, ghost channel (A)

- Taste: the deck as a fan (fan spring; drag past 96 px decides, ← skip, → keep, Z undo), eight a round with
  "2 / 8", real creators' posters with no AI label, docked Skip + Keep, what to keep in a sheet of chips, an end
  screen with one red "Write the brief" for the chosen short.
- Landing: two-line display headline, one red "Make my ghost", the ghost's own picture with its AI label, bands.
- Brief: the timed lines as a beat rail (arrow keys) with the selected beat's say/do card, what was kept as text,
  outfit/scene/caption/hashtags under "More detail", docked Save + "Approve and render", render as ✓●○ steps.
- Ghost channel `/ghost/[id]` (T13): violet head with the AI label, reels wall, this week's tape (briefs fill days in
  the order written, one a day from today, said on the page), one red verb (approve the oldest draft, else teach a
  new short), "We never promise views". The dev seed now lists its brief there.

## 2026-10-24 · Lane B screens on the new design (A, straight to master)

Ted: "PR없이 그냥 메인으로 다이렉트로 해버려 충돌나도 어차피 토니 클로드코드가 해결하기 쉽다" · "토니 담당 화면 … 니가 직접해"

- Tony, your screens moved onto `components/ui`: onboard (chips for market and languages, docked `Verb`), profile
  (style said as text, violet ghost, docked verb), storyboard (scene tiles with the full AI label on their foot,
  44 px controls, docked verb), `ReelPlayer` (the shared `Player`: poster first, tap to pause, one voice, label always
  on), `RenderJob` (✓●○ steps with the clock, the ghost's poster while it films; no shimmer), kit tiles (Vellum
  state pills, 12 px label). Your source tests now check the shared primitives instead of class strings.
- Conflicts, if any, are only these files' class names; logic and contracts are unchanged.

## 2026-10-24 · design language ported: foundation (A)

Ted: "우리 [private] 프로젝트의 디자인이나 미학 감각 그리고 ux ui에서 가져올 코드들이 엄청많다 … 각 페이지나 프론트 코드들을
다 보고 우리에게 완벽하고 이상적으로 전부 이식해야한다. 우리도 토니를 힘껏도와보자. 우리는 프론트에 집중한다"

- Studied every consumer page and the design system of the team's private short-form app; rewrote, never copied.
- Foundation (shared): DESIGN.md laws and the Screen palette (near-black, cool greys, one red verb, violet = the
  ghost, green = kept, gold = fix), Geist tabular digits behind `font-mono`, radii 6/10/14/22, moves and springs,
  Vellum, a 20 px gutter. Every screen restyles from the tokens at once.
- `components/ui/` (shared): Button, Verb (docked one-verb bar), Chip, Vellum + AiLabel, Player (poster first, tap
  to pause, one voice), Rail, Sheet (native dialog), Progress (✓●○), Empty.
- Next: the screens, Lane A here; Lane B's as a PR to Tony.

## 2026-10-24 · Lane B's flow asks 1 and 2 done (A)

- Brief → storyboard: "See the storyboard" sits above the brief's bottom buttons, before and after approval.
- The creator in the brief: `/taste?creator=` reaches `POST /api/brief` as `creatorId`; the route loads the
  `Creator` (only one who chose this ghost) and adds a `<creator>` block (bio, past plan and script, the style
  `summarize` reads from their shorts), escaped JSON like every input. No `creatorId`, no block. Tested.
- Ask 3 (the demo host's `.env.local`) stays Tony's, by hand.

## 2026-10-24 · UI kit for Lane B (a gift from Lane A)

Ted: "[private] 구레포를 보면 [private] 관련 미학보다는 ux 적인 요소들 추출해놓은게 있는데 … 맨 처음 [private]의 ux ui
주요메뉴들을 뽑아놓은 깃 커밋 히스토리를 [private] 레포에서 조사해서 체리피킹으로 우리가 흡수하면 좋은 ux ui 패키지를 토니에게
깃허브로 선물로 올려주자."

- From the earlier private prototype's first menu set (its first three UI commits, 4.17), plus the fixes it earned
  over ~50 later commits (focus held in dialogs and returned to the opener, previews start muted, arrow-key rows),
  rewritten on DESIGN.md tokens: `GhostDock`, `ReelGrid`, `ReelLightbox`, `StepStrip`, `FunnelProgress`,
  `SpendMeter` in `components/kit/` (Lane B now). Try them at `/kit` in development (404 in any build).
- Not taken: its look (fonts, colours, glass), copy, names, analytics, the 19-step sales funnel's pitch pages.
- Fits: `ReelGrid` + `ReelLightbox` for T13's reels grid; `FunnelProgress` for `/onboard` one step per screen;
  `StepStrip` for the landing or an empty channel; `SpendMeter` once a route returns today's count (not wired).
- Checked at 375 px: no horizontal scroll; lightbox keeps focus inside, Esc closes, focus returns to the tile.

## 2026-10-24 · no Shorti sign-in, every keyless read wired

Ted: "토니가 대사 MCP 툴 등을 데모에 사용하려고하니까 로그인하라고 뜬다고하네.. 이거 해결해줘.." · "허용해도 되는 툴들 다 해주면
좋을거같아" · "데모로 구현해야하니까 쇼티로그인이 뜨면 안되지 당연히"

- Why it asked: `shorti_recipe kind: brief` (and `cut`, `my_edit`, `check`) are writes. Shorti requires a person
  signed in and approving at that moment; a personal API key is read-only, so no server-side key can do it either.
- Fix: GhostReel calls only keyless reads, enforced by `KEYLESS_READS` (writes throw before leaving; tested). New
  readers in `lib/shorti/`: `recipeEdit` (beat moves: hook facts, cues, what is yours/free), `cameraSetups`,
  `findFormats`, `openSpots`; recorded recipes for offline. Spoken lines stay GhostReel's own (Claude), now timed to
  the hit's moves via a `<moves>` block. Verified live: 3 cues + bpm 90.9, 2 camera setups, find and spots return.
- Tony's two asks: (1) sign-in for `brief`: not possible unattended, by Shorti's design; use `/api/brief` (lines)
  or the new `recipeEdit` cues for `LinePicker`. (2) a recipe-edit reader in `lib/shorti/`: done (`recipeEdit`);
  Lane B may call it from server code.

## 2026-10-24 · T7 (B) — the demo storyboard has all four scenes

- Three more `cinesynth_cf_keyframe` scenes for Yuna's beats 2–4 (cushion pat, lip tint with a side glance, full
  look with a wave), Tony-confirmed, started together at 04:39:01 UTC: `kf_4f05e354` done 04:39:48, `kf_226b227a`
  04:40:18, `kf_d34cf918` 04:40:19 (about 47–78 s each; the progress showed them running on the MI250 worker).
- Prompts keep beat 1's bathroom vanity and change only the action. They leave out the brief's outfit (the 3-view
  sheet decides it) and the on-screen counter (an image model would draw stray text); the exact prompt is in
  `public/prerender/keyframes.json`. Beat 2's frame is a mirror shot with a shoulder in the foreground.
- GPU today: 7 of 30 used. Verified at 375 px: the storyboard shows four pre-made scenes with downloads.

## 2026-10-24 · English by default, every screen (Tony's decision)

- Tony: the front end defaults to English and everything on screen is English. Done across both lanes in one
  commit: Lane B copy rewritten in English (onboarding, profile, style, storyboard, line picker, flow strip, scene
  labels); the kit, player and render job default to `lang = "en"`; Lane A components and `lib/words.ts` helpers
  (`t`, `viewCount`, `shortDate`) default to `"en"`; the landing page, `<html lang>`, title and description are
  English. The Korean halves of `words.ts` and the kit stay, so a toggle (T17) can still switch.
- Lane A files changed by Lane B on Tony's say-so: `app/page.tsx`, `lib/words.ts`, `components/BriefEditor.tsx`,
  `BriefStarter.tsx`, `TasteSwipe.tsx`, `TrendCard.tsx`, `TrustLine.tsx`, `UnlockForm.tsx` (defaults only, plus
  the landing copy). Shared: `app/layout.tsx`, `tests/kit.test.mjs` (default-language `age` now expects English).
- Verified at 375 px: landing, onboarding, taste deck, brief editor and storyboard all read in English.

## 2026-10-24 · B — demo flow: profile → taste carries field and creator; asks for Lane A

- `/profile/[id]` now opens `/taste?ghost=…&field=…&creator=…`: the deck follows the creator's niche (`fieldFor` in
  `lib/flow.ts`, fashion words → fashion, else beauty), and the creator id rides along for the brief.
- Three links stay open in Lane A files: a "콘티 보기" link on `/brief/[id]`, the creator (bio, plan, script, style)
  fenced into the brief prompt, and the demo host's `.env.local` keys (Tony). Details in
  `docs/lane-b-flow-asks-2026-10-24.md`.
- Verified at 375 px: register → profile → taste on the beauty deck.

## 2026-10-24 · B — Ted's UI kit placed: step-by-step onboarding, flow strip, full AI label

- `/onboard` asks one thing per screen with the kit's `FunnelProgress` (about me → what I made → who performs);
  "다음" moves on only when that screen is complete, back keeps every answer. The next and submit buttons carry
  separate keys: sharing one DOM node made the click that reached step 3 also submit the form.
- `/profile/[id]` shows the creator loop as the kit's `StepStrip` (등록 ✓ · 고르기 now · 승인하기 · 받기), from
  `lib/flow.ts`.
- `ReelGrid` thumbnails now carry the full "AI-generated · Virtual human" label (was "AI"), as RULES asks for every
  thumbnail. `tests/flow-kit.test.mjs`: 3 tests.
- Verified at 375 px: three onboarding screens, register → profile with the strip, `/kit` grid labels.

## 2026-10-24 · T22 (B) — the creator's style from their own shorts

- `/profile/[id]` reads each registered short with keyless Shorti (`reading` + `recipeEdit`, cached) and sums them up
  in `lib/creatorStyle.ts`: openings as Shorti said them, the moves their formats' hits share (with Shorti's share and
  how many of the creator's shorts carry each), what the take may change, median BPM and length. Counting only, no
  forecast; a short Shorti cannot read is left out and the card says so. `tests/creator-style.test.mjs`: 3 tests.
- Verified at 375 px: 2/2 shorts read, 117 BPM, 16.7 s, three shared moves, four make-it-yours items.
- `cinesynth_link` without `create` now answers `linked: true` after the CineSynth fix went live (13:12 KST).

## 2026-10-24 · T23 (B) — line options rest on Shorti's live moves; T7 lip-sync blocked

- Each line option now points at a Shorti read (a hit's move, an opening fact, what the take may change, an open
  spot) instead of a hand-written note. The storyboard reads `recipeEdit` (keyless, Lane A) for the brief's source
  post and `formatPlan` for its open spots, and shows Shorti's own words with its share ("More than half do this");
  an option whose read is missing is not offered. Source post: the owner's kept pick, else this week's deck.
- Verified at 375 px on a `[dev]` brief: moves with shares, and the source's 91 BPM, 10.8 s, in the header.
- T7 lip-sync (`cinesynth_cf_create`, job 62daa3b1) failed `feature_unavailable`: Wan S2V-14B needs 104 GiB and
  GB10-2's local cap is 85 GiB while the LLM ring holds memory; the MI250 worker has no S2V path. It fails the same
  from the web. The GPU job stays counted. Unblocking it is Tony's call; the demo uses the scene and voice take
  without lip-sync, labelled, until then.

## 2026-10-24 · T23 (B) — pick each beat's line on the storyboard

- Shorti returns no spoken lines (its public tools give the format's hook, beats and open spots), and creators' words
  are never reused. So GhostReel wrote three options per beat from this week's beauty format (hook + its three open
  spots), each naming its Shorti basis, in `content/line-suggestions.json`.
- `/storyboard/[id]` shows "Shorti 추천 대사" under each beat: the current line first, then the options. Picking one
  saves through the owner-only `PATCH /api/brief`; an approved brief is locked (409). `tests/line-suggestions.test.mjs`.
- Verified at 375 px: beat 2 picked "Serum on: sixty." and the brief read back with it.
- T7 voice take: `cinesynth_cf_take` → `tts_fb1746eb`, 7.5 s of audio, about 32 s (03:48:00 → 03:48:32 UTC).

## 2026-10-24 · T7 (B) — first CineSynth scene, from this week's Shorti pick

- Shorti radar (beauty, read 2026-10-24 00:28 UTC): top "New format" is a makeup routine with an on-screen
  completion percentage (`fam_way-be186ab1c0a4`). The sample turns it into a one-take talking short: the ghost
  counts the percentage out loud while she gets ready, then waves, as the format ends.
- This CineSynth account has one complete 3-view character, `default`; Yuna's `characterId` now points at it.
- `cinesynth_cf_keyframe` → `kf_58cd559c` in about 44 s (03:43:18 → 03:44:02 UTC, request to done notice).
  Saved as `public/prerender/keyframes/default-percent-ready-0.jpg` and listed for Yuna's beat 0; the storyboard
  shows it tagged "미리 만든 장면", with a "장면 받기" download.
- GPU budget: 30 jobs a day for this account (resets 00:00 UTC). Voice take and lip-sync are next.

## 2026-10-24 · T2 (B) — Creator in the contract, confirm step confirmed

- `Creator` / `CreatorInput` / `Market` now live in `lib/types.ts`; `works` is 0–10 (registering with no catalog
  goes straight to the trend step). `tests/creator.test.mjs`: 3 tests. Verified at 375 px: no links → profile.
- Lane B answers in `docs/lane-b-answers-2026-10-24.md`: 1, 2, 8 covered (an `Origin` check on cookie writes is the
  one optional extra), the `needs_confirm` proposal accepted, T3/T7 waiting on the Nexus reconnect.
## 2026-10-24 · Ted's decisions landed — one front door

Ted: "테드가 정할것 전부 니 추천대로 가자. 마저 마무리해서 올려줘"

- Landing "내 고스트 만들기" → `/onboard`. Own past shorts are optional (0–10) in `lib/creator.ts`, the form and
  `/profile/[id]` (Lane B files, changed by Lane A with Ted's approval): someone without a catalog picks a ghost and
  goes straight to the trend step.
- Demo host: Tony's machine, run by Tony; Ted's laptop is the offline backup (T16a).

## 2026-10-24 · T23 (B) — storyboard board

Done
- `/storyboard/[id]`: one scene per timed beat of a brief (time, line, action), two columns at phone width, the
  AI label on every frame. A scene shows its image when one exists, else the English prompt CineSynth's
  `cinesynth_cf_keyframe` will take (action first, then look and place), with a copy button.
- `lib/storyboard.ts`: `framePrompt`, `buildStoryboard`; scene images are listed in `public/prerender/keyframes.json`
  (empty for now) and attach by ghost and beat, newest first, tagged "미리 만든 장면".
- `tests/storyboard.test.mjs`: 4 tests. Verified at 375 px on a `[dev]` seeded brief.

Open
- Nothing links here yet: a "콘티 보기" link on `/brief/[id]` is Lane A's (one line, Ted's call).
- Scene images need an owner-run CineSynth session (T7 together with the sample render).
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
