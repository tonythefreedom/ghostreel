# GhostReel — PRD

GhostReel (고스트릴) turns a person's short-form taste into a virtual character that performs like a human, so that
person owns a channel that posts to the world every day as a side income. Built in one 8-hour hackathon on two
products the team already runs: **Shorti** (reads what short-form is working, format by format) and **NEWTYPE
CineSynth on Nexus** (renders one consistent virtual human in every format, AI-labelled).

## Submission

- Theme: AI로 사라질 직업 1,000만 명을 구할 제품
- Service: 고스트릴 (GhostReel)
- Mission: AI가 일자리를 가져간 자리에, 내 감각으로 AI가 대신 벌어오는 글로벌 부업을 만든다.
- One line: 내가 고른 숏폼 감각을 사람처럼 출연하는 가상 캐릭터에 입혀, 얼굴도 촬영도 없이 전 세계에 매일 올라가
  돈 버는 채널을 부업으로 갖게 한다.
- Target market: global, English-speaking first (TikTok, Instagram Reels, YouTube Shorts).
- Repo: https://github.com/tonythefreedom/ghostreel

## Problem

AI takes the execution side of creative and commerce work first: modelling, shooting, editing, product-video
production, junior marketing. What it does not take is a person's judgement of what is good. Today that judgement
earns nothing on its own: to run a channel you still need a face you are willing to show, a camera, a schedule, and
editing skill, every single day. Most people with taste have none of those, and the ones who lose execution jobs
lose the paycheck that used to pay for their taste.

## Who it is for

- **Primary: a person whose execution job is going to AI** and who has an eye for short-form. Illustrative persona:
  a 34-year-old e-commerce MD in Seoul who knows beauty, will not show her face, and has ten minutes a day.
- **Secondary: a creator who wants a second, faceless channel** in another language without a second shoot.
- **Buyer side (later): sellers and brands** who commission a ghost to wear or hold their product (NEWTYPE's first
  customer: fashion and beauty sellers).

## The loop (what the person does)

1. **Pick a ghost.** Choose a virtual human (face, look, voice) and a niche and market, e.g. "K-beauty for the US".
2. **Teach taste (the daily game).** Swipe real shorts that are working this week in that market (Shorti radar).
   Keep or skip; on a keep, mark what to keep: hook, beat, look, or sound. This is the human's only job, and it is
   the asset.
3. **Approve the brief.** GhostReel writes the ghost's next short from the kept format's beats: hook, 3–5 lines,
   outfit, scene, caption. The person edits a line and approves. Nothing renders before approval.
4. **Watch the ghost perform.** CineSynth renders the ghost doing it, with the "AI-generated · Virtual human" label
   burned in.
5. **Check the take.** Shorti compares the render with that format's hits and returns at most three fixes.
6. **Run the channel.** A 7-day queue of the ghost's shorts; the person approves each post. Seller deals (product
   photo in, the ghost wears or holds it) are how the channel earns.

## Strengths we carry from the old surfaces

- Shorti: real counts as the platform reported them; a format is a lineage, not a template; "keep the core, make the
  surface yours"; a check says at most three fixes; the daily pick-the-breakout game.
- NEWTYPE: one character, every format; preview and consent before any GPU render; the AI label cannot be turned
  off; voice only with a consent record; posting needs the person's approval.

## Scope for the 8 hours

Must (the demo fails without it):
- Taste swipe fed by live Shorti data (`shorti_what_to_shoot`, lens `radar`), with a recorded fixture as fallback.
- Brief composed from a kept format (`shorti_format`, `shorti_recipe`) plus the ghost persona, editable, approved.
- At least one real CineSynth render of an approved brief, shown with the AI label.
- Ghost channel page: reels, 7-day queue, approve-to-post state.

Should:
- `shorti_check` on a render, showing up to three fixes.
- One seller-deal card: product photo → ghost wears it (CineSynth virtual fitting) → queued short.
- English captions plus one more language for the same render.

Won't (said out loud in the pitch):
- Real posting to TikTok, Instagram, or YouTube (platform app review does not fit in 8 hours; the queue stops at
  "approved").
- Payments, payouts, accounts, or sign-in (one demo owner).
- Creating a ghost from a real person's face or voice.

## Demo script (3 minutes)

| Time | Beat |
| --- | --- |
| 0:00 | The problem in one sentence: AI took the shoot; it cannot take your taste. |
| 0:20 | Pick ghost "Yuna", niche "K-beauty for the US", language English. |
| 0:40 | Swipe 8 real US shorts trending this week; keep 3, mark "keep the hook" on one. |
| 1:10 | GhostReel writes Yuna's brief from that format; edit one line; approve. |
| 1:30 | Yuna performs it in English, AI label on screen (a render started earlier in the day, shown as such). |
| 2:00 | Shorti check: two fixes. |
| 2:20 | Channel: a week of queued shorts, a seller deal where Yuna wears the product, approve. |
| 2:40 | Close: ten minutes of taste a day; the ghost does the shoot, in any language. |

## Success for the hackathon

- The full loop runs end to end on the deployed URL with live Shorti data and one live CineSynth render.
- Every visible number is either a platform count read by Shorti or labelled as demo.
- A judge can open the ghost's channel page on a phone.

## Honesty rules the product keeps

- Never say a view count, likeness, or order forecasts or caused views, and never promise earnings.
- Every ghost frame carries the AI label; every ghost is a virtual human, never a real person's likeness.
- Demo or mocked numbers (earnings, deal value) wear a visible "demo" tag.

## Risks

| Risk | Answer |
| --- | --- |
| CineSynth render takes minutes to tens of minutes | Start renders by hour 3; demo plays a finished one and shows a live job's status. |
| Shorti or NEWTYPE endpoint fails on stage | Recorded fixtures and pre-rendered clips behind the same adapters, labelled. |
| Two people editing the same files | Lane ownership by folder (see RULES.md); `lib/types.ts` changes by agreement only. |
