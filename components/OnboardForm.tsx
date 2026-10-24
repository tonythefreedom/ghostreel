"use client";
// Lane B (T8). The creator registers their own background and past work, and picks the virtual human who performs,
// one screen per step.
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { GhostCard, type CastState } from "@/components/GhostCard";
import { GoogleSignIn } from "@/components/GoogleSignIn";
import { useT } from "@/components/Lang";
import { FunnelProgress } from "@/components/kit";
import { NEW_CHARACTER_URL } from "@/lib/newtype/links";
import { Button, Chip, ChipRow, Verb, VerbSpacer } from "@/components/ui";
import type { CinesynthAccount, Ghost, Lang } from "@/lib/types";

const STEPS = 4; // account · about me · what I made · who performs: one question per screen (kit FunnelProgress)
const MARKETS = ["US", "KR", "JP", "Global"] as const;
const LANGS: Array<[Lang, "langEn" | "langKo" | "langJa" | "langEs"]> = [["en", "langEn"], ["ko", "langKo"], ["ja", "langJa"], ["es", "langEs"]];
const field = "w-full rounded-[var(--radius-control)] bg-surface-2 px-3 text-[15px] text-text placeholder:text-text-3 ring-1 ring-inset ring-line focus:ring-line-strong";
const label = "text-[13px] font-[560] text-text-dim";
const title = "text-[22px] font-[720] tracking-[-0.01em]";

const urls = (text: string) =>
  text.split(/\s+/).map((s) => s.trim()).filter((s) => /^https?:\/\/\S+$/.test(s));

