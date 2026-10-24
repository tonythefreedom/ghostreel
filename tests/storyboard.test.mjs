import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildStoryboard, framePrompt, KeyframeManifest } from "../lib/storyboard.ts";

const ghost = { id: "yuna", name: "Yuna", characterId: "yuna", voiceId: "v", bio: "", niche: "K-beauty", market: "US", languages: ["en"] };
const brief = {
  id: "b", ghostId: "yuna", sourceVideoId: "v", lang: "en", durationSec: 10, hook: "h", twist: "", intent: "adapt",
  outfit: "a soft pink knit ", scene: "a sunlit bathroom.", caption: "c", hashtags: [], status: "draft", createdAt: "x",
  lines: [{ t: 0, say: "Hi", do: "Waves at camera" }, { t: 4, say: "Look", do: "Holds up the serum." }],
};

test("the committed keyframe manifest parses", () => {
  const raw = JSON.parse(readFileSync(new URL("../public/prerender/keyframes.json", import.meta.url), "utf8"));
  assert.ok(KeyframeManifest.safeParse(raw).success);
});

test("one frame per beat, with an English vertical prompt and no image until one is made", () => {
  const frames = buildStoryboard(brief, ghost, { frames: [] });
  assert.equal(frames.length, 2);
  assert.equal(frames[0].image, null);
  assert.equal(framePrompt(brief, ghost, brief.lines[1]),
    "Holds up the serum. Vertical 9:16 shot of Yuna, a virtual human, wearing a soft pink knit, in a sunlit bathroom.");
});

test("a pre-made keyframe attaches to its ghost and beat only, newest first", () => {
  const manifest = { frames: [
    { ghostId: "yuna", beat: 1, file: "old.png", prompt: "p", source: "s", renderedAt: "2026-10-24T01:00:00Z" },
    { ghostId: "yuna", beat: 1, file: "new.png", prompt: "p", source: "s", renderedAt: "2026-10-24T02:00:00Z" },
    { ghostId: "rina", beat: 0, file: "rina.png", prompt: "p", source: "s", renderedAt: "2026-10-24T02:00:00Z" },
  ] };
  const frames = buildStoryboard(brief, ghost, manifest);
  assert.equal(frames[0].image, null);
  assert.equal(frames[1].image.url, "/prerender/keyframes/new.png");
  assert.equal(frames[1].image.provider, "prerender");
});

test("every scene image carries the AI label", () => {
  const src = readFileSync(new URL("../components/StoryboardFrame.tsx", import.meta.url), "utf8");
  assert.match(src, /<AiLabel \/>/);
  assert.match(readFileSync(new URL("../components/ui/Vellum.tsx", import.meta.url), "utf8"), /AI-generated · Virtual human/);
});
