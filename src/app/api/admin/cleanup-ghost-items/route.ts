import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// RUNDE 4 (§G1) - ÉNGANGS-oprydningsværktøj, IKKE en del af den
// permanente kodebase (ligesom fase1-migrate/emergency-reset). Fjerner de
// OrderItem-rækker der blev oprettet af den nu rettede fejl i
// promoteLead.ts (et bekræftet lead med endnu-uopmålte linjer delte
// tilbudsprisen ligeligt ud på ALLE linjer, inkl. dem uden mål - "SINEKLIK
// 0×0 mm - 18 kr"). Rører KUN rene spøgelses-linjer (widthMm=0 OG
// heightMm=0 OG lineTotal>0) - order.productsTotal/estimatedTotal
// (den reelle tilbudspris) røres IKKE, kun de kunstige visningslinjer
// fjernes. Fjernes fra git igen efter brug.
export async function POST() {
  const auth = await requireRole(["COORDINATOR"]);
  if (!auth.ok) return auth.response;
  const ghosts = await prisma.orderItem.findMany({
    where: { widthMm: 0, heightMm: 0, lineTotal: { gt: 0 } },
    select: { id: true, orderId: true, productName: true, lineTotal: true }
  });
  if (ghosts.length === 0) return NextResponse.json({ deleted: 0, items: [] });
  await prisma.orderItem.deleteMany({ where: { id: { in: ghosts.map((g: any) => g.id) } } });
  return NextResponse.json({ deleted: ghosts.length, items: ghosts });
}
