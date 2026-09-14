import { NextResponse } from "next/server";

// RUNDE 8 (delta §2 - "Slet Order.productionStartedAt... og enhver
// 'Start'-knap i kalender/produktion. Vi gemmer ikke information der ikke
// bruges"): "i gang"-tilstanden er fjernet helt. Filen er bevidst
// efterladt som en inaktiv stub (kan ikke slettes fra outputs-mappen) i
// stedet for at blive fjernet fra git ved hver deploy.
export const dynamic = "force-dynamic";
export async function POST() {
  return NextResponse.json({ error: "Fjernet - 'i gang'-status findes ikke længere." }, { status: 410 });
}
export async function DELETE() {
  return NextResponse.json({ error: "Fjernet - 'i gang'-status findes ikke længere." }, { status: 410 });
}
