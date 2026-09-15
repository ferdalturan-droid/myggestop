import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/requireAdmin";
import { promoteLeadToOrder } from "@/lib/promoteLead";
import { recalcLeadCalculatedPrice } from "@/lib/measurementPricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LEAD_STAGES = ["NYT_LEAD", "KONTAKTET", "OPMAALING_BOOKET", "TILBUD_GIVET", "BEKRAEFTET"];

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(["COORDINATOR"]);
  if (!auth.ok) return auth.response;
  const lead = await prisma.lead.findUnique({
    where: { id: params.id },
    include: { measurements: { orderBy: [{ itemNumber: "asc" }, { createdAt: "asc" }] }, appointments: { include: { assignedUser: { select: { id: true, name: true } } } }, order: { select: { id: true, orderNumber: true, stage: true } } }
  });
  if (!lead) return NextResponse.json({ error: "Ikke fundet" }, { status: 404 });
  return NextResponse.json({ lead });
}

// RUNDE 3: Installatøren skal kunne trykke "Markér opmåling færdig" fra
// sin egen Opmålingsliste - det virkede reelt ALDRIG, fordi hele denne
// rute var COORDINATOR-only, saa hans PATCH blev stille afvist (403) uden
// nogen synlig fejl i UI'en (§ brugerens rapport: "der sker intet"). Nu
// tilladt for begge roller, men FELT-niveauet er stadig laast: Installer
// maa kun saette measuredAt (hans eget, eksplicitte "faerdig maalt"-
// faktum, §11.2) - alt andet (pris, stadie, kundeoplysninger) forbliver
// udelukkende Coordinators, jf. "alt info kan kun opdateres af koordinator".
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(["COORDINATOR", "INSTALLER"]);
  if (!auth.ok) return auth.response;
  const erKoordinator = auth.session.role === "COORDINATOR";
  const b = await req.json().catch(() => ({}));
  const existing = await prisma.lead.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Ikke fundet" }, { status: 404 });

  const data: any = {};
  let blivBekraeftetNu = false;
  if (erKoordinator) {
    for (const f of ["firstName", "lastName", "phone", "email", "address", "postalCode", "city", "source", "productSummary", "note"] as const) {
      if (typeof b[f] === "string") data[f] = b[f];
    }
    // RUNDE 10 (§H - "beregningsmekanismen er allerede i systemet du skal
    // bruge det"): quotePriceDkk er nu KUN et historisk felt - Koordinator
    // indtaster ikke laengere en fri pris, kun en rabat der traekkes fra
    // den automatisk beregnede pris (calculatedPriceDkk, sat nedenfor).
    if (typeof b.discountDkk === "number") data.discountDkk = Math.max(0, b.discountDkk);
    if (typeof b.expectedMeasuringWeekLabel === "string") data.expectedMeasuringWeekLabel = b.expectedMeasuringWeekLabel;
    blivBekraeftetNu = b.stage === "BEKRAEFTET" && existing.stage !== "BEKRAEFTET";
    if (b.stage && LEAD_STAGES.includes(b.stage)) {
      data.stage = b.stage;
      // §6.1: BEKRAEFTET er grænsen mellem Lead og Order - saet confirmedAt
      // foerste gang stadiet naas, driver senere koe-raekkefoelge (§3.6).
      if (b.stage === "BEKRAEFTET" && !existing.confirmedAt) data.confirmedAt = new Date();
    }
  }
  // §6.2a/§11.2: eksplicit signering, aldrig automatisk - tilladt for
  // BEGGE roller (Installer saetter den selv, Coordinator kan rette den).
  const saetterMaaltFaerdigNu = b.measuredAt === true && !existing.measuredAt;
  if (b.measuredAt === true) data.measuredAt = new Date();

  // RUNDE 10 (§H - "når installatør har bekræftet opmåling, skal pris
  // sættes på LEAD... beregningsmekanismen er allerede i systemet du skal
  // bruge det"): naar opmaalingen markeres faerdig foerste gang, genberegnes
  // (og om noedvendigt selvhelbredes/reparerer) prisen via den delte
  // recalcLeadCalculatedPrice - se dens udfoerlige kommentar i
  // measurementPricing.ts for de to huller den lukker (gammel data uden
  // gemt calculatedLineTotal, og efterfoelgende rettelser af maal-linjer).
  const lead = await prisma.$transaction(async (tx: any) => {
    const updated = await tx.lead.update({ where: { id: params.id }, data });
    if (saetterMaaltFaerdigNu) await recalcLeadCalculatedPrice(tx, params.id);
    if (blivBekraeftetNu) await promoteLeadToOrder(tx as any, params.id);
    return saetterMaaltFaerdigNu ? await tx.lead.findUnique({ where: { id: params.id } }) : updated;
  });
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
