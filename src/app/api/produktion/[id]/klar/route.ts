import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// FASE 4 (§6.3): "Klar" er en dato, ikke et flueben - saettes af Builder.
// RUNDE 4 (§G5): proces-rækkefølgen er nu haandhaevet server-side - en
// ordre kan kun markeres Klar naar den reelt er i produktion (KOE eller
// allerede Klar/Installeret giver ingen mening at markere Klar igen).
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(["COORDINATOR", "BUILDER"]);
  if (!auth.ok) return auth.response;
  const existing = await prisma.order.findUnique({ where: { id: params.id }, include: { lead: { include: { measurements: true } } } });
  if (!existing) return NextResponse.json({ error: "Ordre ikke fundet" }, { status: 404 });
  if (existing.stage !== "I_PRODUKTION") {
    return NextResponse.json({ error: "Ordren skal være sendt til produktion, før den kan markeres klar." }, { status: 400 });
  }
  // RUNDE 7 (§4 i procesdokumentet): server-side haandhaevelse af samme
  // regel som UI'en viser - en ordre kan foerst markeres "Klar til
  // installation" naar ALLE dens maalelinjer er markeret Færdig i
  // beregneren. Uden dette ville UI-spaerringen alene ikke vaere nok
  // (samme princip som alle andre roller/felt-tjek i dette projekt).
  const linjer = existing.lead?.measurements || [];
  const ufaerdige = linjer.filter((m: any) => !m.done);
  if (linjer.length > 0 && ufaerdige.length > 0) {
    return NextResponse.json({ error: `${ufaerdige.length} af ${linjer.length} linjer mangler at blive markeret Færdig i beregneren.` }, { status: 400 });
  }
  const order = await prisma.order.update({ where: { id: params.id }, data: { readyAt: new Date() } });
  return NextResponse.json({ order });
}

// RUNDE 4 (§G5): fortrydelse (nulstilling) af en allerede sat "Klar"-dato
// er nu KUN en Koordinator-handling - "det er kun koordinator der kan
// revert status i tilfælde af fejl i indtastninger/registreringer".
// Bygger/Installatør kan fortsat SÆTTE fremad, men ikke fortryde.
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(["COORDINATOR"]);
  if (!auth.ok) return auth.response;
  const order = await prisma.order.update({ where: { id: params.id }, data: { readyAt: null } });
  return NextResponse.json({ order });
}
