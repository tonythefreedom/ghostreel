// Shared. The coaching pencil's strokes, as a hand draws them: an underline that bows a little and lifts at its end, and
// a ring round a word that runs past where it started. Seeded by the words they mark, so a stroke keeps its shape at
// every draw. Pure, so tests run it without a page. Paths are in px of the box they are drawn in.

type Pt = readonly [number, number];

/** A small repeatable random from a string (FNV-1a, then xorshift). */
export function seeded(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 100_000) / 100_000;
  };
}

const r1 = (v: number) => Math.round(v * 10) / 10;

/** A smooth run through the points (Catmull-Rom as cubic Béziers), its ends held. */
export function through(pts: readonly Pt[]): string {
  if (pts.length < 2) return "";
  const at = (i: number): Pt => pts[Math.max(0, Math.min(pts.length - 1, i))]!;
  const first = at(0);
  let d = `M${r1(first[0])} ${r1(first[1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    d += `C${r1(p1[0] + (p2[0] - p0[0]) / 6)} ${r1(p1[1] + (p2[1] - p0[1]) / 6)} ${r1(p2[0] - (p3[0] - p1[0]) / 6)} ${r1(p2[1] - (p3[1] - p1[1]) / 6)} ${r1(p2[0])} ${r1(p2[1])}`;
  }
  return d;
}

/** An underline `w` px long in a box `h` px tall: it starts a hair low, bows, and lifts as the hand leaves. */
export function underline(w: number, h: number, seed: string): string {
  const rnd = seeded(`u:${seed}`);
  const y = h * 0.62;
  const n = 5;
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const x = (w * i) / n;
    const lift = i === n ? -h * 0.22 : 0;
    pts.push([x + (i === 0 ? 0 : (rnd() - 0.5) * 3), y + (rnd() - 0.5) * h * 0.18 + lift]);
  }
  return through(pts);
}

/** A ring round a box `w`×`h`: a loose ellipse a little wider than the words, running on past its start. */
export function ring(w: number, h: number, seed: string): string {
  const rnd = seeded(`r:${seed}`);
  const cx = w / 2;
  const cy = h / 2;
  const rx = w / 2 - 1;
  const ry = h / 2 - 1;
  const start = -Math.PI * (0.55 + rnd() * 0.1);
  const turn = Math.PI * 2 + 0.55;
  const n = 11;
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const a = start + (turn * i) / n;
    const k = 0.94 + rnd() * 0.08 + (i / n) * 0.04; // the hand drifts outward as it comes round
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  return through(pts);
}
