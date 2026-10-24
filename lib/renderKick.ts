// Lane B. Wakes the background render driver (lib/newtype/runner.ts) once the server listens, through its own route,
// so live renders in flight before a restart keep moving without a page open. Retries while the server starts.
export function kickRenderDriver(): void {
  const origins = [`http://127.0.0.1:${process.env.PORT ?? "3000"}`, process.env.GHOSTREEL_BASE_URL].filter(Boolean);
  let tries = 0;
  const kick = async () => {
    for (const origin of origins) {
      const ok = await fetch(`${origin}/api/render/kick`, { cache: "no-store" }).then((r) => r.ok, () => false);
      if (ok) return;
    }
    if (++tries < 20) setTimeout(() => void kick(), 3000);
  };
  setTimeout(() => void kick(), 2000);
}
