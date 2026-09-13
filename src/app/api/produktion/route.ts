import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// FASE 4 (§4/§6.5): byggerens koe - Order hvor stage=I_PRODUKTION, i den
// raekkefoelge de faktisk er booket (createdAt), IKKE en formel-koe.
export async function GET() {
  const auth = await requireRole(["COORDINATOR", "BUILDER", "INSTALLER"]);
  if (!auth.ok) return auth.response;
  const orders = await prisma.order.findMany({
    where: { stage: "I_PRODUKTION" },
    include: { items: true },
    orderBy: { createdAt: "asc" }
  });
  return NextResponse.json({ orders });
}
