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
  // RUNDE 5 (§"Installators (specifik person) kalender"): en Bygger/
  // Installatør skal se SIN EGEN aftale, ikke enhver aftale paa den
  // generiske ressource-type ("der er ikke et generelt 'bygger', hvis der
  // er flere end 1 skal de vises separat da alle har deres egne kalender").
  // Fallback til den gamle resource-match for aeldre aftaler oprettet
  // foer assignedUserId fandtes (assignedUserId er null der).
  if (auth.session.role === "BUILDER" || auth.session.role === "INSTALLER") {
    where.OR = [
      { assignedUserId: auth.session.sub },
      { assignedUserId: null, resource: auth.session.role }
    ];
  } else {
    // Coordinator kan valgfrit filtrere paa ressource og/eller en konkret
    // person client-side (fanerne i UI'en), men understoetter ogsaa
    // query-params for fuldstaendighed.
    const resource = req.nextUrl.searchParams.get("resource");
    if (resource === "BUILDER" || resource === "INSTALLER") where.resource = resource;
    const assignedUserId = req.nextUrl.searchParams.get("assignedUserId");
    if (assignedUserId) where.assignedUserId = assignedUserId;
  }
  const items = await prisma.appointment.findMany({
    where,
    orderBy: [{ day: "asc" }, { time: "asc" }],
    include: {
      lead: { select: { leadNumber: true, id: true, _count: { select: { measurements: true } } } },
      order: { select: { orderNumber: true, id: true, readyAt: true, _count: { select: { items: true } } } },
      assignedUser: { select: { id: true, name: true, role: true } }
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

  // RUNDE 5: valider den navngivne person, hvis en er valgt - dobbelt-
  // tjek server-side (ikke kun UI-filteret) at personen rent faktisk har
  // den rolle opgaven kræver, saa en Opmåling aldrig kan ende paa en
  // Bygger-konto ved en fejl.
  let assignedUserId: string | null = b.assignedUserId ? String(b.assignedUserId) : null;
  if (assignedUserId) {
    const person = await prisma.adminUser.findUnique({ where: { id: assignedUserId } });
    if (!person) return NextResponse.json({ error: "Den valgte person findes ikke." }, { status: 400 });
    if (person.role !== "BUILDER" && person.role !== "INSTALLER") {
      return NextResponse.json({ error: "Aftaler kan kun tildeles en Bygger eller Installatør." }, { status: 400 });
    }
    if (b.resource && person.role !== b.resource) {
      return NextResponse.json({ error: `Den valgte person er ${person.role === "BUILDER" ? "Bygger" : "Installatør"}, men opgaven kræver ${b.resource === "BUILDER" ? "Bygger" : "Installatør"}.` }, { status: 400 });
    }
  }

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
      orderId: b.orderId || null,
      assignedUserId
    },
    include: { lead: { select: { leadNumber: true } }, order: { select: { orderNumber: true } }, assignedUser: { select: { id: true, name: true, role: true } } }
  });
  return NextResponse.json({ item });
}
