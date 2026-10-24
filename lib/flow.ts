// Lane B. The creator-first loop as the step strip shows it: register once, then pick, approve, get, every day.
export const CREATOR_FLOW: Array<{ title: string; body: string }> = [
  { title: "등록", body: "내 배경과 숏폼, 기획을 한 번 알려 줘요. Shorti 가 내 스타일을 읽어요." },
  { title: "고르기", body: "이번 주 해외에서 뜨는 숏폼에서 내 스타일에 맞는 것을 남겨요." },
  { title: "승인하기", body: "고스트가 쓴 브리프와 콘티를 고치고, 대사를 고른 뒤 승인해요." },
  { title: "받기", body: "가상 인물이 출연한 숏폼을 받아 예약해요. 내 얼굴은 나오지 않아요." },
];

/** Where each screen sits in the loop (1-based, for StepStrip and FunnelProgress). */
export const FLOW_STEP = { onboard: 1, profile: 2, taste: 2, brief: 3, storyboard: 3, channel: 4 } as const;
