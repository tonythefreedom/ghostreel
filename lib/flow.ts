// Lane B. The creator-first loop as the step strip shows it: register once, then pick, approve, get, every day.
export const CREATOR_FLOW: Array<{ title: string; body: string }> = [
  { title: "Sign up", body: "Share your background, shorts and plans once. Shorti reads your style." },
  { title: "Pick", body: "Keep the shorts trending abroad this week that fit your style." },
  { title: "Approve", body: "Edit the brief and storyboard your ghost wrote, pick the lines, then approve." },
  { title: "Get it", body: "Get the short your virtual human stars in and schedule it. Your face never appears." },
];
export const CREATOR_FLOW_KO: Array<{ title: string; body: string }> = [
  { title: "가입", body: "경력과 숏폼, 기획을 한 번만 알려 주면 쇼티가 내 스타일을 읽어요." },
  { title: "고르기", body: "이번 주 해외에서 뜨는 숏폼 중 내 스타일에 맞는 것만 남겨요." },
  { title: "승인하기", body: "고스트가 쓴 브리프와 콘티를 고치고 대사를 골라 승인해요." },
  { title: "받기", body: "가상 인간이 출연한 숏폼을 받아 예약해요. 내 얼굴은 나오지 않아요." },
];

/** Which trend deck fits a creator's niche: Shorti's fields are beauty and fashion; beauty when neither is named. */
export function fieldFor(niche: string): "beauty" | "fashion" {
  return /fashion|style|outfit|ootd|패션|코디|스타일|옷/i.test(niche) ? "fashion" : "beauty";
}

/** Where each screen sits in the loop (1-based, for StepStrip and FunnelProgress). */
export const FLOW_STEP = { onboard: 1, profile: 2, taste: 2, brief: 3, storyboard: 3, channel: 4 } as const;
