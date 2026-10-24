// Copy lives here, Korean first with English beside it. Plus the honest number and time formats.
export type UiLang = "ko" | "en";

export const words = {
  brand: { ko: "고스트릴", en: "GhostReel" },
  tasteTitle: { ko: "오늘의 감각 고르기", en: "Teach your taste" },
  tasteSub: {
    ko: "이번 주 해외에서 뜨는 숏폼이에요. 내 고스트가 따라 했으면 하는 것만 남기세요.",
    en: "Shorts rising abroad this week. Keep only what your ghost should learn from.",
  },
  keep: { ko: "남기기", en: "Keep" },
  skip: { ko: "넘기기", en: "Skip" },
  undo: { ko: "되돌리기", en: "Undo" },
  keepWhat: { ko: "무엇을 남길까요?", en: "What should the ghost keep?" },
  hook: { ko: "훅", en: "Hook" },
  beat: { ko: "흐름", en: "Beats" },
  look: { ko: "룩", en: "Look" },
  sound: { ko: "사운드", en: "Sound" },
  next: { ko: "다음", en: "Next" },
  done: { ko: "다 골랐어요", en: "Done" },
  kept: { ko: "남긴 영상", en: "Kept" },
  platformCount: { ko: "플랫폼 집계", en: "platform count" },
  readBy: { ko: "Shorti 읽음", en: "read by Shorti" },
  fixture: { ko: "기록된 데이터", en: "recorded data" },
  aiLabel: { ko: "AI-generated · Virtual human", en: "AI-generated · Virtual human" },
  intentKeep: { ko: "그대로", en: "Keep" },
  intentAdapt: { ko: "내 식대로", en: "Adapt" },
  intentTwist: { ko: "비틀기", en: "Twist" },
  writeBrief: { ko: "브리프 쓰기", en: "Write the brief" },
  writing: { ko: "쓰는 중", en: "Writing" },
  locked: { ko: "오너만 쓸 수 있어요. 패스코드를 넣어 주세요.", en: "Owner only. Enter the passcode." },
  unlock: { ko: "열기", en: "Unlock" },
  wrongPasscode: { ko: "패스코드가 달라요. 다시 넣어 주세요.", en: "Wrong passcode. Try again." },
  save: { ko: "저장", en: "Save" },
  saved: { ko: "저장됨", en: "Saved" },
  approveRender: { ko: "승인하고 렌더", en: "Approve and render" },
  approved: { ko: "승인됨", en: "Approved" },
  storyboard: { ko: "콘티 보기", en: "See the storyboard" },
  hookLabel: { ko: "훅 (첫 1초)", en: "Hook (first second)" },
  say: { ko: "대사", en: "Say" },
  doLabel: { ko: "동작", en: "Do" },
  addLine: { ko: "+ 비트 추가", en: "+ Add beat" },
  remove: { ko: "삭제", en: "Remove" },
  hashtags: { ko: "해시태그", en: "Hashtags" },
  editFailed: { ko: "저장하지 못했어요. 입력을 확인해 주세요.", en: "Couldn't save. Check the fields." },
  renderQueued: { ko: "렌더 대기 중", en: "Render queued" },
  renderRunning: { ko: "렌더 중", en: "Rendering" },
  renderDone: { ko: "렌더 완료", en: "Render done" },
  renderFailed: { ko: "렌더 실패", en: "Render failed" },
  renderRetry: { ko: "다시 렌더", en: "Render again" },
  prerendered: { ko: "미리 렌더", en: "Pre-rendered" },
  prerenderOther: { ko: "다른 대본으로 렌더한 클립", en: "rendered from a different script" },
  speech: { ko: "대사", en: "Speech" },
  approveNote: {
    ko: "승인하면 브리프가 잠기고, 그때 처음으로 GPU 렌더가 시작돼요.",
    en: "Approving locks the brief; only then does a GPU render start.",
  },
  noModelKey: { ko: "이 배포에는 아직 모델 키가 없어요.", en: "This deploy has no model key yet." },
  briefFailed: { ko: "브리프를 못 썼어요. 다시 해 볼게요?", en: "Couldn't write the brief. Try again?" },
  briefTitle: { ko: "고스트 브리프", en: "Ghost brief" },
  draft: { ko: "초안", en: "Draft" },
  outfit: { ko: "의상", en: "Outfit" },
  scene: { ko: "장면", en: "Scene" },
  caption: { ko: "캡션", en: "Caption" },
  twistUsed: { ko: "비튼 지점", en: "Twist" },
  // The ghost's channel (/ghost/[id], T13).
  channelTrust: { ko: "고스트 숏폼 · AI 생성 · 내가 승인한 브리프로 만들어요", en: "Ghost reels · AI-generated · made from briefs you approved" },
  reels: { ko: "숏폼", en: "Reels" },
  noReels: { ko: "아직 완성된 숏폼이 없어요", en: "No reels yet" },
  noReelsLine: { ko: "승인한 브리프가 여기서 숏폼이 돼요.", en: "An approved brief becomes a reel here." },
  findShort: { ko: "배울 숏폼 고르기", en: "Find a short to learn from" },
  week: { ko: "이번 주", en: "This week" },
  weekNote: {
    ko: "브리프는 쓴 순서대로 오늘부터 하루에 하나씩 놓여요.",
    en: "Briefs fill the days in the order they were written, one a day from today.",
  },
  written: { ko: "작성", en: "written" },
  briefOne: { ko: "브리프 쓰기", en: "Brief one" },
  open: { ko: "열기", en: "Open" },
  approve: { ko: "승인", en: "Approve" },
  ready: { ko: "완성", en: "Ready" },
  today: { ko: "오늘", en: "today" },
  laterBriefs: { ko: "개의 브리프가 이번 주 다음을 기다려요", en: "more briefs wait after this week" },
  approveDraft: { ko: "가장 오래된 초안 승인하기", en: "Approve the oldest draft" },
  teachShort: { ko: "새 숏폼 가르치기", en: "Teach a new short" },
  noViewsPromise: { ko: "조회수는 절대 약속하지 않아요.", en: "We never promise views." },
  reelOf: { ko: "숏폼 열기", en: "Open reel" },
  intentKeepLong: { ko: "그대로 따라 하기", en: "Keep as is" },
  intentAdaptLong: { ko: "내 식대로", en: "Make it yours" },
  intentTwistLong: { ko: "비틀기", en: "Twist it" },
  keptParts: { ko: "남긴 것", en: "Kept" },
  moreDetail: { ko: "더 자세히", en: "More detail" },
  moreDetailNote: { ko: "의상 · 장면 · 캡션 · 해시태그", en: "Outfit · scene · caption · hashtags" },
  speechOver: { ko: "대사를 줄여 주세요", en: "trim a line" },
  beatWord: { ko: "비트", en: "Beat" },
  startsAt: { ko: "시작 시각", en: "Starts at" },
  length: { ko: "길이", en: "Length" },
  stepWritten: { ko: "브리프 작성", en: "Brief written" },
  stepReady: { ko: "릴 완성", en: "Reel ready" },
  renderStart: { ko: "렌더 시작", en: "Start the render" },
  nextShort: { ko: "다음 숏폼 고르기", en: "Pick the next short" },
  landingH1a: { ko: "얼굴도 촬영도 없이.", en: "No face, no shoot." },
  landingH1b: { ko: "고스트가 찍어요.", en: "Your ghost stars." },
  landingLede: {
    ko: "마음에 드는 숏폼을 고르고 브리프를 승인하면, 가상 인간이 출연한 숏폼을 받아요.",
    en: "Pick shorts you like, approve the brief, and get a reel a virtual human stars in.",
  },
  landingGo: { ko: "내 고스트 만들기", en: "Make my ghost" },
  landingHow: { ko: "어떻게 하나요", en: "How it works" },
  landingPickH: { ko: "고르기", en: "Pick" },
  landingPickLine: { ko: "해외에서 뜨는 숏폼에서 훅, 흐름, 룩, 사운드 중 남길 것만 골라요.", en: "From shorts trending abroad, keep the hook, beats, look or sound." },
  landingApproveH: { ko: "승인하기", en: "Approve" },
  landingApproveLine: { ko: "고스트가 쓴 브리프를 고치고, 승인해야 렌더가 시작돼요.", en: "Edit the ghost's brief; nothing renders until you approve it." },
  landingGetH: { ko: "받기", en: "Get it" },
  landingGetLine: { ko: "고스트가 출연한 숏폼을 받아 직접 올려요. 내 얼굴은 나오지 않아요.", en: "Get the reel and post it yourself. Your face never appears." },
  landingFoot: {
    ko: "고스트의 모든 영상에는 AI-generated · Virtual human 표시가 붙어요.",
    en: "Every ghost reel carries the AI-generated · Virtual human label.",
  },
  landingSampleHook: { ko: "10초 만에 준비 끝", en: "Ready in ten seconds" },
  landingSampleBeat1: { ko: "민낯 클로즈업", en: "Close-up, bare face" },
  landingSampleBeat2: { ko: "비트에 맞춘 빠른 컷", en: "Quick cuts on the beat" },
  landingSampleBeat3: { ko: "완성된 룩, 작게 손인사", en: "Full look, a small wave" },
  landingSample: { ko: "예시", en: "example" },
  ghostPicture: { ko: "고스트 유나의 장면", en: "A frame of Yuna, a GhostReel ghost" },
} as const satisfies Record<string, Record<UiLang, string>>;

