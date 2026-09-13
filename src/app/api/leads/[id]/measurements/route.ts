import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// FASE 3 (§6.2): forventede maalelinjer oprettes af COORDINATOR naar
// lead.stage -> OPMAALING_BOOKET, med widthMm/heightMm = null. Installer
// udfylder de reelle tal senere (se [measurementId]/route.ts).
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(["COORDINATOR"]);
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
      productType: String(b.productType || "").trim(),
      colorName: String(b.colorName || "").trim(),
      comment: String(b.comment || "").trim(),
      widthMm: b.widthMm != null && b.widthMm !== "" ? Number(b.widthMm) : null,
      heightMm: b.heightMm != null && b.heightMm !== "" ? Number(b.heightMm) : null
    }
  });
  return NextResponse.json({ measurement });
}
