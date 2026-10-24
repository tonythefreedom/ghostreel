"use client";
// Lane B (T8). The creator registers their own background and past work, and picks the virtual human who performs,
// one screen per step.
// Copy stays here until lib/words.ts (Lane A) takes it.
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GhostCard } from "@/components/GhostCard";
import { GoogleSignIn } from "@/components/GoogleSignIn";
import { FunnelProgress } from "@/components/kit";
import { Button, Chip, ChipRow, Verb, VerbSpacer } from "@/components/ui";
import type { CinesynthAccount, Ghost, Lang } from "@/lib/types";

const STEPS = 4; // account · about me · what I made · who performs: one question per screen (kit FunnelProgress)
const MARKETS = ["US", "KR", "JP", "Global"] as const;
const LANGS: Array<[Lang, string]> = [["en", "English"], ["ko", "Korean"], ["ja", "Japanese"], ["es", "Spanish"]];
const field = "w-full rounded-[var(--radius-control)] bg-surface-2 px-3 text-[15px] text-text placeholder:text-text-3 ring-1 ring-inset ring-line focus:ring-line-strong";
const label = "text-[13px] font-[560] text-text-dim";
const title = "text-[22px] font-[720] tracking-[-0.01em]";

const urls = (text: string) =>
  text.split(/\s+/).map((s) => s.trim()).filter((s) => /^https?:\/\/\S+$/.test(s));

export function OnboardForm({ ghosts, initialAccount }: { ghosts: Ghost[]; initialAccount: CinesynthAccount | null }) {
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
  const [step, setStep] = useState(initialAccount?.status === "approved" ? 2 : 1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const links = urls(works);
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
        <h2 className={title}>Sign in</h2>
        <p className="text-[13px] text-text-dim">
          Use the Google account you use for CineSynth. GhostReel renders and downloads as that account; no new password.
        </p>
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
          <GoogleSignIn onSignedIn={setAccount} />
        )}
        {account && account.status !== "approved" ? (
          <p className="text-[13px] text-warn">
            CineSynth hasn&apos;t approved this account yet ({account.status}). Ask the team to approve it, then sign in again.
          </p>
        ) : null}
      </section>
      <section hidden={step !== 2} className="flex flex-col gap-3">
        <h2 className={title}>About you</h2>
        <label className="flex flex-col gap-1">
          <span className={label}>Name or channel name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} className={`${field} h-11`} />
        </label>
        <label className="flex flex-col gap-1">
          <span className={label}>Niche</span>
          <input value={niche} onChange={(e) => setNiche(e.target.value)} maxLength={80} placeholder="e.g. K-beauty routines, home café, fashion hauls" className={`${field} h-11`} />
        </label>
        <label className="flex flex-col gap-1">
          <span className={label}>Bio and background</span>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={600} rows={3} placeholder="What you've been making, and what you're good at" className={`${field} py-2`} />
        </label>
        <div className="flex flex-col gap-1">
          <span className={label}>Market</span>
          <ChipRow label="Market">
            {MARKETS.map((m) => (
              <Chip key={m} on={market === m} onClick={() => setMarket(m)}>{m}</Chip>
            ))}
          </ChipRow>
        </div>
        <div className="flex flex-col gap-1">
          <span className={label}>Video languages</span>
          <ChipRow label="Video languages">
            {LANGS.map(([l, name]) => (
              <Chip key={l} on={languages.includes(l)} onClick={() => toggleLang(l)}>{name}</Chip>
            ))}
          </ChipRow>
        </div>
      </section>

      <section hidden={step !== 3} className="flex flex-col gap-3">
        <h2 className={title}>What you've made</h2>
        <label className="flex flex-col gap-1">
          <span className={label}>Links to your shorts (optional, one per line, up to 10)</span>
          <textarea value={works} onChange={(e) => setWorks(e.target.value)} rows={4} placeholder="Paste your TikTok, Reels or Shorts links" className={`${field} py-2 font-mono text-[13px]`} />
          <span className={`font-mono text-[12px] ${links.length > 10 ? "text-danger" : "text-text-3"}`}>
            {links.length} / 10{links.length === 0 ? " · none: your ghost learns from this week's trends" : ""}
          </span>
        </label>
        <label className="flex flex-col gap-1">
          <span className={label}>A past plan (optional)</span>
          <textarea value={plan} onChange={(e) => setPlan(e.target.value)} maxLength={4000} rows={4} placeholder="Paste a plan or pitch you wrote" className={`${field} py-2`} />
        </label>
        <label className="flex flex-col gap-1">
          <span className={label}>A past script (optional)</span>
          <textarea value={script} onChange={(e) => setScript(e.target.value)} maxLength={4000} rows={4} placeholder="Paste a script you wrote" className={`${field} py-2`} />
        </label>
        <p className="text-[13px] text-text-3">Share only videos and writing you own. We use them to learn your style and never copy them.</p>
      </section>

      <section hidden={step !== 4} className="flex flex-col gap-3">
        <h2 className={title}>Who performs for you</h2>
        <div role="radiogroup" className="grid grid-cols-2 gap-3">
          {ghosts.map((g) => (
            <GhostCard key={g.id} ghost={g} selected={ghostId === g.id} onSelect={() => setGhostId(g.id)} />
          ))}
        </div>
        <p className="text-[13px] text-text-3">
          A virtual human appears instead of you, and every video carries the <span className="font-[560] text-text">AI-generated · Virtual human</span> label.
        </p>
      </section>

      {error ? <p role="alert" className="text-[13px] text-danger">✕ Couldn&apos;t save ({error}). Check your answers.</p> : null}
      <VerbSpacer />
      <Verb note={step === STEPS ? "Your face never appears. The ghost performs." : undefined}>
        {step < STEPS ? (
          <Button key="next" size="xl" block disabled={!stepOk[step - 1]} onClick={() => setStep(step + 1)}>Next</Button>
        ) : (
          <Button key="submit" type="submit" size="xl" block disabled={!ready || busy}>
            {busy ? "Saving…" : "Sign up and read my style"}
          </Button>
        )}
      </Verb>
    </form>
  );
}
