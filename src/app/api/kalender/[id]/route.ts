import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// RUNDE 3: redigering/sletning er nu Coordinator-only ("alt info kan kun
// opdateres af koordinator" - overstyrer Runde 2/Q5's bredere svar, som
// blev givet foer denne mere detaljerede rollefordeling).
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(["COORDINATOR"]);
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

  // RUNDE 5: samme server-side validering som ved oprettelse - se
  // /api/kalender POST for begrundelse.
  if ("assignedUserId" in b) {
    const assignedUserId = b.assignedUserId ? String(b.assignedUserId) : null;
    if (assignedUserId) {
      const person = await prisma.adminUser.findUnique({ where: { id: assignedUserId } });
      if (!person) return NextResponse.json({ error: "Den valgte person findes ikke." }, { status: 400 });
      if (person.role !== "BUILDER" && person.role !== "INSTALLER") {
        return NextResponse.json({ error: "Aftaler kan kun tildeles en Bygger eller Installatør." }, { status: 400 });
      }
      const resourceEfter = "resource" in b ? b.resource : existing.resource;
      if (resourceEfter && person.role !== resourceEfter) {
        return NextResponse.json({ error: `Den valgte person er ${person.role === "BUILDER" ? "Bygger" : "Installatør"}, men opgaven kræver ${resourceEfter === "BUILDER" ? "Bygger" : "Installatør"}.` }, { status: 400 });
      }
    }
    data.assignedUserId = assignedUserId;
  }

  const item = await prisma.appointment.update({
    where: { id: params.id },
    data,
    include: { lead: { select: { leadNumber: true } }, order: { select: { orderNumber: true } }, assignedUser: { select: { id: true, name: true, role: true } } }
  });
  return NextResponse.json({ item });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(["COORDINATOR"]);
  if (!auth.ok) return auth.response;
  await prisma.appointment.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
