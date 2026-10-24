// Lane B (T22). The creator's style as Shorti read it from their own shorts: openings, shared moves, tempo, length.
import type { CreatorStyle } from "@/lib/creatorStyle";

export function StyleSummary({ style }: { style: CreatorStyle }) {
  if (style.read === 0) {
    return (
      <section className="flex flex-col gap-2 rounded-[var(--radius-card)] border border-line bg-surface p-4">
        <h2 className="text-[15px] font-extrabold">스타일 분석</h2>
        <p className="text-[13px] text-text-dim">
          올린 숏폼 {style.total}개를 Shorti 가 아직 읽지 못했어요. 공개된 틱톡·릴스·쇼츠 링크인지 확인해 주세요. 그동안은
          이번 주 트렌드에서 감각을 배웁니다.
        </p>
      </section>
    );
  }
  return (
    <section className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-[15px] font-extrabold">스타일 분석</h2>
        <span className="font-mono text-[11px] text-text-dim">
          Shorti {style.read}/{style.total}편
          {style.bpm ? ` · ${Math.round(style.bpm)} BPM` : ""}
          {style.lengthSec ? ` · ${style.lengthSec.toFixed(1)}s` : ""}
        </span>
      </div>

      {style.hooks.length ? (
        <div className="flex flex-col gap-1">
          <h3 className="text-[12px] font-semibold text-text-dim">내 오프닝</h3>
          <ul className="flex flex-col gap-1">
            {style.hooks.map((h) => (
              <li key={h} className="text-[13px] leading-snug">· {h}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {style.moves.length ? (
        <div className="flex flex-col gap-1">
          <h3 className="text-[12px] font-semibold text-text-dim">내 포맷의 히트들이 함께 쓰는 move</h3>
          <ul className="flex flex-col gap-2">
            {style.moves.map((m) => (
              <li key={m.cue} className="flex flex-col gap-0.5">
                <span className="text-[13px] font-semibold">
                  {m.cue}
                  {style.read > 1 ? <span className="font-mono text-[11px] text-text-dim"> · 내 숏폼 {m.count}편</span> : null}
                </span>
                <span className="text-[12px] leading-snug text-text-dim">{m.do}</span>
                {m.share ? <span className="text-[11px] text-ghost">{m.share}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {style.makeItYours.length ? (
        <div className="flex flex-col gap-1">
          <h3 className="text-[12px] font-semibold text-text-dim">가상 인물이 내 식대로 바꿀 수 있는 것</h3>
          <div className="flex flex-wrap gap-1.5">
            {style.makeItYours.map((x) => (
              <span key={x} className="rounded-full border border-line px-2 py-0.5 text-[11px] text-text-dim">{x}</span>
            ))}
          </div>
        </div>
      ) : null}

      <p className="text-[11px] text-text-dim">Shorti 가 읽은 내용을 셌을 뿐, 조회수나 성과를 예측하지 않습니다.</p>
    </section>
  );
}
