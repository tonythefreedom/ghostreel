# GhostReel — Design

The look is the team's own short-form design language, rewritten here for a product that only watches and makes:
GhostReel lives in its dark **Screen** light, always (Ted 10-24, PROGRESS.md). `components/ui/` holds the primitives;
a screen names roles, never values.

## Laws

1. **Sight before words.** The reel is whole and plays; words over a picture sit on Vellum, never a plate or gradient.
   Outside a sheet a state carries at most two lines.
2. **One verb.** One filled button a screen, red (`--action`), moving the person one step along the loop; beside it at
   most one quiet secondary. On a phone it is docked at the bottom (`Verb`). Everything else is quiet.
3. **The ghost is violet.** Violet marks what the ghost makes or is (its avatar, the AI label, generated frames); green
   is kept or approved; gold is a fix or a demo notice; red is only the verb. Red never means wrong.
4. **Honest numbers.** Every count says its source and date; no score, percent, forecast or countdown.
5. **Fewer, truer.** Three, not twelve; an empty slot over a filler; a block whose data is missing leaves the page.
6. **A poster, never a shimmer.** A picture's own poster (blurred when tiny) stands in until the first frame.

## Colour

One light, Screen: near-black with cool greys. The table is the single source; `tests/tokens.test.mjs` holds
`app/globals.css` to it.

| Token | Hex | Use |
| --- | --- | --- |
| `--bg` | `#0B0B0C` | page |
| `--surface` | `#121214` | a quiet section, cards |
| `--surface-2` | `#18181B` | raised: inputs, a tile waiting for its picture |
| `--pressed` | `#222226` | hover and pressed |
| `--line` | `#2A2A2F` | hairlines |
| `--line-strong` | `#6E6E76` | control outlines (3:1) |
| `--text` | `#F5F5F7` | primary text |
| `--text-dim` | `#C9C9CE` | secondary text |
| `--text-3` | `#9D9DA2` | the floor for any text: meta, captions |
| `--action` | `#D41B2A` | the one filled verb (white text) |
| `--action-hover` | `#E0202F` | the verb under a finger |
| `--action-text` | `#FF6B75` | red used as text (a rise, the moment) |
| `--accent` | `#8B5CF6` | the ghost: avatar, AI label, generated marks |
| `--accent-soft` | `#8B5CF61F` | violet backgrounds |
| `--ghost` | `#3DD68C` | kept, approved, done |
| `--warn` | `#F5B942` | a fix, demo and fallback notices |
| `--danger` | `#FF6B75` | an error line (with ✕, never colour alone) |

Over a picture: Vellum is `rgba(11,11,12,.38)` with `blur(20px) saturate(1.4)` and a 1 px `rgba(255,255,255,.1)` edge
(`rgba(11,11,12,.62)` without backdrop-filter).

## Type

- **Pretendard Variable** for words: 400 text, 560 labels and chips, 720 titles, 760 display.
- **Geist** with tabular digits for every number (`font-mono` maps to it), the unit beside it in Pretendard.
- Steps 12 · 13 · 15 · 18 · 22 · 28 and display `clamp(36px, 1.6vw + 28px, 56px)`; titles −0.02em, display −0.032em.
  Nothing under 12 px. Hangul `keep-all`; titles `text-wrap: balance`; never an ellipsis on a name or fact.

## Shape, space, motion

- Radius 6 badge · 10 picture · 14 control and card · 22 sheet · pill for chips. No shadow on a card.
- 4 px base; 20 px phone gutter; 12 px between cards; 40 px between sections. Targets 44 × 44; a 2 px focus ring.
- Moves: press and arrive 125 ms, lift 250 ms, the beat 500 ms, on `cubic-bezier(0.2, 0, 0, 1)` (leaving uses
  `cubic-bezier(0.4, 0, 1, 1)`). What a finger moves settles on a spring: snap (chips), sheet, fan (the deck).
- Reduced motion: no transitions or loops; every word stays.

## Layout

- Phone first in a centred 430 px column. A flow screen ends in the docked `Verb` bar (52 px buttons, safe-area
  padding); the page pads its foot by the bar's height.
- A video stage is full bleed: keys as bare glyphs at the top, a tap is play/pause with ▶ in the middle when paused,
  sound off until one tap, one voice per page.

## Primitives (`components/ui/`)

| Primitive | What it is |
| --- | --- |
| `Button` | primary (red), secondary (1 px ring), quiet; sizes 52 · 44 · 36; an `<a>` when it has `href` |
| `Verb` | the docked action bar: one primary at flex 1, at most one secondary, an optional one-line note |
| `Chip`, `ChipRow` | 32 px pill in a 44 px target; pressed is a white fill; a row scrolls sideways |
| `Vellum` | words over a picture |
| `Player` | 9:16 reel: poster first, tap to pause (▶), sound key, AI label always on |
| `Rail` | a reel's beats as chips (tablist, arrow keys), a playhead on a hairline |
| `Sheet` | native dialog bottom sheet (22 px top radius, sheet spring, Esc and scrim close) |
| `Progress` | steps as ✓ done · ● now · ○ next, with figures |
| `Empty` | a head, one line, one secondary action |

## Components

| Component | What it shows |
| --- | --- |
| `GhostCard` | portrait, name, niche, market, languages; selected state with accent ring |
| `TasteSwipe` | one 9:16 trend card at a time, platform count and "read by Shorti at HH:MM", keep / skip, then keep-chips |
| `KeepChips` | hook · beat · look · sound, multi-select, green when on |
| `FormatChip` | format name and its lineage size from Shorti |
| `BriefSheet` | hook, timed lines (say / do), outfit, scene, caption; each line editable inline; Approve |
| `RenderJob` | queued → running → done, elapsed time in mono, provider tag (`live` or `prerender`) |
| `ReelPlayer` | 9:16 video, muted autoplay, the "AI-generated · Virtual human" pill fixed top-left, never hidden |
| `FixList` | at most three fixes from Shorti check, plus what to keep |
| `QueueWeek` | seven day slots, platform icon, state, Approve per item |
| `DealCard` | seller, product photo → ghost-fitted still, `demo` tag on any money |
| `DemoTag` | small `--warn` pill: "demo" / "pre-rendered" / "offline data" |
| `GhostDock` | row of ghost avatars, arrow keys move, chosen one pressed, `+N` overflow, optional `+` new ghost |
| `ReelGrid` | 9:16 tiles: poster, state pill, `AI` mark, `live`/`prerender`, age in mono; done tiles open the lightbox |
| `ReelLightbox` | full-screen reel: play/pause, m:ss, seek, sound (starts muted), download, copy link; AI label always on |
| `StepStrip` | the loop's three steps (고르기 · 승인하기 · 받기) as cards: done ✓, current in accent, ahead dimmed |
| `FunnelProgress` | back arrow, one segment per step (green done, violet current), `n/total` in mono |
| `SpendMeter` | today's cap left as `left / cap` and a bar; amber at a fifth left |

## Copy

- English by default (Tony 10-24), Korean kept for the toggle; Korean in 해요체. The ghost's content is in the
  market's language.
- Plain verbs: Keep, Skip, Write the brief, Approve and render. One line says why, a second may say what to do.
- Counts read "1.2M views · platform count · Oct 24", never a forecast, "guaranteed", or a percent. No em dash in copy.

## Motion on screens

- The taste deck fans (22 px right, 7 px down, 0.96) on the fan spring; a kept card leaves up-right, a skipped one
  drops left, on `leave`.
- Render waiting shows the ghost's poster and a `Progress` list, never a spinner or shimmer.
