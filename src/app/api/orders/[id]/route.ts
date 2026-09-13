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
  // RUNDE 3: naar stadiet netop NU skifter til I_PRODUKTION ("Send til
  // produktion"), skal ordren "dukke op med detaljer for byggeren i samme
  // moment" ved at en PRODUKTION-aftale automatisk oprettes paa hans
  // kalender - samme transaktion, saa den aldrig kan mangle.
  const sendesTilProduktionNu = body.stage === "I_PRODUKTION" && existing.stage !== "I_PRODUKTION";
  // RUNDE 4 (§G6): "Markér betalt"/"Markér anmeldt" er nu KUN en
  // Koordinator-handling - ingen andre roller maa se eller saette dette.
  if (body.stage && ["BETALT", "ANMELDT"].includes(body.stage) && auth.session.role !== "COORDINATOR") {
    return NextResponse.json({ error: "Kun Koordinator kan markere betalt/anmeldt." }, { status: 403 });
  }
  // RUNDE 6 (§"fra en ordre når jeg vælger dato sender til produktion,
  // opretter den en 'tentative' booking i calendar uden 'bygger (person)'
  // selvom dette er et obligatorisk felt... sørg for at dette aldrig sker
  // i systemet da det er unlogical"): haandhaevet HER, server-side - ikke
  // kun som et UI-krav - saa "Send til produktion" er strukturelt umuligt
  // at gennemfoere uden en navngiven Bygger, uanset hvilken klient der kalder.
  let byggerForProduktion: { id: string; role: string } | null = null;
  if (sendesTilProduktionNu) {
    const assignedUserId = body.assignedUserId ? String(body.assignedUserId) : null;
    if (!assignedUserId) {
      return NextResponse.json({ error: "Vælg hvilken bygger ordren skal sendes til, før den kan sendes til produktion." }, { status: 400 });
    }
    const person = await prisma.adminUser.findUnique({ where: { id: assignedUserId } });
    if (!person || person.role !== "BUILDER") {
      return NextResponse.json({ error: "Den valgte person er ikke en gyldig bygger." }, { status: 400 });
    }
    byggerForProduktion = { id: person.id, role: person.role };
  }
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

  const order = await prisma.$transaction(async (tx: any) => {
    const updated = await tx.order.update({ where: { id: params.id }, data, include: { items: true } });
    if (sendesTilProduktionNu) {
      const antalProdukter = updated.items.length;
      await tx.appointment.create({
        data: {
          day: data.estReadyDate ? data.estReadyDate.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
          time: null,
          customer: `${updated.firstName} ${updated.lastName}`,
          phone: updated.phone,
          address: `${updated.address}, ${updated.postalCode} ${updated.city}`,
          note: antalProdukter > 0 ? `${antalProdukter} produkt(er) at bygge` : "",
          type: "PRODUKTION",
          resource: "BUILDER",
          orderId: updated.id,
          assignedUserId: byggerForProduktion!.id
        }
      });
    }
    return updated;
  });
  return NextResponse.json({ order });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(["COORDINATOR"]);
  if (!auth.ok) return auth.response;
  await prisma.order.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
