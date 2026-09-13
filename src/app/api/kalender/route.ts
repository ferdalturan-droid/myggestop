import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// FASE 5 (§10.8): minimal, dagsgrupperet kalendervisning - ikke et fuldt
// visuelt kalender-gitter. Viser BAADE de gamle frie ImalatCalc-aftaler
// (uden type/resource) og de nye Lead/Order-koblede.
export async function GET() {
  const auth = await requireRole(["COORDINATOR", "INSTALLER"]);
  if (!auth.ok) return auth.response;
  const items = await prisma.appointment.findMany({
    orderBy: [{ day: "asc" }, { time: "asc" }],
    include: { lead: { select: { leadNumber: true } }, order: { select: { orderNumber: true } } }
  });
  return NextResponse.json({ items });
}
