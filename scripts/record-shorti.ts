// Records Shorti's public MCP answers, already reduced to GhostReel types, into fixtures/shorti/.
// Fixtures are the offline fallback and test input. Only reduced fields are kept: nothing internal is stored.
// Run: node scripts/record-shorti.ts   (Node 24 strips types natively)
import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { enrich, readFormatPlan, readRecipeEdit, readTrending } from "../lib/shorti/read.ts";

const OUT = new URL("../fixtures/shorti/", import.meta.url);
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const write = (name: string, data: unknown) =>
  writeFileSync(new URL(`${name}.json`, OUT), JSON.stringify(data, null, 2) + "\n");

const formats: Record<string, unknown> = {};
// A deck round is eight cards; ten keeps a spare or two and each file under the fixture size limit.
const DECK = 10;
const recipes: Record<string, unknown> = {};
for (const field of ["beauty", "fashion"]) {
  // Korean first-class: the same deck in Shorti's own Korean, for pages shown in Korean.
  {
    const { cards, asOf } = await readTrending(field, "ko");
    const { cards: rich, readings } = await enrich(cards.slice(0, DECK), "ko");
    write(`trending-${field}.ko`, { field, asOf, recordedAt: new Date().toISOString(), cards: rich, readings: Object.fromEntries(readings) });
    console.log(`trending-${field}.ko: ${rich.length} cards, ${readings.size} readings`);
  }
  const { cards, asOf } = await readTrending(field);
  const { cards: rich, readings } = await enrich(cards.slice(0, DECK));
  write(`trending-${field}`, { field, asOf, recordedAt: new Date().toISOString(), cards: rich, readings: Object.fromEntries(readings) });
  console.log(`trending-${field}: ${rich.length} cards, ${readings.size} readings`);
  for (const c of rich.filter((c) => c.formatKind === "format" && c.formatId).slice(0, 3)) {
    if (!recipes[c.url]) {
      try {
        recipes[c.url] = await readRecipeEdit(c.url);
      } catch (e) {
        console.log(`recipe ${c.url}: ${(e as Error).message}`);
      }
    }
    if (formats[c.formatId!]) continue;
    try {
      formats[c.formatId!] = await readFormatPlan(c.formatId!);
    } catch (e) {
      console.log(`format ${c.formatId}: ${(e as Error).message}`);
    }
  }
}
write("formats", { recordedAt: new Date().toISOString(), formats });
write("recipes", { recordedAt: new Date().toISOString(), recipes });
console.log(`formats: ${Object.keys(formats).length}, recipes: ${Object.keys(recipes).length}`);
console.log(readdirSync(OUT).join(", "));
