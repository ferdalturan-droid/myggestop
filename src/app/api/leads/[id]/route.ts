import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LEAD_STAGES = ["NYT_LEAD", "KONTAKTET", "OPMAALING_BOOKET", "TILBUD_GIVET", "BEKRAEFTET"];

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(["COORDINATOR"]);
  if (!auth.ok) return auth.response;
  const lead = await prisma.lead.findUnique({
    where: { id: params.id },
    include: { measurements: { orderBy: { itemNumber: "asc" } }, appointments: true, order: { select: { id: true, orderNumber: true, stage: true } } }
  });
  if (!lead) return NextResponse.json({ error: "Ikke fundet" }, { status: 404 });
  return NextResponse.json({ lead });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(["COORDINATOR"]);
  if (!auth.ok) return auth.response;
  const b = await req.json().catch(() => ({}));
  const existing = await prisma.lead.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Ikke fundet" }, { status: 404 });

  const data: any = {};
  for (const f of ["firstName", "lastName", "phone", "email", "address", "postalCode", "city", "source", "productSummary", "note"] as const) {
    if (typeof b[f] === "string") data[f] = b[f];
  }
  if (typeof b.quotePriceDkk === "number") data.quotePriceDkk = b.quotePriceDkk;
  if (b.stage && LEAD_STAGES.includes(b.stage)) {
    data.stage = b.stage;
    // §6.1: BEKRAEFTET er grænsen mellem Lead og Order - saet confirmedAt
    // foerste gang stadiet naas, driver senere koe-raekkefoelge (§3.6).
    if (b.stage === "BEKRAEFTET" && !existing.confirmedAt) data.confirmedAt = new Date();
  }

  const lead = await prisma.lead.update({ where: { id: params.id }, data });
  return NextResponse.json({ lead });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(["COORDINATOR"]);
  if (!auth.ok) return auth.response;
  const existing = await prisma.lead.findUnique({ where: { id: params.id }, include: { order: true } });
  if (!existing) return NextResponse.json({ error: "Ikke fundet" }, { status: 404 });
  if (existing.order) return NextResponse.json({ error: "Kan ikke slette et lead der er forfremmet til en ordre." }, { status: 400 });
  await prisma.lead.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
