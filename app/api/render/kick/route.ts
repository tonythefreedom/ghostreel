// Lane B. Starts the background render driver in this process (instrumentation.ts calls it once the server is up, so
// renders in flight before a restart carry on without anyone opening a page). Harmless to call again.
import { NextResponse } from "next/server";
import { startDriver } from "@/lib/newtype/runner";

export const dynamic = "force-dynamic";

export async function GET() {
  startDriver();
  return NextResponse.json({ ok: true });
}
