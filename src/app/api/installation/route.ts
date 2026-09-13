import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// FASE 4 (§4): installationsliste - Orders hvor readyAt != null og
// installedAt == null.
export async function GET() {
  const auth = await requireRole(["COORDINATOR", "INSTALLER"]);
  if (!auth.ok) return auth.response;
  const orders = await prisma.order.findMany({
    where: { readyAt: { not: null }, installedAt: null },
    include: { items: true },
    orderBy: { readyAt: "asc" }
  });
  return NextResponse.json({ orders });
}
