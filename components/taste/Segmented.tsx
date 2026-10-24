"use client";
// A few options, one chosen: a radiogroup drawn as one pill track; arrow keys move the choice. Chosen is a white fill,
// never colour alone.
import { useRef, type KeyboardEvent } from "react";

export function Segmented<T extends string>({ label, options, value, onChange }: {
  label: string;
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const key = (e: KeyboardEvent, i: number) => {
    const n = options.length;
    const next = e.key === "ArrowRight" || e.key === "ArrowDown" ? (i + 1) % n : e.key === "ArrowLeft" || e.key === "ArrowUp" ? (i - 1 + n) % n : null;
    const option = next === null ? undefined : options[next];
    if (next === null || !option) return;
    e.preventDefault();
    onChange(option.value);
    refs.current[next]?.focus();
  };
  return (
    <div role="radiogroup" aria-label={label} className="grid auto-cols-fr grid-flow-col gap-1 rounded-full bg-surface-2 p-1">
      {options.map((o, i) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            ref={(el) => { refs.current[i] = el; }}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => key(e, i)}
            className={`h-11 rounded-full text-[13px] transition-[background-color,color] duration-[125ms] active:scale-[.97] ${
              on ? "bg-text font-[720] text-bg" : "font-[560] text-text-dim hover:text-text"
            }`}
            style={{ transitionTimingFunction: "var(--spring-snap)" }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