export type WordKey = keyof typeof words;
export const t = (key: WordKey, lang: UiLang = "en") => words[key][lang];

// Counts: at most three significant digits. KO uses 만/억, EN uses K/M/B. Never a forecast, only what was read.
export function viewCount(n: number, lang: UiLang = "en"): string {
  const sig = (x: number) => (x >= 100 ? Math.round(x).toString() : x >= 10 ? x.toFixed(1).replace(/\.0$/, "") : x.toFixed(2).replace(/\.?0+$/, ""));
  if (lang === "ko") {
    if (n >= 1e8) return `${sig(n / 1e8)}억`;
    if (n >= 1e4) return `${sig(n / 1e4)}만`;
    return n.toLocaleString("ko-KR");
  }
  if (n >= 1e9) return `${sig(n / 1e9)}B`;
  if (n >= 1e6) return `${sig(n / 1e6)}M`;
  if (n >= 1e3) return `${sig(n / 1e3)}K`;
  return String(n);
}

// Dates in KST: «10.21» in KO, "Oct 21" in EN.
export function shortDate(iso: string, lang: UiLang = "en"): string {
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso);
  if (Number.isNaN(d.getTime())) return "";
  const kst = new Date(d.getTime() + 9 * 3600_000);
  const m = kst.getUTCMonth();
  const day = kst.getUTCDate();
  return lang === "ko"
    ? `${m + 1}.${day}`
    : `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m]} ${day}`;
}
