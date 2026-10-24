// The only place secrets are read. Server-only: importing this from a client component fails the build.
import "server-only";

function optional(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim().length > 0 ? v.trim() : undefined;
}

export const env = {
  anthropicKey: () => optional("ANTHROPIC_API_KEY"),
  // A key not scoped to one workspace must name the workspace on every request (anthropic-workspace-id).
  anthropicWorkspace: () => optional("ANTHROPIC_WORKSPACE_ID"),
  newtypeUrl: () => optional("NEWTYPE_MCP_URL"),
  newtypeToken: () => optional("NEWTYPE_TOKEN"),
  redisUrl: () => optional("UPSTASH_REDIS_REST_URL"),
  redisToken: () => optional("UPSTASH_REDIS_REST_TOKEN"),
  passcode: () => optional("GHOSTREEL_PASSCODE"),
  dailyCap: () => Number(optional("GHOSTREEL_DAILY_CAP") ?? "40"),
  // Where the memory store is kept across restarts (no Redis); "off" keeps it in memory only.
  storeFile: () => optional("GHOSTREEL_STORE_FILE") ?? `${process.cwd()}/.data/store.json`,
};
