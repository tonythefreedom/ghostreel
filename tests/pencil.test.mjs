// The coaching pencil: what it writes (a hit's cues, a reel's beats), the strokes a hand draws, the language a page
// speaks, and Shorti's cues and clip as GhostReel reads them.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { briefCues, hitCues } from "../lib/cues.ts";
import { ring, seeded, through, underline } from "../components/ui/pencil.ts";
import { seconds, toVideoReading } from "../lib/shorti/read.ts";
import { langFromAccept } from "../lib/words.ts";

test("a hit's cues come in clock order with what to look at; a reel's beats say their line over what they do", () => {
  const cues = hitCues({ cues: [{ t: 5, cue: "Shoot above eye level", do: "Leave room for the numbers.", look: ["Upward gaze"] }, { t: 0, cue: "Float percentages", do: "", look: [] }] });
  assert.deepEqual(cues.map((c) => c.t), [0, 5]);
  assert.equal(cues[0].line, undefined);
  assert.deepEqual(cues[1].tags, ["Upward gaze"]);
  assert.deepEqual(hitCues(null), []);
  const beats = briefCues({ lines: [{ t: 3, say: "Serum on: sixty.", do: "pats serum" }, { t: 0, say: "", do: "bare face, close" }] });
  assert.deepEqual(beats, [{ t: 0, title: "bare face, close", line: undefined }, { t: 3, title: "Serum on: sixty.", line: "pats serum" }]);
});

test("a stroke keeps its shape at every draw and stays near its box", () => {
  assert.equal(underline(120, 10, "Look up"), underline(120, 10, "Look up"));
  assert.notEqual(ring(80, 24, "a"), ring(80, 24, "b"));
  const nums = ring(80, 24, "Under-eye stick").match(/-?\d+(\.\d+)?/g).map(Number);
  assert.ok(nums.every((n) => n > -8 && n < 90), "a ring stays round its words");
  assert.match(through([[0, 0], [10, 5], [20, 0]]), /^M0 0C/);
  assert.equal(through([[0, 0]]), "");
  const r = seeded("x");
  assert.ok(Array.from({ length: 50 }, r).every((v) => v >= 0 && v < 1));
});

test("a page speaks Korean only when the browser's first language is Korean", () => {
  assert.equal(langFromAccept("ko-KR,ko;q=0.9,en-US;q=0.8"), "ko");
  assert.equal(langFromAccept("en-US,en;q=0.9,ko;q=0.8"), "en");
  assert.equal(langFromAccept(null), "en");
});

test("Shorti's cue times read as seconds; a video read carries its clip, cues and measured cuts", () => {
  assert.equal(seconds("0:03"), 3);
  assert.equal(seconds("1:02.5"), 62.5);
  assert.equal(seconds("0:01–0:03"), 1);
  assert.equal(seconds("soon"), undefined);
  const { reading, card } = toVideoReading({
    video: { video_id: "v1", hook: "h", cues: [{ at: "0:02", cue: "Look up", do: "d", look_at: ["Stick", "Mirror", "Hand", "Fourth"] }, { at: "x", cue: "no time" }] },
    context: { hit: { clip: "https://shorti.ai/public/media?video=v1&r=h264_720.mp4", clock: { cuts_s: [0.4, 0.8, "x"] } } },
  });
  assert.deepEqual(reading.cues, [{ t: 2, cue: "Look up", do: "d", look: ["Stick", "Mirror", "Hand"] }]);
  assert.deepEqual(reading.cuts, [0.4, 0.8]);
  assert.equal(card.clipUrl, "https://shorti.ai/public/media?video=v1&r=h264_720.mp4");
});

test("every video wears the same keys in the same place, and the pencil is drawn in its own ink", () => {
  const player = readFileSync(new URL("../components/ui/Player.tsx", import.meta.url), "utf8");
  for (const key of ['t("play")', 't("pause")', 't("soundOn")', 't("soundOff")', 't("coachOn")', 't("coachOff")', 't("nextCue")']) assert.ok(player.includes(key), key);
  assert.match(player, /var\(--pencil\)/);
  assert.match(player, /const \[muted, setMuted\] = useState\(true\)/, "sound starts off");
});
