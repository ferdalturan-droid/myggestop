import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// RUNDE 2 (Q5): redigering/sletning af en enkelt kalenderaftale direkte
// fra kalendersiden - samme roller som resten af kalenderen (§Q5: "ja til
// det hele" for begge de roller der i forvejen maa se /admin/kalender).
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(["COORDINATOR", "INSTALLER"]);
  if (!auth.ok) return auth.response;
  const existing = await prisma.appointment.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Ikke fundet" }, { status: 404 });
  const b = await req.json().catch(() => ({}));
  if (b.leadId && b.orderId) return NextResponse.json({ error: "Vælg enten et lead eller en ordre, ikke begge." }, { status: 400 });

  const data: any = {};
  if (typeof b.day === "string" && b.day) data.day = b.day;
  if ("time" in b) data.time = b.time ? String(b.time) : null;
  if (typeof b.customer === "string" && b.customer.trim()) data.customer = b.customer.trim();
  for (const f of ["phone", "address", "note"] as const) {
    if (typeof b[f] === "string") data[f] = b[f];
  }
  if ("type" in b) data.type = b.type || null;
  if ("status" in b) data.status = b.status || null;
  if ("resource" in b) data.resource = b.resource || null;
  if ("leadId" in b) { data.leadId = b.leadId || null; if (b.leadId) data.orderId = null; }
  if ("orderId" in b) { data.orderId = b.orderId || null; if (b.orderId) data.leadId = null; }

  const item = await prisma.appointment.update({
    where: { id: params.id },
    data,
    include: { lead: { select: { leadNumber: true } }, order: { select: { orderNumber: true } } }
  });
  return NextResponse.json({ item });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(["COORDINATOR", "INSTALLER"]);
  if (!auth.ok) return auth.response;
  await prisma.appointment.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
