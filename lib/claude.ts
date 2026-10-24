// Lane A. Writes the ghost's brief from what the person kept, through Claude with a zod-checked JSON answer.
// The prompt is GhostReel's own and deliberately simple; all short-form knowledge arrives as Shorti readings.
import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { env } from "./env.ts";
import { buildBriefPrompt, Draft, finishBrief, type BriefInput } from "./brief.ts";
import type { Brief } from "./types.ts";

export const BRIEF_MODEL = "claude-opus-5-5";

let client: Anthropic | null = null;
const anthropic = () => (client ??= new Anthropic({ apiKey: env.anthropicKey(), timeout: 45_000, maxRetries: 1 }));

export class BriefRefused extends Error {}
export class ModelKeyMissing extends Error {}

export async function writeBrief(input: BriefInput): Promise<{ brief: Brief; ms: number; model: string }> {
  if (!env.anthropicKey()) throw new ModelKeyMissing("no Anthropic key in this deploy");
  const { system, user } = buildBriefPrompt(input);
  const started = Date.now();
  const response = await anthropic().beta.messages.parse({
    model: BRIEF_MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default", // a policy decline is retried server-side on Anthropic's recommended fallback model
    output_config: { effort: "low", format: betaZodOutputFormat(Draft) },
    system,
    messages: [{ role: "user", content: user }],
  });
  if (response.stop_reason === "refusal") throw new BriefRefused("brief declined by the model");
  if (!response.parsed_output) throw new Error(`claude: no parsed brief (stop_reason ${response.stop_reason})`);
  return { brief: finishBrief(input, response.parsed_output), ms: Date.now() - started, model: response.model };
}
