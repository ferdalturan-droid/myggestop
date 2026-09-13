import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// RUNDE 4 (§G1) - ÉNGANGS-rettelse: den forrige cleanup-ghost-items-kørsel
// slettede ved en fejl 2 ÆGTE "Montering"-linjer (0×0 mm er normalt for
// denne linjetype - det er en fast gebyrlinje, ikke et produkt). Genopretter
// præcis disse 2 rækker. Fjernes fra git igen efter brug.
export async function POST() {
  const auth = await requireRole(["COORDINATOR"]);
  if (!auth.ok) return auth.response;
  const toRestore = [
    { orderId: "cmtssk9sv00003a2m246yyqjv", lineTotal: 1000 },
    { orderId: "cmtz74ajt000011nkhyj1dl4c", lineTotal: 600 }
  ];
  const created = [];
  for (const r of toRestore) {
    const order = await prisma.order.findUnique({ where: { id: r.orderId } });
    if (!order) continue;
    const item = await prisma.orderItem.create({
      data: {
        orderId: r.orderId,
        roomName: "",
        productName: "Montering",
        widthMm: 0,
        heightMm: 0,
        colorName: "",
        comment: "",
        isDoubleDoor: false,
        areaSqm: 0,
        lineTotal: r.lineTotal
      }
    });
    created.push(item);
  }
  return NextResponse.json({ created });
}
