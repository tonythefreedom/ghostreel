// Lane A. The 4D camera preset: where the phone stood in the hit, setup by setup over its clock (Shorti's scene read,
// estimated), drawn from the side to scale: the floor, the person, the phone at its height and distance, its tilt and
// its field of view as a cone. The ghost's shot takes the same place. Numbers in mono; nothing drawn that was not read.
import { clock } from "@/components/kit/logic";
import type { CameraSetup } from "@/lib/types";
import { t, type UiLang } from "@/lib/words";

const W = 320;
const H = 168;
const FLOOR = 150;
const PX_M = 62; // px per metre, the same both ways
const PERSON_X = 252;
const PERSON_M = 1.62;

const KO: Record<string, string> = {
  tripod: "삼각대", handheld: "손으로", selfie: "셀카", gimbal: "짐벌", static: "고정", pan: "패닝", tilt: "틸트",
  push: "다가가기", pull: "물러나기", follow: "따라가기", high: "높게", eye: "눈높이", low: "낮게", overhead: "위에서", ground: "바닥",
};
const word = (v: string, lang: UiLang) => (lang === "ko" ? KO[v] ?? v : v);

export function CameraPreset({ setups, lang }: { setups: CameraSetup[]; lang: UiLang }) {
  const read = setups.filter((s) => s.heightM !== undefined && s.distM !== undefined).slice(0, 3);
  if (!read.length) return null;
  return (
    <section aria-labelledby="preset" className="flex flex-col gap-3">
      <h2 id="preset" className="text-[18px] font-[720] tracking-[-0.01em]">{t("presetTitle", lang)}</h2>
      <p className="text-[13px] leading-snug text-text-3">{t("presetLine", lang)}</p>
      <ol className="flex flex-col gap-2">
        {read.map((s, i) => (
          <li key={`${s.tMs}-${i}`} className="flex flex-col gap-2 rounded-[var(--radius-card)] bg-surface p-3 ring-1 ring-inset ring-line">
            <div className="flex items-center justify-between gap-2 text-[13px]">
              <span className="flex items-center gap-2">
                <span className="font-mono font-[640] text-pencil">{clock(s.tMs / 1000)}</span>
                <span className="text-text-dim">{[s.mount, s.move, s.height].filter(Boolean).map((v) => word(v, lang)).join(" · ")}</span>
              </span>
              <span className="text-[12px] text-text-3">{t("presetEstimate", lang)}</span>
            </div>
            <Side setup={s} lang={lang} />
            <dl className="grid grid-cols-4 gap-1 text-center">
              {([
                ["presetHeight", s.heightM, "m"],
                ["presetDist", s.distM, "m"],
                ["presetTilt", s.tiltDeg, "°"],
                ["presetFov", s.vfovDeg, "°"],
              ] as const).map(([k, v, unit]) => (
                <div key={k} className="flex flex-col gap-0.5 rounded-[var(--radius-control)] bg-bg py-2">
                  <dt className="text-[11px] text-text-3">{t(k, lang)}</dt>
                  <dd className="font-mono text-[13px] font-[640] text-text">{v === undefined ? "—" : `${round(v)}${unit}`}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ol>
    </section>
  );
}

const round = (v: number) => (Math.abs(v) >= 10 ? Math.round(v) : Math.round(v * 100) / 100).toString().replace("-", "−");

function Side({ setup, lang }: { setup: CameraSetup; lang: UiLang }) {
  const h = setup.heightM ?? 1.5;
  const d = Math.min(3.2, setup.distM ?? 1);
  const px = Math.max(26, PERSON_X - d * PX_M);
  const py = FLOOR - h * PX_M;
  const tilt = setup.tiltDeg ?? 0; // negative: pointing down
  const half = (setup.vfovDeg ?? 60) / 2;
  const reach = Math.max(90, d * PX_M + 40);
  const ray = (deg: number) => {
    const a = (-deg * Math.PI) / 180; // screen y grows downward
    return [px + Math.cos(a) * reach, py + Math.sin(a) * reach] as const;
  };
  const [ux, uy] = ray(tilt + half);
  const [lx, ly] = ray(tilt - half);
  const [cx, cy] = ray(tilt);
  const head = FLOOR - PERSON_M * PX_M;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${t("presetHeight", lang)} ${round(h)}m, ${t("presetDist", lang)} ${round(d)}m, ${t("presetTilt", lang)} ${round(tilt)}°`}>
      <defs>
        <clipPath id={`room-${setup.tMs}`}><rect x="0" y="0" width={W} height={FLOOR} /></clipPath>
      </defs>
      {/* the floor and a metre scale */}
      <line x1="8" y1={FLOOR} x2={W - 8} y2={FLOOR} stroke="var(--line-strong)" strokeWidth="1" />
      {[0, 1, 2].map((m) => (
        <g key={m}>
          <line x1="12" y1={FLOOR - m * PX_M} x2="18" y2={FLOOR - m * PX_M} stroke="var(--text-3)" strokeWidth="1" />
          <text x="22" y={FLOOR - m * PX_M + 4} fontSize="9" fill="var(--text-3)" fontFamily="var(--font-geist)">{m}m</text>
        </g>
      ))}
      {/* the field of view */}
      <path d={`M${px} ${py}L${ux} ${uy}L${lx} ${ly}Z`} fill="var(--pencil)" fillOpacity="0.1" clipPath={`url(#room-${setup.tMs})`} />
      <line x1={px} y1={py} x2={ux} y2={uy} stroke="var(--pencil)" strokeOpacity="0.55" strokeWidth="1" strokeDasharray="3 3" clipPath={`url(#room-${setup.tMs})`} />
      <line x1={px} y1={py} x2={lx} y2={ly} stroke="var(--pencil)" strokeOpacity="0.55" strokeWidth="1" strokeDasharray="3 3" clipPath={`url(#room-${setup.tMs})`} />
      <line x1={px} y1={py} x2={cx} y2={cy} stroke="var(--pencil)" strokeWidth="1.5" clipPath={`url(#room-${setup.tMs})`} />
      {/* the person, as a standing silhouette */}
      <circle cx={PERSON_X} cy={head + 10} r="10" fill="var(--surface-2)" stroke="var(--text-dim)" strokeWidth="1.5" />
      <path d={`M${PERSON_X - 15} ${FLOOR}L${PERSON_X - 12} ${head + 26}Q${PERSON_X} ${head + 20} ${PERSON_X + 12} ${head + 26}L${PERSON_X + 15} ${FLOOR}Z`} fill="var(--surface-2)" stroke="var(--text-dim)" strokeWidth="1.5" />
      {/* the phone, its height dropped to the floor */}
      <line x1={px} y1={py} x2={px} y2={FLOOR} stroke="var(--text-3)" strokeWidth="1" strokeDasharray="2 3" />
      <line x1={px} y1={FLOOR + 8} x2={PERSON_X} y2={FLOOR + 8} stroke="var(--text-3)" strokeWidth="1" />
      <text x={(px + PERSON_X) / 2} y={FLOOR + 17} fontSize="9" fill="var(--text-3)" textAnchor="middle" fontFamily="var(--font-geist)">{round(d)}m</text>
      <rect x={px - 4} y={py - 8} width="8" height="16" rx="2" fill="var(--text)" transform={`rotate(${-tilt} ${px} ${py})`} />
      <text x={px} y={py - 14} fontSize="10" fill="var(--text)" textAnchor="middle" fontFamily="var(--font-geist)" fontWeight="600">{round(h)}m</text>
    </svg>
  );
}
