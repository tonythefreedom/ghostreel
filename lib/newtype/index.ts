// Lane B (NEWTYPE teammate owns this file). The only place that talks to CineSynth / Nexus.
// Until the live path lands (TASKS T3, T6), it serves the recorded roster and refuses to render.
import "server-only";
import { z } from "zod";
import roster from "@/fixtures/newtype/characters.json";
import { Ghost, type Brief, type RenderJob } from "../types.ts";

const ghosts = z.array(Ghost).parse(roster.characters);

export async function listCharacters(): Promise<Ghost[]> {
  return ghosts; // TODO(B): live list from NEWTYPE, fixture on failure
}

export async function getGhost(id: string): Promise<Ghost | null> {
  return (await listCharacters()).find((g) => g.id === id) ?? null;
}

export async function render(_brief: Brief, _ghost: Ghost): Promise<RenderJob> {
  throw new Error("newtype: render not wired yet (TASKS T6)"); // TODO(B): start a GPU job for an approved brief
}

export async function getJob(_id: string): Promise<RenderJob> {
  throw new Error("newtype: getJob not wired yet (TASKS T6)"); // TODO(B)
}
