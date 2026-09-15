import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// RUNDE 4 (§G5): "installeret" kan foerst saettes NAAR ordren er markeret
// klar - man kan ikke installere noget der ikke er faerdigbygget endnu
// ("man først flytter en opgave til produktion, og derefter kan flytte
// til installeringsfasen - begge ting kan ikke ske samtidigt").
//
// RUNDE 10 (§L - "installatør skal modtage betaling hos kunden lige efter
// installering er sket... det skal implicit være betragtet 'betalt' hvis
// installering vises 'bekræftet'"): naar en MONTERET ordre markeres
// installeret, saettes betalingen (og selve stadiet) nu HELT automatisk -
// Koordinator skal ikke laengere ogsaa manuelt trykke "Markér betalt"
// bagefter for monterede ordrer. Gaelder KUN naar wantsInstallation er
// sand - ordrer uden montering betales derimod FØR produktion (haandhaevet
// i /api/orders/[id]/route.ts's paymentStatus-blok), ikke her.
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(["COORDINATOR", "INSTALLER"]);
  if (!auth.ok) return auth.response;
  const existing = await prisma.order.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Ordre ikke fundet" }, { status: 404 });
  if (!existing.readyAt) {
    return NextResponse.json({ error: "Ordren skal være markeret klar i produktion, før den kan markeres installeret." }, { status: 400 });
  }
  const data: any = { installedAt: new Date() };
  if (existing.wantsInstallation) {
    data.paymentStatus = "BETALT";
    data.paidAt = new Date();
    // Kun et fremad-skridt (aldrig baglæns) - en ordre Koordinator allerede
    // har markeret ANMELDT skal ikke rykkes tilbage til BETALT herfra.
    if (existing.stage === "I_PRODUKTION") data.stage = "BETALT";
  }
  const order = await prisma.order.update({ where: { id: params.id }, data });
  return NextResponse.json({ order });
}

// RUNDE 4 (§G5): fortrydelse er nu KUN en Koordinator-handling.
// RUNDE 10 (§L): fortryder ogsaa den automatiske betalings-/stadiemarkering
// fra POST ovenfor - men KUN hvis den reelt blev sat automatisk herfra og
// Koordinator ikke allerede er gaaet videre til ANMELDT (som ville betyde
// fortrydelsen kommer for sent til at give mening at rulle tilbage).
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(["COORDINATOR"]);
  if (!auth.ok) return auth.response;
  const existing = await prisma.order.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Ordre ikke fundet" }, { status: 404 });
  const data: any = { installedAt: null };
  if (existing.wantsInstallation && existing.stage === "BETALT") {
    data.stage = "I_PRODUKTION";
    data.paymentStatus = "IKKE_SENDT";
    data.paidAt = null;
  }
  const order = await prisma.order.update({ where: { id: params.id }, data });
  return NextResponse.json({ order });
}
