// Lane B. The creator-first loop as the step strip shows it: register once, then pick, approve, get, every day.
export const CREATOR_FLOW: Array<{ title: string; body: string }> = [
  { title: "Sign up", body: "Share your background, shorts and plans once. Shorti reads your style." },
  { title: "Pick", body: "Keep the shorts trending abroad this week that fit your style." },
  { title: "Approve", body: "Edit the brief and storyboard your ghost wrote, pick the lines, then approve." },
  { title: "Get it", body: "Get the short your virtual human stars in and schedule it. Your face never appears." },
];

/** Which trend deck fits a creator's niche: Shorti's fields are beauty and fashion; beauty when neither is named. */
export function fieldFor(niche: string): "beauty" | "fashion" {
  return /fashion|style|outfit|ootd|패션|코디|스타일|옷/i.test(niche) ? "fashion" : "beauty";
}

/** Where each screen sits in the loop (1-based, for StepStrip and FunnelProgress). */
export const FLOW_STEP = { onboard: 1, profile: 2, taste: 2, brief: 3, storyboard: 3, channel: 4 } as const;
