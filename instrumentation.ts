// Lane B. Once the server is up, start the background render driver so live renders survive a restart.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { kickRenderDriver } = await import("./lib/renderKick.ts");
  kickRenderDriver();
}