export function OnboardForm({ ghosts, initialAccount, notice }: { ghosts: Ghost[]; initialAccount: CinesynthAccount | null; notice?: ReactNode }) {
  const t = useT();
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
  const [account, setAccount] = useState<CinesynthAccount | null>(initialAccount);
  const signedIn = useCallback((a: CinesynthAccount) => setAccount(a), []);
  const [step, setStep] = useState(initialAccount?.status === "approved" ? 2 : 1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const links = urls(works);
  // The account's CineSynth characters, once it is approved: each ghost's picture and whether it can perform.
  const [cast, setCast] = useState<Array<{ name: string; complete: boolean; thumb: string | null }> | null>(null);
  useEffect(() => {
    if (account?.status !== "approved" || cast) return;
    fetch("/api/newtype/characters")
      .then((r) => (r.ok ? r.json() : { characters: [] }))
      .then((b: { characters?: Array<{ name: string; complete: boolean; thumb: string | null }> }) => setCast(b.characters ?? []))
      .catch(() => setCast([]));
  }, [account, cast]);
  // Back from making a character in CineSynth (another tab): read the list again.
  useEffect(() => {
    if (account?.status !== "approved") return;
    const again = () => setCast(null);
    window.addEventListener("focus", again);
    return () => window.removeEventListener("focus", again);
  }, [account]);
  const castOf = (g: Ghost): { picture: string | null; state: CastState } => {
    if (!cast) return { picture: null, state: "unknown" };
    const c = cast.find((x) => x.name === g.characterId);
    return { picture: c?.thumb ?? null, state: !c ? "missing" : c.complete ? "ready" : "incomplete" };
  };
  // Signing in on the first screen moves straight on once CineSynth has approved the account.
  useEffect(() => {
    if (account?.status === "approved" && step === 1) setStep(2);
  }, [account, step]);

  const stepOk = [account?.status === "approved", Boolean(name.trim() && niche.trim() && languages.length > 0), links.length <= 10, Boolean(ghostId)];
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
      if (res.status === 401) {
        setAccount(null);
        return setStep(1); // the CineSynth session ran out: sign in again
      }
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
      className="flex flex-col gap-8 pt-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (step < STEPS) {
          if (stepOk[step - 1]) setStep(step + 1);
        } else if (ready) void submit();
      }}
    >
      <FunnelProgress step={step} total={STEPS} onBack={() => setStep(Math.max(1, step - 1))} />
      <section hidden={step !== 1} className="flex flex-col gap-3">
        <h2 className={title}>{t("obSignIn")}</h2>
        <p className="text-[13px] leading-snug text-text-dim">{t("obSignInLine")}</p>
        {account ? (
          <div className="flex items-center gap-3 rounded-[var(--radius-card)] bg-surface-2 p-3 ring-1 ring-inset ring-line">
            {account.picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={account.picture} alt="" className="size-10 rounded-full" referrerPolicy="no-referrer" />
            ) : null}
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-[15px] font-[560]">{account.name || account.email}</span>
              <span className="truncate text-[12px] text-text-dim">{account.email}</span>
            </div>
          </div>
        ) : (
          <GoogleSignIn onSignedIn={signedIn} />
        )}
        {account && account.status !== "approved" ? (
          <p className="text-[13px] leading-snug text-warn">{t("obPending")}</p>
        ) : null}
        {notice}
      </section>
      <section hidden={step !== 2} className="flex flex-col gap-3">
        <h2 className={title}>{t("obAbout")}</h2>
        <label className="flex flex-col gap-1">
          <span className={label}>{t("obName")}</span>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} className={`${field} h-11`} />
        </label>
        <label className="flex flex-col gap-1">
          <span className={label}>{t("obNiche")}</span>
          <input value={niche} onChange={(e) => setNiche(e.target.value)} maxLength={80} placeholder={t("obNichePh")} className={`${field} h-11`} />
        </label>
        <label className="flex flex-col gap-1">
          <span className={label}>{t("obBio")}</span>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={600} rows={3} placeholder={t("obBioPh")} className={`${field} py-2`} />
        </label>
        <div className="flex flex-col gap-1">
          <span className={label}>{t("obMarket")}</span>
          <ChipRow label={t("obMarket")}>
            {MARKETS.map((m) => (
              <Chip key={m} on={market === m} onClick={() => setMarket(m)}>{m}</Chip>
            ))}
          </ChipRow>
        </div>
        <div className="flex flex-col gap-1">
          <span className={label}>{t("obLangs")}</span>
          <ChipRow label={t("obLangs")}>
            {LANGS.map(([l, name]) => (
              <Chip key={l} on={languages.includes(l)} onClick={() => toggleLang(l)}>{t(name)}</Chip>
            ))}
          </ChipRow>
        </div>
      </section>

      <section hidden={step !== 3} className="flex flex-col gap-3">
        <h2 className={title}>{t("obMade")}</h2>
        <label className="flex flex-col gap-1">
          <span className={label}>{t("obLinks")}</span>
          <textarea value={works} onChange={(e) => setWorks(e.target.value)} rows={4} placeholder={t("obLinksPh")} className={`${field} py-2 font-mono text-[13px]`} />
          <span className={`font-mono text-[12px] ${links.length > 10 ? "text-danger" : "text-text-3"}`}>
            {links.length} / 10{links.length === 0 ? ` · ${t("obLinksNone")}` : ""}
          </span>
        </label>
        <label className="flex flex-col gap-1">
          <span className={label}>{t("obPlan")}</span>
          <textarea value={plan} onChange={(e) => setPlan(e.target.value)} maxLength={4000} rows={4} placeholder={t("obPlanPh")} className={`${field} py-2`} />
        </label>
        <label className="flex flex-col gap-1">
          <span className={label}>{t("obScript")}</span>
          <textarea value={script} onChange={(e) => setScript(e.target.value)} maxLength={4000} rows={4} placeholder={t("obScriptPh")} className={`${field} py-2`} />
        </label>
        <p className="text-[13px] leading-snug text-text-3">{t("obOwn")}</p>
      </section>

      <section hidden={step !== 4} className="flex flex-col gap-3">
        <h2 className={title}>{t("obWho")}</h2>
        <div role="radiogroup" aria-label={t("obWho")} className="grid grid-cols-2 gap-3">
          {ghosts.map((g) => (
            <GhostCard key={g.id} ghost={g} selected={ghostId === g.id} onSelect={() => setGhostId(g.id)}
              picture={castOf(g).picture} cast={castOf(g).state}
              castWord={cast ? t(castOf(g).state === "ready" ? "castReady" : castOf(g).state === "incomplete" ? "castIncomplete" : "castMissing") : undefined} />
          ))}
        </div>
        {account?.status === "approved" ? (
          <a href={NEW_CHARACTER_URL} target="_blank" rel="noopener noreferrer"
            className={`flex flex-col gap-1 rounded-[var(--radius-card)] p-3 ring-inset ${
              cast && cast.length === 0 ? "bg-accent-soft ring-2 ring-accent" : "ring-1 ring-line hover:bg-surface"
            }`}>
            {cast && cast.length === 0 ? <span className="text-[13px] font-[560] text-text">{t("newCharacterFirst")}</span> : null}
            <span className="text-[15px] font-[720] text-accent">+ {t("newCharacter")} ↗</span>
            <span className="text-[12px] leading-snug text-text-dim">{t("newCharacterLine")}</span>
          </a>
        ) : null}
        <p className="text-[13px] leading-snug text-text-3">
          {t("obWhoLine")} <span className="font-[560] text-text">AI-generated · Virtual human</span>
        </p>
      </section>

      {error ? <p role="alert" className="text-[13px] text-danger">✕ {t("obSaveFailed")} ({error})</p> : null}
      <VerbSpacer />
      <Verb note={step === STEPS ? t("obFaceNever") : !stepOk[step - 1] ? t(step === 1 ? "obNeedSignIn" : step === 2 ? "obNeedAbout" : "obNeedLinks") : undefined}>
        {step < STEPS ? (
          <Button key="next" size="xl" block disabled={!stepOk[step - 1]} onClick={() => setStep(step + 1)}>{t("next")}</Button>
        ) : (
          <Button key="submit" type="submit" size="xl" block disabled={!ready || busy}>
            {busy ? t("obSaving") : t("obSubmit")}
          </Button>
        )}
      </Verb>
    </form>
  );
}
