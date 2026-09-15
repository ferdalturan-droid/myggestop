import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/requireAdmin";
import { ORDER_STATUS_ORDER } from "@/lib/types";
import { getSetting } from "@/lib/settings";
import { calcInstallation } from "@/lib/pricing";

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
  const existing = await prisma.order.findUnique({ where: { id: params.id }, include: { items: true } });
  if (!existing) return NextResponse.json({ error: "Ikke fundet" }, { status: 404 });

  const data: any = {};
  if (body.status && ORDER_STATUS_ORDER.includes(body.status)) data.status = body.status;
  // FASE 4 (§3.3/§6.5): produktionsstadie - separat fra den gamle status.
  // RUNDE 8 (delta §8 + brugerens eksplicitte instruks: "Calendar (tentative
  // and fixed) can only be created directly from calendar, i dont want any
  // ui possiblity to auto-create as it confuses"): "Send til produktion" er
  // nu KUN et stadie-skift - INGEN kalenderaftale, bygger-valg eller dato
  // kraeves/oprettes her laengere (dette ophaevede Runde 6/7's automatik,
  // som netop var det brugeren bad om at fjerne). Koordinator opretter selv
  // produktionsaftalen hos den navngivne bygger fra Kalender-siden, naar
  // den reelt skal planlaegges - ligesom opmåling/installation.
  // RUNDE 4 (§G6): "Markér betalt"/"Markér anmeldt" er nu KUN en
  // Koordinator-handling - ingen andre roller maa se eller saette dette.
  if (body.stage && ["BETALT", "ANMELDT"].includes(body.stage) && auth.session.role !== "COORDINATOR") {
    return NextResponse.json({ error: "Kun Koordinator kan markere betalt/anmeldt." }, { status: 403 });
  }
  // RUNDE 10 (§L - "hvis der ikke er bestilt montering skal betalingen ske
  // før ordren er flyttet til produktion"): haandhaeves her, server-side,
  // ikke kun som en UI-spærring - "Send til produktion" (KOE -> I_PRODUKTION)
  // afvises for ikke-monterede ordrer, indtil Koordinator har markeret
  // betaling modtaget (se paymentStatus-blokken nedenfor). Montering har sin
  // EGEN betalingsvej (automatisk ved "Installeret", se installeret/route.ts)
  // og er derfor bevidst undtaget fra denne spærring.
  if (body.stage === "I_PRODUKTION" && existing.stage === "KOE" && !existing.wantsInstallation && existing.paymentStatus !== "BETALT") {
    return NextResponse.json({ error: "Betaling skal modtages fra kunden, før ordren kan sendes til produktion (der er ikke bestilt montering)." }, { status: 400 });
  }
  if (body.stage && ["KOE", "I_PRODUKTION", "BETALT", "ANMELDT"].includes(body.stage)) data.stage = body.stage;
  // RUNDE 10 (§L): Koordinators manuelle "betaling modtaget"-markering for
  // ordrer UDEN montering (fragt/afhentning) - kun Koordinator, ligesom
  // Betalt/Anmeldt-stadierne ovenfor. Montering saetter dette felt HELT
  // automatisk (se installeret/route.ts) og skal ikke kunne rettes manuelt
  // her, for at undgaa at de to veje kommer i konflikt med hinanden.
  if (typeof body.paymentStatus === "string" && ["BETALT", "IKKE_SENDT"].includes(body.paymentStatus)) {
    if (auth.session.role !== "COORDINATOR") {
      return NextResponse.json({ error: "Kun Koordinator kan markere betaling modtaget." }, { status: 403 });
    }
    if (existing.wantsInstallation) {
      return NextResponse.json({ error: "Denne ordre monteres - betaling markeres automatisk af Installatøren, ikke manuelt her." }, { status: 400 });
    }
    data.paymentStatus = body.paymentStatus;
    data.paidAt = body.paymentStatus === "BETALT" ? new Date() : null;
  }
  for (const f of ["firstName", "lastName", "phone", "email", "address", "postalCode", "city", "note"] as const) {
    if (typeof body[f] === "string") data[f] = body[f];
  }
  // RUNDE 9 ("Det skal være muligt at vælge om montering skal laves eller
  // ikke på ordre niveau, når montering vælges skal tillæg automatisk
  // inkluderes i pris"): wantsInstallation er et rent ja/nej-valg -
  // monteringsgebyret beregnes ALTID her server-side ud fra de gældende
  // indstillinger (aldrig et tal klienten selv sender ind), saa det ikke
  // kan komme ud af trit med Priser & gebyrer.
  let wantsInstallationChanged = false;
  if (typeof body.wantsInstallation === "boolean" && body.wantsInstallation !== existing.wantsInstallation) {
    data.wantsInstallation = body.wantsInstallation;
    wantsInstallationChanged = true;
  }

  // RUNDE 9: levering - kun relevant naar der IKKE monteres. "fragtes"
  // kraever en manuelt indtastet pris (varierer, beregnes ikke automatisk -
  // jf. eksisterende "Fragt beregnes ikke automatisk" i Priser & gebyrer).
  if (typeof body.deliveryMethod === "string" && ["AFHENTER_SELV", "FRAGTES"].includes(body.deliveryMethod)) {
    data.deliveryMethod = body.deliveryMethod;
  }
  const nextDeliveryMethod = data.deliveryMethod ?? existing.deliveryMethod;
  if (nextDeliveryMethod === "FRAGTES") {
    if (typeof body.shippingCost === "number") data.shippingCost = Math.max(0, body.shippingCost);
  } else if (data.deliveryMethod === "AFHENTER_SELV") {
    // Skifter man tilbage til "afhenter selv", giver en gemt fragtpris ikke længere mening.
    data.shippingCost = null;
  }

  let installationTotal = typeof body.installationTotal === "number" ? body.installationTotal : existing.installationTotal;

  if (wantsInstallationChanged) {
    const pricing = await getSetting("pricing");
    // Antal fysiske enheder = de rigtige produktlinjer (ikke gebyr-/rabatlinjer med 0×0 mm).
    const itemCount = existing.items.filter((it) => !(it.widthMm === 0 && it.heightMm === 0)).length;
    installationTotal = calcInstallation(itemCount, body.wantsInstallation, pricing);
    data.installationTotal = installationTotal;
    data.estimatedTotal = existing.productsTotal + installationTotal;
  }

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
