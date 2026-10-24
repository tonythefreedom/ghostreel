// Lane B (gift from Lane A, 10-24). The kit's pure rules, kept apart so node tests reach them without a DOM.

/** Arrow-key move across a row of controls; wraps at both ends. Other keys return null. */
export function rovingNext(index: number, length: number, key: string): number | null {
  if (length <= 0) return null;
  if (key === "ArrowRight" || key === "ArrowDown") return (index + 1) % length;
  if (key === "ArrowLeft" || key === "ArrowUp") return (index - 1 + length) % length;
  if (key === "Home") return 0;
  if (key === "End") return length - 1;
  return null;
}

/** Seconds as m:ss for the mono time readout. */
export function clock(seconds: number): string {
  const s = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** "방금", "3분", "2시간", "5일" (or the English short form) since an ISO time. */
export function age(iso: string, now: number, lang: "ko" | "en" = "ko"): string {
  const at = Date.parse(iso);
  if (Number.isNaN(at)) return "";
  const min = Math.floor(Math.max(0, now - at) / 60_000);
  const [m, h, d, just] = lang === "ko" ? ["분", "시간", "일", "방금"] : ["m", "h", "d", "now"];
  if (min < 1) return just;
  if (min < 60) return `${min}${m}`;
  if (min < 1440) return `${Math.floor(min / 60)}${h}`;
  return `${Math.floor(min / 1440)}${d}`;
}

/** What is left of today's cap, as a count, a whole percent, and whether to warn (a fifth or less left). */
export function remaining(used: number, cap: number): { left: number; pct: number; low: boolean } {
  if (!(cap > 0)) return { left: 0, pct: 0, low: true };
  const left = Math.max(0, Math.min(cap, cap - Math.max(0, used)));
  const pct = Math.round((left / cap) * 100);
  return { left, pct, low: left / cap <= 0.2 };
}

/** Per segment of a step funnel: done, current, or ahead. `step` is 1-based. */
export function segments(step: number, total: number): ("done" | "now" | "ahead")[] {
  const n = Math.max(0, Math.floor(total));
  return Array.from({ length: n }, (_, i) => (i + 1 < step ? "done" : i + 1 === step ? "now" : "ahead"));
}
