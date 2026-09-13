import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// RUNDE 4 (§G5): "installeret" kan foerst saettes NAAR ordren er markeret
// klar - man kan ikke installere noget der ikke er faerdigbygget endnu
// ("man først flytter en opgave til produktion, og derefter kan flytte
// til installeringsfasen - begge ting kan ikke ske samtidigt").
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(["COORDINATOR", "INSTALLER"]);
  if (!auth.ok) return auth.response;
  const existing = await prisma.order.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Ordre ikke fundet" }, { status: 404 });
  if (!existing.readyAt) {
    return NextResponse.json({ error: "Ordren skal være markeret klar i produktion, før den kan markeres installeret." }, { status: 400 });
  }
  const order = await prisma.order.update({ where: { id: params.id }, data: { installedAt: new Date() } });
  return NextResponse.json({ order });
}

// RUNDE 4 (§G5): fortrydelse er nu KUN en Koordinator-handling.
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(["COORDINATOR"]);
  if (!auth.ok) return auth.response;
  const order = await prisma.order.update({ where: { id: params.id }, data: { installedAt: null } });
  return NextResponse.json({ order });
}
