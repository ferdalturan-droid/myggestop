import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// RUNDE 3: Byggerens eget "i gang"-tryk, direkte fra kalenderen (samme
// moenster som "Klar" i ../klar/route.ts) - rent informativt, saa
// Coordinator kan se at arbejdet reelt er paabegyndt.
// RUNDE 4 (§G5): kan kun saettes naar ordren reelt er i produktion.
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(["COORDINATOR", "BUILDER"]);
  if (!auth.ok) return auth.response;
  const existing = await prisma.order.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Ordre ikke fundet" }, { status: 404 });
  if (existing.stage !== "I_PRODUKTION") {
    return NextResponse.json({ error: "Ordren skal være sendt til produktion, før den kan markeres i gang." }, { status: 400 });
  }
  const order = await prisma.order.update({ where: { id: params.id }, data: { productionStartedAt: new Date() } });
  return NextResponse.json({ order });
}

// RUNDE 4 (§G5): fortrydelse er nu KUN en Koordinator-handling.
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(["COORDINATOR"]);
  if (!auth.ok) return auth.response;
  const order = await prisma.order.update({ where: { id: params.id }, data: { productionStartedAt: null } });
  return NextResponse.json({ order });
}
