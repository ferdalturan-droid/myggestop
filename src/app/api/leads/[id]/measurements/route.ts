import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// FASE 3 (§6.2): forventede maalelinjer oprettes af COORDINATOR naar
// lead.stage -> OPMAALING_BOOKET, med widthMm/heightMm = null. Installer
// udfylder de reelle tal senere (se [measurementId]/route.ts).
// RUNDE 2 (§11.3): INSTALLER maa nu OGSAA selv oprette en helt ny linje
// (Coordinators forventede linjer er kun et estimat), og tur/sys/tip/
// layout/kanat/adet accepteres her ligesom paa PATCH-endpointet.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(["COORDINATOR", "INSTALLER"]);
  if (!auth.ok) return auth.response;
  const lead = await prisma.lead.findUnique({ where: { id: params.id } });
  if (!lead) return NextResponse.json({ error: "Ikke fundet" }, { status: 404 });
  const b = await req.json().catch(() => ({}));
  const count = await prisma.measurement.count({ where: { leadId: params.id } });
  const measurement = await prisma.measurement.create({
    data: {
      leadId: params.id,
      itemNumber: count + 1,
      roomName: String(b.roomName || "").trim(),
      productType: String(b.productType || b.tur || "").trim(),
      colorName: String(b.colorName || "").trim(),
      comment: String(b.comment || "").trim(),
      widthMm: b.widthMm != null && b.widthMm !== "" ? Number(b.widthMm) : null,
      heightMm: b.heightMm != null && b.heightMm !== "" ? Number(b.heightMm) : null,
      tur: String(b.tur || "SINEKLIK"),
      sys: String(b.sys || "1,9"),
      tip: String(b.tip || "TEK"),
      layout: String(b.model || b.layout || "YANA"),
      kanat: String(b.kanat || "HAREKETLI"),
      adet: Math.max(1, Math.round(Number(b.adet) || 1))
    }
  });
  return NextResponse.json({ measurement });
}
