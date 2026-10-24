// The only place secrets are read. Server-only: importing this from a client component fails the build.
import "server-only";

function optional(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim().length > 0 ? v.trim() : undefined;
}

export const env = {
  anthropicKey: () => optional("ANTHROPIC_API_KEY"),
  newtypeUrl: () => optional("NEWTYPE_MCP_URL"),
  newtypeToken: () => optional("NEWTYPE_TOKEN"),
  redisUrl: () => optional("UPSTASH_REDIS_REST_URL"),
  redisToken: () => optional("UPSTASH_REDIS_REST_TOKEN"),
  passcode: () => optional("GHOSTREEL_PASSCODE"),
  dailyCap: () => Number(optional("GHOSTREEL_DAILY_CAP") ?? "40"),
};
