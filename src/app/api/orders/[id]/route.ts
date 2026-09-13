import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/requireAdmin";
import { ORDER_STATUS_ORDER } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// RUNDE 2 (Gruppe 2): GET er read-only og aabnes for alle tre roller -
// Builder skal kunne se "alt hvad han skal bruge" paa sin ordres
// detaljeside (§11.1/processen). Selve redigeringen (PATCH) og sletning
// forbliver begraenset, se nedenfor.
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(["COORDINATOR", "INSTALLER", "BUILDER"]);
  if (!auth.ok) return auth.response;
  const order = await prisma.order.findUnique({ where: { id: params.id }, include: { items: true } });
  if (!order) return NextResponse.json({ error: "Ikke fundet" }, { status: 404 });
  return NextResponse.json({ order });
}

// RUNDE 2: "kun installer/coordinator kan redigere ordren" (brugerens egen
// procesbeskrivelse) - Installer faar nu samme redigerings-ret som
// Coordinator (var tidligere fejlagtigt COORDINATOR-only, hvilket i praksis
// betoed at Installer slet ikke kunne redigere en ordre). Builder er
// bevidst IKKE med her.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(["COORDINATOR", "INSTALLER"]);
  if (!auth.ok) return auth.response;
  const body = await req.json();
  const existing = await prisma.order.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Ikke fundet" }, { status: 404 });

  const data: any = {};
  if (body.status && ORDER_STATUS_ORDER.includes(body.status)) data.status = body.status;
  // FASE 4 (§3.3/§6.5): produktionsstadie - separat fra den gamle status.
  if (body.stage && ["KOE", "I_PRODUKTION", "BETALT", "ANMELDT"].includes(body.stage)) data.stage = body.stage;
  // RUNDE 2 (Q4/§6.7): saettes typisk sammen med stage->I_PRODUKTION fra
  // "Send til produktion"-knappen, men accepteres ogsaa separat.
  if (typeof body.estReadyDate === "string" && body.estReadyDate) data.estReadyDate = new Date(body.estReadyDate);
  if (typeof body.estReadyWeekLabel === "string") data.estReadyWeekLabel = body.estReadyWeekLabel || null;
  for (const f of ["firstName", "lastName", "phone", "email", "address", "postalCode", "city", "note"] as const) {
    if (typeof body[f] === "string") data[f] = body[f];
  }
  if (typeof body.wantsInstallation === "boolean") data.wantsInstallation = body.wantsInstallation;

  const installationTotal = typeof body.installationTotal === "number" ? body.installationTotal : existing.installationTotal;

  if (Array.isArray(body.items)) {
    const productsTotal = body.items.reduce((s: number, it: any) => s + (Number(it.lineTotal) || 0), 0);
    data.productsTotal = productsTotal;
    data.installationTotal = installationTotal;
    data.estimatedTotal = productsTotal + installationTotal;
    await prisma.orderItem.deleteMany({ where: { orderId: params.id } });
    data.items = {
      create: body.items.map((it: any) => ({
        roomName: it.roomName || "",
        productName: it.productName || "",
        widthMm: Math.max(0, Math.round(Number(it.widthMm) || 0)),
        heightMm: Math.max(0, Math.round(Number(it.heightMm) || 0)),
        colorName: it.colorName || "",
        comment: it.comment || "",
        isDoubleDoor: !!it.isDoubleDoor,
        areaSqm: Math.round(((Number(it.widthMm) || 0) / 1000) * ((Number(it.heightMm) || 0) / 1000) * 100) / 100,
        lineTotal: Number(it.lineTotal) || 0
      }))
    };
  } else if (typeof body.installationTotal === "number") {
    data.installationTotal = installationTotal;
    data.estimatedTotal = existing.productsTotal + installationTotal;
  }

  const order = await prisma.order.update({ where: { id: params.id }, data, include: { items: true } });
  return NextResponse.json({ order });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(["COORDINATOR"]);
  if (!auth.ok) return auth.response;
  await prisma.order.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
