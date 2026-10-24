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

/** A box drawn by hand round [x0, y0, x1, y1]: four strokes, each corner turned a little past its line. */
export function handBox(x0: number, y0: number, x1: number, y1: number, seed: string): string {
  const rnd = seeded(`b:${seed}`);
  const j = () => (rnd() - 0.5) * 3;
  const over = Math.min(8, Math.max(3, Math.min(x1 - x0, y1 - y0) * 0.08));
  const side = (a: Pt, b: Pt) => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const ux = (dx / len) * over;
    const uy = (dy / len) * over;
    return through([[a[0] - ux * 0.4 + j(), a[1] - uy * 0.4 + j()], [(a[0] + b[0]) / 2 + j(), (a[1] + b[1]) / 2 + j()], [b[0] + ux + j(), b[1] + uy + j()]]);
  };
  return [side([x0, y0], [x1, y0]), side([x1, y0], [x1, y1]), side([x1, y1], [x0, y1]), side([x0, y1], [x0, y0])].join("");
}

/** A frame-wide box as a viewfinder's four corners, never a cage round the picture. */
export function corners(x0: number, y0: number, x1: number, y1: number): string {
  const k = Math.min(28, (x1 - x0) * 0.16, (y1 - y0) * 0.16);
  return [
    `M${r1(x0)} ${r1(y0 + k)}L${r1(x0)} ${r1(y0)}L${r1(x0 + k)} ${r1(y0)}`,
    `M${r1(x1 - k)} ${r1(y0)}L${r1(x1)} ${r1(y0)}L${r1(x1)} ${r1(y0 + k)}`,
    `M${r1(x1)} ${r1(y1 - k)}L${r1(x1)} ${r1(y1)}L${r1(x1 - k)} ${r1(y1)}`,
    `M${r1(x0 + k)} ${r1(y1)}L${r1(x0)} ${r1(y1)}L${r1(x0)} ${r1(y1 - k)}`,
  ].join("");
}

/** A closed outline through the points, round and back to where it started. */
export function closedThrough(pts: readonly Pt[]): string {
  if (pts.length < 3) return through(pts);
  return through([...pts, pts[0]!, pts[1]!]);
}

/** An arrow's head at the end of a run from `a` to `b`. */
export function arrowHead(a: Pt, b: Pt, size = 9): string {
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  const wing = (s: number) => [b[0] - Math.cos(ang + s) * size, b[1] - Math.sin(ang + s) * size] as const;
  const [l, r] = [wing(0.5), wing(-0.5)];
  return `M${r1(l[0])} ${r1(l[1])}L${r1(b[0])} ${r1(b[1])}L${r1(r[0])} ${r1(r[1])}`;
}

/** A bracket along a run (a height, a gap): the run and a tick across each end. */
export function bracket(a: Pt, b: Pt, tick = 7): string {
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]) + Math.PI / 2;
  const t = (p: Pt) => `M${r1(p[0] - Math.cos(ang) * tick)} ${r1(p[1] - Math.sin(ang) * tick)}L${r1(p[0] + Math.cos(ang) * tick)} ${r1(p[1] + Math.sin(ang) * tick)}`;
  return `M${r1(a[0])} ${r1(a[1])}L${r1(b[0])} ${r1(b[1])}${t(a)}${t(b)}`;
}
