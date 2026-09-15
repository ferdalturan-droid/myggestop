import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/requireAdmin";
import { TUR_LABEL } from "@/lib/calcOptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// FASE 6 (§8.6/§9): kobler Produktionsberegneren (ImalatCalc.tsx) DIREKTE
// til en ordres reelle Lead->Measurement-raekker, i stedet for at kraeve
// manuel genindtastning eller et engangs-"import"-snapshot der aldrig
// synkroniserer igen (den gamle §1 punkt 3-fejl). Rammer KUN ordrer der
// aabnes med ?orderId= i beregneren - den gamle Setting-blob-baserede
// "Gemte ordrer"-liste (§10.2/§10.5) er fuldstaendig upaavirket af denne
// rute og fortsaetter uaendret for igangvaerende, ufaerdige jobs.
//
// LAESE-adgang: alle tre roller maa se en ordres maal/pris i beregneren
// (Builder skal kunne aabne ?orderId= og se alt hvad han skal bruge).
async function authRead() {
  return requireRole(["COORDINATOR", "BUILDER", "INSTALLER"]);
}

// SKRIVE-adgang: RUNDE 2 (§11.1/§2 - "kun installer/coordinator kan
// redigere ordren") - Builder maa IKKE laengere gemme aendringer i maal
// eller pris via den ordre-koblede beregner. Han kan stadig aabne siden
// (GET ovenfor), men et gem-forsoeg afvises her, server-side - den
// egentlige haandhaevelse, uafhaengigt af hvad UI'en viser/skjuler.
async function authWrite() {
  return requireRole(["COORDINATOR", "INSTALLER"]);
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const a = await authRead();
  if (!a.ok) return a.response;
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      items: true,
      lead: { include: { measurements: { orderBy: [{ itemNumber: "asc" }, { createdAt: "asc" }] } } }
    }
  });
  if (!order) return NextResponse.json({ error: "Ordre ikke fundet" }, { status: 404 });
  return NextResponse.json({
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      firstName: order.firstName,
      lastName: order.lastName,
      phone: order.phone,
      address: order.address,
      postalCode: order.postalCode,
      city: order.city,
      wantsInstallation: order.wantsInstallation,
      stage: order.stage
    },
    leadId: order.leadId,
    measurements: order.lead?.measurements || [],
    items: order.items
  });
}

