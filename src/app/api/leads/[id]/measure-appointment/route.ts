import { NextResponse } from "next/server";

// RUNDE 8 ("Calendar (tentative and fixed) can only be created directly
// from calendar, i dont want any ui possiblity to auto-create as it
// confuses"): denne rute oprettede tidligere automatisk en Opmåling-aftale
// fra Lead-siden. Fjernet bevidst - alle kalenderaftaler oprettes nu
// udelukkende fra Kalender-siden (/admin/kalender), som allerede kan
// koble en aftale til et lead via søgefeltet. Filen er bevidst efterladt
// som en inaktiv stub (kan ikke slettes fra outputs-mappen) i stedet for
// at blive fjernet fra git ved hver deploy.
export const dynamic = "force-dynamic";
export async function POST() {
  return NextResponse.json({ error: "Fjernet - book opmålingen fra Kalender-siden i stedet." }, { status: 410 });
}
