# GhostReel — Design

Working proposal so the build can start; Ted decides the brand and can replace any of it.

## Vibe

A ghost that works the night shift for you. Calm, dark, a little uncanny, never spooky-cute. The ghost's reels are
the brightest thing on every screen; the chrome around them stays quiet. Phone first, because the product is 9:16.

## Colour

Night base with one violet accent, so NEWTYPE's purple-lit characters sit naturally on it, and one "ghost" mint for
the human's own actions (keep, approve).

| Token | Hex | Use |
| --- | --- | --- |
| `--bg` | `#0D0B1A` | page background |
| `--surface` | `#16132A` | cards, sheets |
| `--surface-2` | `#211C3B` | raised, hover |
| `--line` | `#2E2850` | borders, dividers |
| `--text` | `#F4F2FF` | primary text |
| `--text-dim` | `#A39DC4` | secondary text |
| `--accent` | `#8B5CF6` | ghost, render, brand moments |
| `--accent-soft` | `#8B5CF61F` | accent backgrounds |
| `--ghost` | `#7CF5D4` | the person's actions: keep, approve, post |
| `--warn` | `#FFB547` | demo tags, fallback notices |
| `--danger` | `#FF5C7A` | failed render, skip |

Light theme is out of scope for the hackathon; the app sets `color-scheme: dark`.

## Type

- **Pretendard Variable** for everything (Korean first, Latin covered), loaded with `next/font/local` or the
  jsDelivr build.
- **JetBrains Mono** only for timestamps, durations, and counts.
- Scale: 32 / 24 / 18 / 15 / 13 px. Weights 400, 600, 800. Headlines 800 with −0.02em tracking.

## Layout

- Base width 390 px, 16 px side gutter, 12 px card radius, 8 px spacing grid.
- On desktop the app sits in a centred 430 px column; the ghost channel page gets a right-hand panel for the queue.
- Bottom action bar on every flow screen: one primary button, full width, `--ghost` fill for the person's action,
  `--accent` fill for the ghost's action (render).

## Components

| Component | What it shows |
| --- | --- |
| `GhostCard` | portrait, name, niche, market, languages; selected state with accent ring |
| `TasteSwipe` | one 9:16 trend card at a time, platform count and "read by Shorti at HH:MM", keep / skip, then keep-chips |
| `KeepChips` | hook · beat · look · sound, multi-select, mint when on |
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
| `FunnelProgress` | back arrow, one segment per step (mint done, violet current), `n/total` in mono |
| `SpendMeter` | today's cap left as `left / cap` and a bar; amber at a fifth left |

## Copy

- Korean first, English toggle in the header. The ghost's content (scripts, captions) is in the market's language,
  English first.
- Plain verbs on buttons: 고르기, 남기기, 넘기기, 승인하고 렌더, 게시 승인.
- Counts read "조회수 1.2M · 플랫폼 집계 · 10/24 Shorti 읽음", never "예상", "보장", or a forecast.

## Motion

- Swipe card exits 180 ms ease-out; keep flies up-right in mint, skip drops left in dim.
- Render progress is a slow violet shimmer across the reel frame, no spinners.
- Respect `prefers-reduced-motion`: fades only.
