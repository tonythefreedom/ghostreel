// Copy lives here, Korean first with English beside it. Plus the honest number and time formats.
export type UiLang = "ko" | "en";

/** The browser's own wish (Accept-Language): Korean when its first language is Korean, English otherwise. */
export function langFromAccept(accept: string | null): UiLang {
  return /^\s*ko\b/i.test(accept ?? "") ? "ko" : "en";
}

/** A ghost's niche in the page's language (the roster carries Korean beside English). */
export const nicheIn = (ghost: { niche: string; ko?: { niche?: string } }, lang: UiLang) =>
  (lang === "ko" && ghost.ko?.niche) || ghost.niche;

export const words = {
  brand: { ko: "고스트릴", en: "GhostReel" },
  tasteTitle: { ko: "오늘의 감각 고르기", en: "Teach your taste" },
  tasteLoading: { ko: "이번 주 해외 트렌드와 쇼티의 영상 읽기를 불러오는 중이에요. 처음엔 몇 초 걸려요.", en: "Fetching this week's trends abroad and Shorti's reading of each short. The first time takes a few seconds." },
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
  keepThese: { ko: "이것만 남기기", en: "Keep these" },
  keepPick: { ko: "하나 이상 골라 주세요.", en: "Pick one or more." },
  deck: { ko: "트렌드 덱", en: "Trend deck" },
  views: { ko: "조회", en: "views" },
  keptTitle: { ko: "오늘 남긴 숏폼", en: "What you kept" },
  keptSub: { ko: "하나를 고르고, 고스트가 얼마나 따라갈지 정해 주세요.", en: "Pick one, then how close the ghost stays." },
  nothingKept: { ko: "아직 남긴 영상이 없어요", en: "Nothing kept yet" },
  nothingKeptLine: { ko: "숏폼 하나를 남기면 거기서 브리프를 써요.", en: "Keep a short and the brief starts from it." },
  intentLabel: { ko: "얼마나 따라갈까요", en: "How close the ghost stays" },
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
  stageKeyframe: { ko: "첫 장면 만드는 중", en: "Making the opening frame" },
  stageVoice: { ko: "목소리 녹음 중", en: "Recording the voice" },
  stageLipsync: { ko: "립싱크 렌더 중", en: "Lip-sync render" },
  stageAssemble: { ko: "장면과 목소리 합치는 중", en: "Setting the frame to the voice" },
  etaAt: { ko: "예상 완료", en: "Est. done" },
  segment: { ko: "구간", en: "segment" },
  notLipSynced: { ko: "립싱크 아님", en: "Not lip-synced" },
  lipsyncUnavailable: {
    ko: "지금은 립싱크를 돌릴 GPU가 없어 장면과 목소리만 합쳤어요. 시작 전에 거절돼 GPU 몫은 쓰지 않았어요.",
    en: "No GPU can run lip-sync right now, so the frame was set to the voice. It was refused before starting; no GPU time was used.",
  },
  lipsyncFailed: { ko: "립싱크 렌더가 실패해 장면과 목소리만 합쳤어요.", en: "The lip-sync render failed, so the frame was set to the voice." },
  lipsyncLost: { ko: "CineSynth가 재시작돼 립싱크 작업을 잃어서 장면과 목소리만 합쳤어요.", en: "CineSynth restarted and lost the lip-sync job, so the frame was set to the voice." },
  fallbackClip: { ko: "대신 미리 렌더한 클립이에요", en: "The pre-rendered clip, shown instead" },
  renderLongNote: {
    ko: "립싱크는 보통 10~30분쯤 걸려요. 이 페이지를 닫아도 렌더는 서버에서 계속되고, 다시 열면 지금 진행률을 보여 줘요.",
    en: "Lip-sync usually takes about 10–30 min. Close this page if you like: the render goes on on the server, and it shows where it is when you come back.",
  },
  prerendered: { ko: "미리 렌더", en: "Pre-rendered" },
  prerenderOther: { ko: "다른 대본으로 렌더한 클립", en: "rendered from a different script" },
  speech: { ko: "대사", en: "Speech" },
  approveNote: {
    ko: "승인하면 잠기고 렌더가 시작돼요.",
    en: "Approving locks it and starts the render.",
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
  // The bar, the player's keys and the pencil (every page).
  metaDescription: {
    ko: "내 숏폼 감각을 가상 인간이 매일 대신 찍어요. 얼굴도 촬영도 없이, 채널 하나 더.",
    en: "Your short-form style, performed every day by a virtual human: no face, no shoot, a channel on the side.",
  },
  navLabel: { ko: "주요 메뉴", en: "Main" },
  navConnect: { ko: "Claude 연결", en: "Connect Claude" },
  navConnectShort: {
    ko: "Claude로 만들기",
    en: "Make with Claude",
  },
  play: { ko: "재생", en: "Play" },
  pause: { ko: "일시정지", en: "Pause" },
  soundOn: { ko: "소리 켜기", en: "Sound on" },
  soundOff: { ko: "소리 끄기", en: "Sound off" },
  coachOn: { ko: "코칭 색연필 켜기", en: "Coaching pencil on" },
  coachOff: { ko: "코칭 색연필 끄기", en: "Coaching pencil off" },
  nextCue: { ko: "다음 순간", en: "Next" },
  seek: { ko: "재생 위치", en: "Position" },
  fieldLabel: { ko: "분야", en: "Field" },
  fieldBeauty: { ko: "뷰티", en: "Beauty" },
  fieldFashion: { ko: "패션", en: "Fashion" },
  // Connect your Claude (/connect).
  connectEyebrow: {
    ko: "Claude 구독으로 만들기 · MCP",
    en: "Make it with your Claude · MCP",
  },
  connectTitle: {
    ko: "내 Claude가 고스트 영상을 만들어요",
    en: "Your Claude makes the ghost's video",
  },
  connectLede: {
    ko: "Claude Pro·Max 구독 그대로, Opus 5.5가 고스트릴 MCP 도구로 이번 주 트렌드를 보고, 브리프를 쓰고, 다시 읽고 고쳐요. 내가 승인하면 렌더해서 영상 링크까지 줘요. 고스트릴은 모델 키도 비용도 받지 않아요.",
    en: "On your Claude Pro or Max plan, Opus 5.5 uses GhostReel's MCP tools to read this week's trends, write the brief, read it back and refine it. Once you approve, it renders and hands you the video link. GhostReel takes no model key and no fee.",
  },
  connectHowLabel: { ko: "연결하면 이렇게 돼요", en: "How it works" },
  connectHow1: {
    ko: "로그인하고 토큰 받기 · 1분",
    en: "Sign in, get a token · 1 min",
  },
  connectHow2: {
    ko: "Claude가 트렌드 보고 브리프 작성",
    en: "Claude reads the trends and writes the brief",
  },
  connectHow3: {
    ko: "내가 승인 → Claude가 렌더해 영상 전달",
    en: "You approve → Claude renders and hands you the video",
  },
  connectStep1: { ko: "Google로 로그인", en: "Sign in with Google" },
  connectStep1Line: { ko: "CineSynth와 같은 계정이에요. 토큰은 이 계정에 묶여요.", en: "The same account as CineSynth. The token is tied to it." },
  connectPending: { ko: "CineSynth 승인 대기 중", en: "Waiting for CineSynth's approval" },
  connectPendingLine: {
    ko: "새 계정은 CineSynth 팀이 승인해야 토큰을 만들 수 있어요. 승인되면 이 페이지를 새로고침하세요.",
    en: "A new account needs the CineSynth team's approval before it can make a token. Reload this page once it is approved.",
  },
  connectStep2: { ko: "연결 토큰 만들기", en: "Make a connect token" },
  connectStep2Line: { ko: "7일 동안 쓸 수 있어요. 언제든 아래에서 끊을 수 있어요.", en: "It lasts 7 days. Revoke it below any time." },
  connectTokenOnce: { ko: "토큰은 지금 한 번만 보여요. 다음 단계에서 바로 쓰세요.", en: "Shown only now. Use it in the next step." },
  connectMake: { ko: "토큰 만들기", en: "Make a token" },
  connectMaking: { ko: "만드는 중…", en: "Making…" },
  connectNewToken: { ko: "새 토큰", en: "New token" },
  connectTokenFailed: { ko: "토큰을 만들지 못했어요. 잠시 후 다시 해 주세요.", en: "Couldn't make a token. Try again in a moment." },
  connectSignInAgain: { ko: "로그인이 끊겼어요. 다시 로그인해 주세요.", en: "Your sign-in ran out. Sign in again." },
  connectStep3: { ko: "Claude에 추가하기", en: "Add it to Claude" },
  connectStep3Line: { ko: "쓰는 Claude를 고르고 그대로 붙여 넣으세요.", en: "Pick your Claude and paste this as it is." },
  connectRunOnce: { ko: "터미널에서 한 번 실행", en: "Run once in a terminal" },
  connectCodeAfter: {
    ko: "실행한 뒤 Claude Code를 다시 열거나 /mcp 를 입력하면 ghostreel 도구 5개가 보여요.",
    en: "Then reopen Claude Code or type /mcp: five ghostreel tools appear.",
  },
  connectDesktopAfter: {
    ko: "Claude Desktop › 설정 › 개발자 › 구성 편집에 넣고 앱을 다시 켜세요. 웹 claude.ai는 아직 지원하지 않아요(OAuth 필요).",
    en: "Paste it in Claude Desktop › Settings › Developer › Edit Config, then restart the app. claude.ai on the web isn't supported yet (it needs OAuth).",
  },
  connectCheck: { ko: "연결 확인", en: "Check the connection" },
  connectCheckGo: { ko: "지금 확인", en: "Check now" },
  connectChecking: { ko: "확인 중…", en: "Checking…" },
  connectOk: { ko: "연결됐어요. 쓸 수 있는 도구", en: "Connected. Tools ready" },
  connectFail: { ko: "연결이 안 돼요.", en: "Not connected." },
  connectFail401: { ko: "토큰이 맞지 않거나 끊겼어요. 새 토큰을 만들어 주세요.", en: "The token is wrong or revoked. Make a new one." },
  connectStep4: {
    ko: "Claude에게 말하기",
    en: "Ask your Claude",
  },
  connectStep4Line: {
    ko: "이 한 줄이면 트렌드 고르기부터 영상까지 이어져요.",
    en: "One line takes it from picking a trend to the video.",
  },
  connectAsk1: {
    ko: "고스트릴로 유나의 다음 영상을 만들어줘. 이번 주 뷰티 트렌드를 보여 주고 내가 고르면 남겨 줘. 브리프를 써서 승인 링크를 주고, 내가 승인하면 렌더해서 영상 링크까지 줘.",
    en: "Make Yuna's next video with GhostReel: show me this week's beauty trends and keep the one I pick. Write the brief and give me the approval link; once I approve, render it and give me the video link.",
  },
  connectAsk2: { ko: "가장 최근 브리프를 읽고, 내 메모대로 다음 버전을 써서 다시 저장해줘.", en: "Read my latest brief and write its next version from my note." },
  connectAskAfter: {
    ko: "브리프 링크가 돌아오면 열어 보세요. 메모를 남기면 Claude가 다시 읽고 다음 버전을 같은 링크에 써요. 승인·렌더·게시는 Claude가 할 수 없어요.",
    en: "Open the brief link it returns. Leave a note and your Claude reads it and writes the next version at the same link. Claude can't approve, render or post.",
  },
  connectSelfTitle: { ko: "Claude가 알아서 연결하게 하기", en: "Let Claude set it up" },
  connectSelfLine: {
    ko: "Claude Code에 아래 문장을 그대로 보내면, 안내문을 읽고 연결을 직접 설정해요. 토큰만 물어봐요.",
    en: "Send this to Claude Code as it is: it reads the guide and sets up the connection itself, asking you only for the token.",
  },
  connectSelfAsk: { ko: "이 안내를 읽고 고스트릴을 연결해줘:", en: "Read this guide and connect GhostReel:" },
  connectLive: { ko: "살아 있는 토큰", en: "Live tokens" },
  connectNone: { ko: "아직 없어요.", en: "None yet." },
  connectUntil: { ko: "만료", en: "until" },
  connectWarn: {
    ko: "추가 명령은 셸 기록과 Claude 설정에 토큰을 남겨요. 공유된 컴퓨터라면 여기서 끊으세요. 로그아웃하면 모두 끊겨요.",
    en: "The add command leaves the token in your shell history and Claude config. Revoke it here on a shared machine. Signing out revokes them all.",
  },
  copy: { ko: "복사", en: "Copy" },
  copied: { ko: "복사됨", en: "Copied" },
  show: { ko: "보기", en: "Show" },
  hide: { ko: "가리기", en: "Hide" },
  revoke: { ko: "끊기", en: "Revoke" },
  revokeAll: { ko: "모두 끊기", en: "Revoke all" },
  signOut: { ko: "로그아웃", en: "Sign out" },
  signingIn: { ko: "로그인 중…", en: "Signing in…" },
  signInFailed: { ko: "로그인이 안 됐어요. 다시 해 주세요.", en: "Sign-in didn't go through. Try again." },
  signInNoLoad: {
    ko: "여기서는 Google 로그인을 불러오지 못했어요. 이 주소가 Google 클라이언트에 허용돼 있는지 확인해 주세요.",
    en: "Google sign-in couldn't load here. Check this site is an allowed origin for the client.",
  },
  // Onboarding (/onboard).
  obEyebrow: { ko: "가입", en: "Sign up" },
  obTitle: { ko: "내 작업을 한 번만 알려 주세요", en: "Tell us about your work, once" },
  obLede: {
    ko: "만들어 온 숏폼과 기획을 읽고 내 스타일을 익혀요. 그 스타일로 가상 인간이 매일 새 숏폼을 찍어 예약까지 준비해요.",
    en: "We read the shorts and plans you've made, learn your style, and a virtual human makes a new short in it every day, ready to schedule.",
  },
  obSignIn: { ko: "로그인", en: "Sign in" },
  obSignInLine: {
    ko: "CineSynth에서 쓰는 Google 계정으로 로그인해요. 렌더와 다운로드가 그 계정으로 돼요. 새 비밀번호는 없어요.",
    en: "Use the Google account you use for CineSynth. GhostReel renders and downloads as that account; no new password.",
  },
  obPending: {
    ko: "CineSynth가 아직 이 계정을 승인하지 않았어요. 팀에 승인을 요청한 뒤 다시 로그인해 주세요.",
    en: "CineSynth hasn't approved this account yet. Ask the team to approve it, then sign in again.",
  },
  obAbout: { ko: "나에 대해", en: "About you" },
  obName: { ko: "이름 또는 채널 이름", en: "Name or channel name" },
  obNiche: { ko: "분야", en: "Niche" },
  obNichePh: { ko: "예: K-뷰티 루틴, 홈카페, 패션 하울", en: "e.g. K-beauty routines, home café, fashion hauls" },
  obBio: { ko: "소개와 경력", en: "Bio and background" },
  obBioPh: { ko: "지금까지 만든 것, 잘하는 것", en: "What you've been making, and what you're good at" },
  obMarket: { ko: "시장", en: "Market" },
  obLangs: { ko: "영상 언어", en: "Video languages" },
  langEn: { ko: "영어", en: "English" },
  langKo: { ko: "한국어", en: "Korean" },
  langJa: { ko: "일본어", en: "Japanese" },
  langEs: { ko: "스페인어", en: "Spanish" },
  obMade: { ko: "만들어 온 것", en: "What you've made" },
  obLinks: { ko: "내 숏폼 링크 (선택, 한 줄에 하나, 최대 10개)", en: "Links to your shorts (optional, one per line, up to 10)" },
  obLinksPh: { ko: "TikTok, 릴스, 쇼츠 링크를 붙여 넣으세요", en: "Paste your TikTok, Reels or Shorts links" },
  obLinksNone: { ko: "없으면 이번 주 트렌드로 배워요", en: "none: your ghost learns from this week's trends" },
  obPlan: { ko: "예전 기획안 (선택)", en: "A past plan (optional)" },
  obPlanPh: { ko: "써 둔 기획이나 피치를 붙여 넣으세요", en: "Paste a plan or pitch you wrote" },
  obScript: { ko: "예전 대본 (선택)", en: "A past script (optional)" },
  obScriptPh: { ko: "써 둔 대본을 붙여 넣으세요", en: "Paste a script you wrote" },
  obOwn: {
    ko: "내가 권리를 가진 영상과 글만 올려 주세요. 스타일을 익히는 데만 쓰고 절대 베끼지 않아요.",
    en: "Share only videos and writing you own. We use them to learn your style and never copy them.",
  },
  obWho: { ko: "누가 대신 출연할까요", en: "Who performs for you" },
  obWhoLine: { ko: "내 대신 가상 인간이 나오고, 모든 영상에 이 표시가 붙어요:", en: "A virtual human appears instead of you, and every video carries the label" },
  obSaveFailed: { ko: "저장하지 못했어요. 입력을 확인해 주세요.", en: "Couldn't save. Check your answers." },
  obFaceNever: { ko: "내 얼굴은 나오지 않아요. 고스트가 출연해요.", en: "Your face never appears. The ghost performs." },
  obNeedSignIn: { ko: "Google로 로그인하면 다음으로 넘어가요.", en: "Sign in with Google to go on." },
  obNeedAbout: { ko: "이름, 분야, 영상 언어를 채워 주세요.", en: "Fill in your name, niche and a video language." },
  obNeedLinks: { ko: "링크는 10개까지예요.", en: "Up to 10 links." },
  obSaving: { ko: "저장 중…", en: "Saving…" },
  obSubmit: { ko: "가입하고 내 스타일 읽기", en: "Sign up and read my style" },
  noticeTitle: { ko: "내 Claude 구독으로 영상까지", en: "Your own Claude makes it, start to finish" },
  noticeLine: {
    ko: "Claude Pro·Max 구독의 Claude가 고스트릴 MCP로 트렌드 고르기부터 브리프, 렌더까지 해요. 로그인하고 토큰만 받으면 돼요.",
    en: "On your Claude Pro or Max plan, your Claude goes from picking a trend to the brief and the render over GhostReel's MCP. Sign in and get a token.",
  },
  noticeSelf: { ko: "Claude Code에 이렇게 말해도 돼요: “이 안내를 읽고 고스트릴 연결해줘”", en: "Or tell Claude Code: “Read this and connect GhostReel”" },
  // Landing additions.
  landingCue1: { ko: "민낯으로 시작, 화면에 20%", en: "Bare face to start, 20% on screen" },
  landingCue2: { ko: "세럼 한 번, 60%로 점프", en: "One serum, a jump to 60%" },
  landingCue3: { ko: "입술에 틴트, 카운터가 100%로", en: "Tint on the lips; the counter hits 100%" },
  landingCue4: { ko: "완성된 룩으로 끝", en: "End on the finished look" },
  landingPreviewNote: {
    ko: "고스트 유나의 미리보기 클립이에요(립싱크 전). 색연필이 브리프의 비트를 영상 위에 써요.",
    en: "A preview clip of Yuna, our ghost (before lip-sync). The pencil writes the brief's beats over it.",
  },
  landingClaudeH: { ko: "내 Claude로 영상 만들기", en: "Make it with your own Claude" },
  landingClaudeLine: {
    ko: "Claude Pro·Max 구독 그대로. Claude Code나 데스크톱에 연결하면 트렌드 고르기부터 브리프, 렌더까지 내 Claude가 MCP로 해요. 승인만 내가 해요.",
    en: "On your Claude Pro or Max plan. Connect Claude Code or Desktop and your own Claude does it over MCP, from picking a trend to the brief and the render. You only approve.",
  },
  close: { ko: "닫기", en: "Close" },
  download: { ko: "다운로드", en: "Download" },
  copyLink: { ko: "링크 복사", en: "Copy link" },
  // The 4D camera preset (brief, storyboard).
  presetTitle: { ko: "4D 카메라 프리셋", en: "4D camera preset" },
  presetLine: {
    ko: "원본에서 폰이 서 있던 자리를 시점마다 옆에서 본 그림이에요(쇼티 추정). 고스트 촬영도 이 자리에서 해요.",
    en: "Where the phone stood in the original, setup by setup, seen from the side (Shorti's estimate). The ghost's shot takes the same place.",
  },
  presetEstimate: { ko: "추정", en: "estimate" },
  presetHeight: { ko: "높이", en: "Height" },
  presetDist: { ko: "거리", en: "Distance" },
  presetTilt: { ko: "기울기", en: "Tilt" },
  presetFov: { ko: "화각", en: "FOV" },
  // The brief page additions.
  backToChannel: { ko: "채널", en: "Channel" },
  sourceTitle: { ko: "참고한 숏폼", en: "The short it learns from" },
  sourceLine: {
    ko: "색연필을 켜면 쇼티가 읽은 코칭 순간마다 멈춰서 짚어 줘요.",
    en: "Turn the pencil on: it stops at each coaching moment Shorti read and points it out.",
  },
  // Storyboard (/storyboard/[id]).
  sbTitle: { ko: "콘티", en: "Storyboard" },
  sbBeats: { ko: "비트", en: "beats" },
  sbReady: { ko: "장면 준비됨", en: "scenes ready" },
  sbNote: { ko: "장면은 CineSynth로 만들어요. 그 전엔 쓸 프롬프트를 보여 줘요.", en: "Scenes are made with CineSynth; until then each shows the prompt it will use." },
  sbLines: {
    ko: "대사 후보는 고스트릴이 썼고, 각 후보 밑에 쇼티가 원본에서 읽은 움직임·오프닝·빈자리를 쇼티의 말로 붙였어요",
    en: "GhostReel wrote the line options; each shows, in Shorti's own words, the move, opening or open spot it read in the source",
  },
  sbLocked: { ko: "승인된 브리프라 바꿀 수 없어요.", en: "The brief is approved, so it can't change." },
  sbPickNow: { ko: "고르면 브리프가 바로 바뀌어요.", en: "Picking one updates the brief right away." },
  sbToRender: { ko: "브리프 보고 렌더하기", en: "See the brief and render" },
  sbToApprove: { ko: "브리프로 돌아가 승인하기", en: "Back to the brief to approve" },
  sbPending: { ko: "장면 준비 중", en: "Scene pending" },
  sbPremade: { ko: "미리 만든 장면", en: "Pre-made scene" },
  sbPrompt: { ko: "프롬프트", en: "Prompt" },
  sbCopyPrompt: { ko: "장면 프롬프트 복사", en: "Copy scene prompt" },
  sbLinesFrom: { ko: "쇼티 기반 대사 후보", en: "Lines from Shorti" },
  sbChanging: { ko: "바꾸는 중…", en: "Changing…" },
  sbLockedShort: { ko: "승인된 브리프는 바꿀 수 없어요.", en: "An approved brief can't be changed." },
  // Profile (/profile/[id]).
  pfNoShorts: { ko: "아직 내 숏폼이 없어도 괜찮아요. 다음으로 해외에서 뜨는 숏폼을 골라 고스트를 가르쳐요.", en: "No shorts of your own yet? That's fine. Next, you'll pick shorts trending abroad to teach your ghost." },
  pfYourShorts: { ko: "내 숏폼", en: "Your shorts" },
  pfAlso: { ko: "함께 올린 것:", en: "Also shared:" },
  pfPlan: { ko: "기획안", en: "a plan" },
  pfScript: { ko: "대본", en: "a script" },
  pfNext: { ko: "다음에 할 일", en: "What happens next" },
  pfTune: { ko: "이번 주 트렌드로 맞추기", en: "Tune it to this week's trends" },
  pfStyle: { ko: "내 스타일", en: "Your style" },
  pfUnread: {
    ko: "쇼티가 아직 내 숏폼 {n}개를 읽지 못했어요. 공개된 TikTok·릴스·쇼츠 링크인지 확인해 주세요. 그동안 고스트는 이번 주 트렌드로 배워요.",
    en: "Shorti couldn't read your {n} shorts yet. Check that they are public TikTok, Reels or Shorts links. Meanwhile your ghost learns from this week's trends.",
  },
  pfOpenings: { ko: "내 오프닝", en: "Your openings" },
  pfMoves: { ko: "내 포맷의 히트작들이 공유하는 움직임", en: "Moves your formats' hits share" },
  pfOwn: { ko: "고스트가 내 것으로 바꿀 수 있는 것", en: "What your ghost can make its own" },
  pfCounted: { ko: "쇼티가 읽은 것으로 셌어요. 조회수나 결과는 예측하지 않아요.", en: "Counted from what Shorti read. No views or results are forecast." },
  unlockChecking: { ko: "로그인 확인 중…", en: "Checking your sign-in…" },
  castReady: { ko: "CineSynth 캐릭터 준비됨", en: "Ready in CineSynth" },
  castIncomplete: { ko: "CineSynth 3면 이미지 일부 없음", en: "CineSynth views incomplete" },
  castMissing: { ko: "내 CineSynth에 아직 없음", en: "Not in your CineSynth yet" },
  newCharacter: { ko: "CineSynth에서 새 캐릭터 만들기", en: "Create a new character in CineSynth" },
  newCharacterLine: {
    ko: "3면(정면·측면·뒷면)이 모두 생기면 여기서 고를 수 있어요. 만들고 돌아오면 목록이 새로 고쳐져요.",
    en: "Once all three views (front, side, back) are ready, it shows up here. The list refreshes when you come back.",
  },
  newCharacterFirst: { ko: "내 CineSynth에 아직 캐릭터가 없어요.", en: "Your CineSynth has no characters yet." },
  // Your own Claude makes it (Ted, 10-24: «mcp BYO로 claude opus 5.5 max등을 … 구독토큰을 써서»).
  cmTitleWrite: {
    ko: "내 Claude로 영상 만들기",
    en: "Make the video with your Claude",
  },
  cmTitleRevise: { ko: "내 Claude로 다듬고 영상까지", en: "Refine it and make the video with your Claude" },
  cmTitleShoot: {
    ko: "MCP로 영상 만들기",
    en: "Make the video over MCP",
  },
  cmLine: {
    ko: "Claude Pro·Max 구독 그대로 Opus 5.5를 effort max로 돌려요. 고스트릴은 키도 비용도 받지 않아요.",
    en: "Runs on your Claude Pro or Max plan: Opus 5.5 at max effort. GhostReel takes no key and no fee.",
  },
  cmCode: { ko: "Claude Code", en: "Claude Code" },
  cmApp: { ko: "Claude 데스크톱", en: "Claude Desktop" },
  cmCodeLabel: { ko: "터미널에 붙여 넣기", en: "Paste into a terminal" },
  cmAppLabel: { ko: "모델을 Opus 5.5로 고르고 이 문장을 보내세요", en: "Pick Opus 5.5, then send this" },
  cmNotYet: { ko: "아직 연결 전이라면", en: "Not connected yet?" },
  cmConnect: { ko: "1분 만에 연결", en: "Connect in a minute" },
  cmAskWrite: {
    ko: "고스트릴 MCP로 {ghost}의 다음 영상을 만들어줘. ghostreel_brief_context(ghostId \"{ghostId}\", videoId \"{videoId}\", intent \"{intent}\")로 자료를 받아 브리프를 직접 쓰고 ghostreel_brief_submit으로 저장한 뒤 승인 링크를 줘. 내가 승인하면 ghostreel_render로 렌더해서 영상 링크까지 줘.",
    en: "Make {ghost}'s next video with GhostReel's MCP: get the pack with ghostreel_brief_context (ghostId \"{ghostId}\", videoId \"{videoId}\", intent \"{intent}\"), write the brief yourself, save it with ghostreel_brief_submit and give me the approval link. Once I approve, render it with ghostreel_render and give me the video link.",
  },
  cmAskRevise: {
    ko: "고스트릴 브리프 {id}를 ghostreel_brief_get으로 읽고, 내 메모를 반영해 더 좋게 고친 다음 ghostreel_brief_revise로 다시 저장해줘. 무엇을 바꿨는지 한 줄로 알려주고, 내가 승인하면 ghostreel_render로 렌더해서 영상 링크까지 줘.",
    en: "Read GhostReel brief {id} with ghostreel_brief_get, apply my note and make it better, then save it back with ghostreel_brief_revise. Tell me in one line what you changed, and once I approve, render it with ghostreel_render and give me the video link.",
  },
  cmAskShoot: {
    ko: "고스트릴 브리프 {id}를 ghostreel_render로 렌더해줘. 끝날 때까지 다시 확인해서 영상 링크를 주고, 비트별 촬영 대본도 정리해줘.",
    en: "Render GhostReel brief {id} with ghostreel_render. Check again until it is done, give me the video link, and lay out a shot script per beat.",
  },
  // The loop on the brief page.
  loopTitle: { ko: "Claude와 고치기", en: "Refine it with your Claude" },
  loopLine: {
    ko: "메모를 남기고 Claude에게 다듬어 달라고 하면, 새 버전이 이 페이지에 바로 써져요.",
    en: "Leave a note, ask your Claude to refine it, and the new version lands on this page.",
  },
  noteLabel: { ko: "Claude에게 남길 메모", en: "Note for your Claude" },
  notePh: { ko: "예: 훅을 질문으로 바꿔줘. 마지막 비트는 더 짧게.", en: "e.g. Make the hook a question. A shorter last beat." },
  noteSave: { ko: "메모 저장", en: "Save note" },
  noteSaved: { ko: "✓ 메모 저장됨", en: "✓ Note saved" },
  versionWord: { ko: "버전", en: "Version" },
  byGhostreel: { ko: "고스트릴", en: "GhostReel" },
  byClaude: { ko: "내 Claude", en: "Your Claude" },
  byOwner: { ko: "내가 고침", en: "Edited by you" },
  newVersion: { ko: "새 버전 v{n}이 왔어요", en: "Version {n} is in" },
  loadIt: { ko: "불러오기", en: "Load it" },
  loadDrops: { ko: "저장 안 한 수정은 사라져요.", en: "Your unsaved edits will be dropped." },
  koMeaning: { ko: "뜻", en: "Meaning" },
  koStale: { ko: "고친 비트라 한국어 뜻은 다음 버전에서 다시 써져요.", en: "Edited; its Korean comes with the next version." },
  // Sign in instead of a passcode.
  signInToGo: { ko: "Google로 로그인하면 바로 이어져요", en: "Sign in with Google to carry on" },
  signInToGoLine: { ko: "로그인하면 방금 하던 일이 그대로 이어져요.", en: "Sign in and what you were doing carries on." },
  signInPending: { ko: "계정이 승인 대기 중이에요. 승인되면 바로 쓸 수 있어요.", en: "Your account is waiting for approval; it works as soon as it is approved." },
  operatorPasscode: { ko: "운영자 패스코드", en: "Operator passcode" },
  // Taste: the way on, in plain sight.
  writeFromKept: { ko: "{n}개로 브리프 쓰기", en: "Brief from {n} kept" },
  // Onboarding: a saved profile.
  obWelcome: { ko: "다시 오셨네요", en: "Welcome back" },
  obWelcomeLine: { ko: "저장된 프로필이 있어요. 이어서 하거나 고칠 수 있어요.", en: "Your profile is saved. Carry on, or edit it." },
  obContinue: { ko: "이어서 하기", en: "Carry on" },
  obEditProfile: { ko: "프로필 고치기", en: "Edit profile" },
  obUpdate: { ko: "저장하고 계속", en: "Save and continue" },
  obResumed: { ko: "입력하던 내용을 이어서 보여 줘요.", en: "Picked up where you left off." },
  // The landing hero's lines in Korean (Yuna speaks English).
  landingSay1: { ko: "준비 시작, 20퍼센트.", en: "Getting ready — twenty percent." },
  landingSay2: { ko: "세럼 바르고, 60.", en: "Serum on: sixty." },
  landingSay3: { ko: "틴트 한 번에 100.", en: "One swipe of tint: a hundred." },
  landingSay4: { ko: "끝.", en: "Done." },
  connectModel: {
    ko: "Claude Code에서 바로 · Opus 5.5 · effort max",
    en: "Straight from Claude Code · Opus 5.5 · max effort",
  },
  connectDesktopAsk: { ko: "Claude 데스크톱이라면 모델을 Opus 5.5로 고르고 이렇게 보내세요", en: "In Claude Desktop, pick Opus 5.5 and send this" },
  currentLine: { ko: "지금 대사", en: "Current line" },
  renderByClaude: { ko: "내 Claude로도 렌더할 수 있어요.", en: "Your Claude can render it too." },
  landingClaudeGo: { ko: "내 Claude로 만들기", en: "Make it with Claude" },
  connectModelLine: {
    ko: "Claude Pro·Max 구독이 그대로 쓰여요. 고스트릴은 모델 비용을 받지 않아요.",
    en: "Your Claude Pro or Max plan covers it. GhostReel never bills for the model.",
  },
} as const satisfies Record<string, Record<UiLang, string>>;

export type WordKey = keyof typeof words;
export const t = (key: WordKey, lang: UiLang = "en") => words[key][lang];
/** A line with {slots} filled in. */
export const fill = (text: string, slots: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (m, k: string) => (k in slots ? String(slots[k]) : m));

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