// Gemmer en ordre-koblet beregner-session:
// 1) Hver linje skrives til sin Measurement-raekke (opretter nye rækker
//    for linjer uden measurementId, sletter Measurement-rækker der ikke
//    laengere findes i rows) - dette ER kendsgerningen, saa den er
//    oejeblikkeligt synlig andre steder (Lead-detaljesiden, §9).
// 2) Order.items (OrderItem) genberegnes som en AFLEDT prissnapshot fra
//    de samme rows, praecis som den eksisterende PATCH /api/orders/[id]
//    allerede goer for den manuelle flow - samme moenster, ikke ny logik.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const a = await authWrite();
  if (!a.ok) return a.response;
  const order = await prisma.order.findUnique({ where: { id: params.id }, include: { lead: true } });
  if (!order) return NextResponse.json({ error: "Ordre ikke fundet" }, { status: 404 });

  const b = await req.json().catch(() => ({}));
  const rows: any[] = Array.isArray(b.rows) ? b.rows : [];
  const items: any[] = Array.isArray(b.items) ? b.items : [];
  // Samme konvention som /api/orders/manual: productsTotal er summen af
  // ALLE linjer (inkl. Montering og en evt. negativ Rabat-linje).
  const productsTotal = items.reduce((s: number, it: any) => s + (Number(it.lineTotal) || 0), 0);
  const installationTotal = 0;

  // clientKey (ImalatCalc's lokale row.uid) -> den rigtige measurementId,
  // saa klienten kan opdatere sin lokale raekke UDEN at genindlaese/nulstille
  // hele rows-arrayet (som ville afbryde en igangvaerende indtastning under
  // det debouncede autogem) - kun dette felt paavirkes efter et gem.
  const savedRows: { clientKey: any; measurementId: string }[] = [];

  if (order.leadId) {
    const existing = await prisma.measurement.findMany({ where: { leadId: order.leadId }, select: { id: true, itemNumber: true, builtAt: true } });
    const eksisterendeBuiltAt = new Map(existing.map((m: any) => [m.id, m.builtAt]));
    const keepIds = new Set(rows.filter((r) => r.measurementId).map((r) => r.measurementId));
    const toDelete = existing.filter((m: any) => !keepIds.has(m.id)).map((m: any) => m.id);
    let nextItemNumber = existing.reduce((max: number, m: any) => Math.max(max, m.itemNumber), 0) + 1;

    const ops: any[] = [];
    const offset = toDelete.length > 0 ? 1 : 0;
    if (toDelete.length > 0) ops.push(prisma.measurement.deleteMany({ where: { id: { in: toDelete } } }));
    for (const r of rows) {
      const data = {
        tur: String(r.tur || "SINEKLIK"),
        sys: String(r.sys || "1,9"),
        tip: String(r.tip || "TEK"),
        layout: String(r.model || "YANA"),
        kanat: String(r.kanat || "HAREKETLI"),
        adet: Math.max(1, Math.round(Number(r.adet) || 1)),
        widthMm: r.en !== "" && r.en != null ? Math.round((parseFloat(String(r.en).replace(",", ".")) || 0) * 10) : null,
        heightMm: r.boy !== "" && r.boy != null ? Math.round((parseFloat(String(r.boy).replace(",", ".")) || 0) * 10) : null,
        colorName: String(r.farve || ""),
        // RUNDE 8 (delta §7 - "ingen bruger indtaster nogensinde en dato"):
        // builtAt er et tidsstempel sat af togglen, ikke et frit flueben -
        // bevar det eksisterende tidspunkt saa laenge fluebenet forbliver
        // taendt (undgaar at "gense samme dag" nulstiller historikken),
        // saet et nyt naar det lige er blevet taendt, og nulstil til null
        // naar det slukkes.
        builtAt: r.done ? (r.measurementId && eksisterendeBuiltAt.get(r.measurementId) ? eksisterendeBuiltAt.get(r.measurementId) : new Date()) : null
      };
      if (r.measurementId) {
        ops.push(prisma.measurement.update({ where: { id: r.measurementId }, data }));
      } else {
        // RUNDE 4 (§G3): productType er visningsnavnet ("Myggenet"), ikke
        // den interne "tur"-kode ("SINEKLIK") - se samme fix i LeadDetail.tsx/OpmaalingList.tsx.
        ops.push(prisma.measurement.create({ data: { ...data, leadId: order.leadId, itemNumber: nextItemNumber++, productType: TUR_LABEL[data.tur] || data.tur } }));
      }
    }
    if (ops.length > 0) {
      const results = await prisma.$transaction(ops);
      // RUNDE 7 (bugfix "autosave-loop"): rapportér KUN raekker der reelt
      // fik en NY measurementId (dvs. de havde ingen paa forhaand). Foer
      // denne rettelse blev ALLE raekker (ogsaa dem der blot blev
      // opdateret) lagt i savedRows, hvilket fik klienten til at kalde
      // setRows() med en frisk array-reference paa hvert eneste gem - som
      // trigger'ede autosave-effekten igen, som gemte igen, i det
      // uendelige ("Ændringer gemt automatisk" der aldrig stoppede).
      rows.forEach((r, i) => {
        if (r.measurementId) return; // havde allerede en id - intet at rapportere
        const m: any = results[offset + i];
        if (m?.id) savedRows.push({ clientKey: r.clientKey, measurementId: m.id });
      });
    }
  }

  const orderData: any = { productsTotal, installationTotal, estimatedTotal: productsTotal + installationTotal };
  await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
  if (items.length > 0) {
    orderData.items = {
      create: items.map((it: any) => ({
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
  }
  const updated = await prisma.order.update({
    where: { id: order.id },
    data: orderData,
    include: { items: true, lead: { include: { measurements: { orderBy: [{ itemNumber: "asc" }, { createdAt: "asc" }] } } } }
  });

  return NextResponse.json({
    order: {
      id: updated.id, orderNumber: updated.orderNumber, firstName: updated.firstName, lastName: updated.lastName,
      phone: updated.phone, address: updated.address, postalCode: updated.postalCode, city: updated.city,
      wantsInstallation: updated.wantsInstallation, stage: updated.stage
    },
    measurements: updated.lead?.measurements || [],
    savedRows,
    items: updated.items
  });
}
