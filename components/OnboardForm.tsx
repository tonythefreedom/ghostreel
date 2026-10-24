"use client";
// Lane B (T8). The creator registers their own background and past work, and picks the virtual human who performs,
// one screen per step.
// Copy stays here until lib/words.ts (Lane A) takes it.
import { useRouter } from "next/navigation";
import { useState } from "react";
import { GhostCard } from "@/components/GhostCard";
import { FunnelProgress } from "@/components/kit";
import { UnlockForm } from "@/components/UnlockForm";
import type { Ghost, Lang } from "@/lib/types";

const STEPS = 3; // about me · what I made · who performs: one question per screen (kit FunnelProgress)
const MARKETS = ["US", "KR", "JP", "Global"] as const;
const LANGS: Array<[Lang, string]> = [["en", "English"], ["ko", "한국어"], ["ja", "日本語"], ["es", "Español"]];
const field = "w-full rounded-[var(--radius-card)] border border-line bg-bg px-3 text-[15px]";
const label = "text-[13px] font-semibold text-text-dim";

const urls = (text: string) =>
  text.split(/\s+/).map((s) => s.trim()).filter((s) => /^https?:\/\/\S+$/.test(s));

export function OnboardForm({ ghosts }: { ghosts: Ghost[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [niche, setNiche] = useState("");
  const [market, setMarket] = useState<(typeof MARKETS)[number]>("US");
  const [languages, setLanguages] = useState<Lang[]>(["en"]);
  const [works, setWorks] = useState("");
  const [plan, setPlan] = useState("");
  const [script, setScript] = useState("");
  const [ghostId, setGhostId] = useState(ghosts[0]?.id ?? "");
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const links = urls(works);
  const stepOk = [Boolean(name.trim() && niche.trim() && languages.length > 0), links.length <= 10, Boolean(ghostId)];
  const ready = stepOk.every(Boolean);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/creator", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, bio, niche, market, languages, ghostId, works: links, plan, script }),
      });
      if (res.status === 401) return setLocked(true);
      const body = (await res.json()) as { creator?: { id: string }; error?: string };
      if (!res.ok || !body.creator) throw new Error(body.error ?? String(res.status));
      router.push(`/profile/${body.creator.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const toggleLang = (l: Lang) =>
    setLanguages((cur) => (cur.includes(l) ? cur.filter((x) => x !== l) : [...cur, l]));

  return (
    <form
      className="flex flex-col gap-6 pb-28"
      onSubmit={(e) => {
        e.preventDefault();
        if (step < STEPS) {
          if (stepOk[step - 1]) setStep(step + 1);
        } else if (ready) void submit();
      }}
    >
      <FunnelProgress step={step} total={STEPS} onBack={() => setStep(Math.max(1, step - 1))} />
      <section hidden={step !== 1} className="flex flex-col gap-3">
        <h2 className="text-[18px] font-extrabold">나에 대해</h2>
        <label className="flex flex-col gap-1">
          <span className={label}>이름 또는 채널명</span>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} className={`${field} h-11`} />
        </label>
        <label className="flex flex-col gap-1">
          <span className={label}>분야</span>
          <input value={niche} onChange={(e) => setNiche(e.target.value)} maxLength={80} placeholder="예: K-뷰티 루틴, 홈카페, 패션 하울" className={`${field} h-11`} />
        </label>
        <label className="flex flex-col gap-1">
          <span className={label}>소개와 배경</span>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={600} rows={3} placeholder="어떤 영상을 만들어 왔는지, 무엇을 잘하는지" className={`${field} py-2`} />
        </label>
        <div className="flex flex-col gap-1">
          <span className={label}>올릴 시장</span>
          <div role="radiogroup" className="grid grid-cols-4 gap-1 rounded-full bg-surface p-1">
            {MARKETS.map((m) => (
              <button key={m} type="button" role="radio" aria-checked={market === m} onClick={() => setMarket(m)}
                className={`h-9 rounded-full text-[13px] font-semibold ${market === m ? "bg-surface-2 text-text" : "text-text-dim"}`}>
                {m}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className={label}>영상 언어</span>
          <div className="flex flex-wrap gap-2">
            {LANGS.map(([l, name]) => (
              <button key={l} type="button" aria-pressed={languages.includes(l)} onClick={() => toggleLang(l)}
                className={`h-9 rounded-full border px-3 text-[13px] font-semibold ${languages.includes(l) ? "border-ghost text-ghost" : "border-line text-text-dim"}`}>
                {name}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section hidden={step !== 2} className="flex flex-col gap-3">
        <h2 className="text-[18px] font-extrabold">내가 만든 것</h2>
        <label className="flex flex-col gap-1">
          <span className={label}>내가 올린 숏폼 링크 (선택, 한 줄에 하나, 최대 10개)</span>
          <textarea value={works} onChange={(e) => setWorks(e.target.value)} rows={4} placeholder="내 틱톡·릴스·쇼츠 링크를 붙여 넣으세요" className={`${field} py-2 font-mono text-[13px]`} />
          <span className={`font-mono text-[11px] ${links.length > 10 ? "text-danger" : "text-text-dim"}`}>
            {links.length} / 10{links.length === 0 ? " · 없으면 이번 주 트렌드에서 감각을 배웁니다" : ""}
          </span>
        </label>
        <label className="flex flex-col gap-1">
          <span className={label}>기획안 (선택)</span>
          <textarea value={plan} onChange={(e) => setPlan(e.target.value)} maxLength={4000} rows={4} placeholder="예전에 쓴 기획안을 붙여 넣으세요" className={`${field} py-2`} />
        </label>
        <label className="flex flex-col gap-1">
          <span className={label}>시나리오 (선택)</span>
          <textarea value={script} onChange={(e) => setScript(e.target.value)} maxLength={4000} rows={4} placeholder="예전에 쓴 대본이나 시나리오를 붙여 넣으세요" className={`${field} py-2`} />
        </label>
        <p className="text-[12px] text-text-dim">내가 권리를 가진 영상과 글만 올려 주세요. 분석에만 쓰고, 그대로 베끼지 않습니다.</p>
      </section>

      <section hidden={step !== 3} className="flex flex-col gap-3">
        <h2 className="text-[18px] font-extrabold">대신 출연할 가상 인물</h2>
        <div role="radiogroup" className="grid grid-cols-2 gap-3">
          {ghosts.map((g) => (
            <GhostCard key={g.id} ghost={g} selected={ghostId === g.id} onSelect={() => setGhostId(g.id)} />
          ))}
        </div>
        <p className="text-[12px] text-text-dim">
          영상에는 내 얼굴이 아니라 가상 인물이 나오고, <span className="font-semibold text-text">AI-generated · Virtual human</span> 라벨이 항상 붙습니다.
        </p>
      </section>

      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-bg/95 py-3 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[430px] flex-col gap-2 px-4">
          {locked ? <UnlockForm onUnlocked={() => { setLocked(false); void submit(); }} /> : null}
          {error ? <p className="text-[13px] text-danger">저장하지 못했어요 ({error}). 입력을 확인해 주세요.</p> : null}
          {step < STEPS ? (
            <button key="next" type="button" disabled={!stepOk[step - 1]} onClick={() => setStep(step + 1)}
              className="h-14 w-full rounded-[var(--radius-card)] bg-ghost text-[15px] font-extrabold text-bg disabled:opacity-40">
              다음
            </button>
          ) : (
            <button key="submit" type="submit" disabled={!ready || busy}
              className="h-14 w-full rounded-[var(--radius-card)] bg-ghost text-[15px] font-extrabold text-bg disabled:opacity-40">
              {busy ? "저장하는 중…" : "등록하고 내 스타일 분석하기"}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
