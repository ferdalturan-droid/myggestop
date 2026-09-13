import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// RUNDE 3: Byggerens eget "i gang"-tryk, direkte fra kalenderen (samme
// moenster som "Klar" i ../klar/route.ts) - rent informativt, saa
// Coordinator kan se at arbejdet reelt er paabegyndt.
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(["COORDINATOR", "BUILDER"]);
  if (!auth.ok) return auth.response;
  const order = await prisma.order.update({ where: { id: params.id }, data: { productionStartedAt: new Date() } });
  return NextResponse.json({ order });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(["COORDINATOR", "BUILDER"]);
  if (!auth.ok) return auth.response;
  const order = await prisma.order.update({ where: { id: params.id }, data: { productionStartedAt: null } });
  return NextResponse.json({ order });
}
