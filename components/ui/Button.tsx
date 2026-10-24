// Shared. DESIGN.md › Primitives. Primary is the screen's one red verb; secondary a 1 px ring; quiet is words only.
// An `<a>` (next/link) when it has `href`, so a link never sits inside a button.
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export type ButtonKind = "primary" | "secondary" | "quiet";
export type ButtonSize = "xl" | "l" | "m";

const KIND: Record<ButtonKind, string> = {
  primary: "bg-action text-white hover:bg-action-hover disabled:bg-pressed disabled:text-text-3",
  secondary: "bg-bg text-text ring-1 ring-inset ring-line-strong hover:bg-surface disabled:text-text-3 disabled:ring-line",
  quiet: "px-2 text-text-dim hover:text-text disabled:text-text-3",
};
const SIZE: Record<ButtonSize, string> = {
  xl: "h-[52px] px-5 text-[15px] font-[720]",
  l: "h-11 px-4 text-[15px] font-[720]",
  m: "h-9 px-3 text-[13px] font-[560]",
};

export function buttonClass(kind: ButtonKind = "primary", size: ButtonSize = "l", block = false): string {
  return [
    "inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] transition-[background-color,color,box-shadow,transform]",
    "duration-[125ms] ease-[var(--ease-out)] active:scale-[.98] disabled:cursor-not-allowed disabled:active:scale-100",
    KIND[kind],
    kind === "quiet" ? SIZE[size].replace(/px-\d/, "") : SIZE[size],
    block ? "w-full" : "",
  ].join(" ");
}

type Common = { kind?: ButtonKind; size?: ButtonSize; block?: boolean; children: ReactNode; className?: string };

export function Button({ kind, size, block, className = "", ...rest }: Common & Omit<ComponentProps<"button">, "className">) {
  return <button type="button" {...rest} className={`${buttonClass(kind, size, block)} ${className}`} />;
}

export function ButtonLink({ kind, size, block, className = "", ...rest }: Common & Omit<ComponentProps<typeof Link>, "className">) {
  return <Link {...rest} className={`${buttonClass(kind, size, block)} ${className}`} />;
}
