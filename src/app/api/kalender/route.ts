import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// FASE 5 (§10.8) / RUNDE 3: dagsgrupperet kalendervisning. Alle tre roller
// maa nu se kalenderen, men serveren begraenser SELV hvad hver rolle faar
// tilbage (§"Outlook-stil separat adgang" - Coordinator ser alt, Bygger/
// Installatoer ser kun deres egen ressource) - dette er den reelle
// haandhaevelse, ikke kun en UI-visning der kan omgaas.
export async function GET(req: NextRequest) {
  const auth = await requireRole(["COORDINATOR", "BUILDER", "INSTALLER"]);
  if (!auth.ok) return auth.response;
  const where: any = {};
  if (auth.session.role === "BUILDER") where.resource = "BUILDER";
  else if (auth.session.role === "INSTALLER") where.resource = "INSTALLER";
  else {
    // Coordinator kan valgfrit filtrere paa ressource client-side (fanerne
    // i UI'en), men understoetter ogsaa et query-param for fuldstaendighed.
    const resource = req.nextUrl.searchParams.get("resource");
    if (resource === "BUILDER" || resource === "INSTALLER") where.resource = resource;
  }
  const items = await prisma.appointment.findMany({
    where,
    orderBy: [{ day: "asc" }, { time: "asc" }],
    include: {
      lead: { select: { leadNumber: true, id: true, _count: { select: { measurements: true } } } },
      order: { select: { orderNumber: true, id: true, readyAt: true, productionStartedAt: true, _count: { select: { items: true } } } }
    }
  });
  return NextResponse.json({ items });
}

// RUNDE 3: kun Coordinator maa oprette en aftale ("Kun koordinator kan
// oprette" - eksplicit bruger-instruktion). Bygger/Installatoer faar
// aftaler enten via automatik (§"Send til produktion" -> PRODUKTION-
// aftale) eller ved at Coordinator selv booker Opmåling/Installation.
export async function POST(req: NextRequest) {
  const auth = await requireRole(["COORDINATOR"]);
  if (!auth.ok) return auth.response;
  const b = await req.json().catch(() => ({}));
  if (!b.day || !String(b.day).trim()) return NextResponse.json({ error: "Dato mangler." }, { status: 400 });
  if (!b.customer || !String(b.customer).trim()) return NextResponse.json({ error: "Angiv en titel/kunde for aftalen." }, { status: 400 });
  if (b.leadId && b.orderId) return NextResponse.json({ error: "Vælg enten et lead eller en ordre, ikke begge." }, { status: 400 });

  const item = await prisma.appointment.create({
    data: {
      day: String(b.day),
      time: b.time ? String(b.time) : null,
      customer: String(b.customer).trim(),
      phone: String(b.phone || ""),
      address: String(b.address || ""),
      note: String(b.note || ""),
      type: b.type || null,
      status: b.status || null,
      resource: b.resource || null,
      leadId: b.leadId || null,
      orderId: b.orderId || null
    },
    include: { lead: { select: { leadNumber: true } }, order: { select: { orderNumber: true } } }
  });
  return NextResponse.json({ item });
}
