import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/requireAdmin";
import { calcMeasurementLineTotal, recalcLeadCalculatedPrice } from "@/lib/measurementPricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// FASE 3 (§6.2): forventede maalelinjer oprettes af COORDINATOR naar
// lead.stage -> OPMAALING_BOOKET, med widthMm/heightMm = null. Installer
// udfylder de reelle tal senere (se [measurementId]/route.ts).
// RUNDE 2 (§11.3): INSTALLER maa nu OGSAA selv oprette en helt ny linje
// (Coordinators forventede linjer er kun et estimat), og tur/sys/tip/
// layout/kanat/adet accepteres her ligesom paa PATCH-endpointet.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(["COORDINATOR", "INSTALLER"]);
  if (!auth.ok) return auth.response;
  const lead = await prisma.lead.findUnique({ where: { id: params.id } });
  if (!lead) return NextResponse.json({ error: "Ikke fundet" }, { status: 404 });
  const b = await req.json().catch(() => ({}));
  // RUNDE 10 (§D - dublet-fejl mellem Lead og Opmålingsliste): itemNumber
  // udregnes nu ud fra det HØJESTE eksisterende nummer + 1 (ikke blot
  // "antal rækker + 1") - to rækker kan derfor aldrig få samme itemNumber,
  // heller ikke selv om en tidligere linje skulle være slettet undervejs.
  // Et itemNumber-sammenstød var den mest sandsynlige årsag til, at linjer
  // kunne se ud til at "bytte plads" eller optræde som dubletter (Postgres
  // garanterer ikke en stabil rækkefølge ved ens sorteringsværdi).
  const existing = await prisma.measurement.findMany({ where: { leadId: params.id }, select: { itemNumber: true } });
  const nextItemNumber = existing.reduce((max, m) => Math.max(max, m.itemNumber), 0) + 1;
  const tur = String(b.tur || "SINEKLIK");
  const sys = String(b.sys || "1,9");
  const tip = String(b.tip || "TEK");
  const widthMm = b.widthMm != null && b.widthMm !== "" ? Number(b.widthMm) : null;
  const heightMm = b.heightMm != null && b.heightMm !== "" ? Number(b.heightMm) : null;
  const adet = Math.max(1, Math.round(Number(b.adet) || 1));
  const colorName = String(b.colorName || "").trim();
  const fabricColorName = String(b.fabricColorName || "").trim();
  const rodColorName = String(b.rodColorName || "").trim();
  const calculatedLineTotal = await calcMeasurementLineTotal({ tur, sys, tip, widthMm, heightMm, adet, colorName, fabricColorName, rodColorName });
  const measurement = await prisma.measurement.create({
    data: {
      leadId: params.id,
      itemNumber: nextItemNumber,
      roomName: String(b.roomName || "").trim(),
      productType: String(b.productType || b.tur || "").trim(),
      colorName,
      fabricColorName,
      rodColorName,
      subType: b.subType === "LAVPROFIL" ? "LAVPROFIL" : "NORMAL",
      comment: String(b.comment || "").trim(),
      widthMm,
      heightMm,
      tur,
      sys,
      tip,
      layout: String(b.model || b.layout || "YANA"),
      kanat: String(b.kanat || "HAREKETLI"),
      adet,
      calculatedLineTotal
    }
  });
  // RUNDE 10 (§H-tillæg): hvis opmålingen allerede er markeret færdig og
  // Installatøren alligevel tilføjer endnu en linje bagefter (rettelse),
  // skal den viste/gemte pris opdateres med det samme - ikke først ved
  // næste "Markér opmåling færdig" (som ikke sker igen, den knap er kun
  // relevant første gang).
  await recalcLeadCalculatedPrice(prisma, params.id);
  return NextResponse.json({ measurement });
}
