// Lane A. Writes the ghost's brief from what the person kept, through Claude with a zod-checked JSON answer.
// The prompt is GhostReel's own and deliberately simple; all short-form knowledge arrives as Shorti readings.
import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { env } from "./env.ts";
import { buildBriefPrompt, Draft, finishBrief, type BriefInput } from "./brief.ts";
import type { Brief } from "./types.ts";

// Haiku 5.5 at medium effort (Ted, 10-24: «haiku 5.5 medium으로»): fast and cheap enough for a brief per pick.
export const BRIEF_MODEL = "claude-haiku-5-5";

let client: Anthropic | null = null;
const anthropic = () => {
  const workspace = env.anthropicWorkspace();
  return (client ??= new Anthropic({
    apiKey: env.anthropicKey(),
    timeout: 45_000,
    maxRetries: 1,
    defaultHeaders: workspace ? { "anthropic-workspace-id": workspace } : undefined,
  }));
};

export class BriefRefused extends Error {}
export const modelReady = () => Boolean(env.anthropicKey());
export class ModelKeyMissing extends Error {}

export async function writeBrief(input: BriefInput): Promise<{ brief: Brief; ms: number; model: string }> {
  if (!env.anthropicKey()) throw new ModelKeyMissing("no Anthropic key in this deploy");
  const { system, user } = buildBriefPrompt(input);
  const started = Date.now();
  const response = await anthropic().beta.messages.parse({
    model: BRIEF_MODEL,
    max_tokens: 16000,
    // Haiku 5.5 has no server-side fallback: a decline comes back as stop_reason "refusal", handled below.
    output_config: { effort: "medium", format: betaZodOutputFormat(Draft) },
    system,
    messages: [{ role: "user", content: user }],
  });
  if (response.stop_reason === "refusal") throw new BriefRefused("brief declined by the model");
  if (!response.parsed_output) throw new Error(`claude: no parsed brief (stop_reason ${response.stop_reason})`);
  return { brief: finishBrief(input, response.parsed_output), ms: Date.now() - started, model: response.model };
}
