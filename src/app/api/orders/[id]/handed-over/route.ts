import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// RUNDE 9 ("Hvis den skal fragtes eller afhentes selv skal koordinator
// sætte status manuelt afhængigt af når den er fragtet eller afhentet"):
// modstykket til /api/installation/[id]/installeret, men KUN for ordrer
// hvor wantsInstallation=false - der findes ingen installatør-del af
// processen for disse, saa det er en ren Koordinator-handling (der er
// ikke, som ved installation, en anden rolle der reelt udfører arbejdet
// i systemet - kunden afhenter selv, eller en fragtmand henter den).
// RUNDE 10 (§L): for disse ordrer er betaling per definition allerede sket
// FØR produktion (haandhaevet i /api/orders/[id]'s paymentStatus-blok) -
// stadiet rykkes derfor automatisk til BETALT her, ligesom montering gør
// det automatisk ved "Installeret". Koordinator skal ikke bagefter huske
// endnu en manuel "Markér betalt"-handling for noget der reelt allerede
// er betalt.
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(["COORDINATOR"]);
  if (!auth.ok) return auth.response;
  const existing = await prisma.order.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Ordre ikke fundet" }, { status: 404 });
  if (existing.wantsInstallation) {
    return NextResponse.json({ error: "Denne ordre skal monteres - brug 'Marker Installeret' i stedet." }, { status: 400 });
  }
  if (!existing.readyAt) {
    return NextResponse.json({ error: "Ordren skal være markeret klar i produktion først." }, { status: 400 });
  }
  const data: any = { handedOverAt: new Date() };
  if (existing.paymentStatus === "BETALT" && existing.stage === "I_PRODUKTION") data.stage = "BETALT";
  const order = await prisma.order.update({ where: { id: params.id }, data });
  return NextResponse.json({ order });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(["COORDINATOR"]);
  if (!auth.ok) return auth.response;
  const existing = await prisma.order.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Ordre ikke fundet" }, { status: 404 });
  const data: any = { handedOverAt: null };
  if (!existing.wantsInstallation && existing.stage === "BETALT") data.stage = "I_PRODUKTION";
  const order = await prisma.order.update({ where: { id: params.id }, data });
  return NextResponse.json({ order });
}
