import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { nextOrderNumber } from "@/lib/orderNumber";
import { getSetting } from "@/lib/settings";
import { calcInstallation } from "@/lib/pricing";
import { priceOfRow, DEFAULT_IMALAT_RATES, DEFAULT_GARDIN_RATE, ImalatRates } from "@/lib/imalatPricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ManualItem {
  roomName?: string;
  productName: string;
  widthMm: number;
  heightMm: number;
  colorName?: string;
  comment?: string;
  lineTotal: number;
}

// RUNDE 9 ("man skal kunne indtaste alle information omkring ordren, per
// produkt, inkl. mål/type... så prisen automatisk udregnes her"): en
// fuld produktionsberegner-linje - samme felter som ImalatCalc's Row -
// prisen udregnes HER (server-side), aldrig indtastet af brugeren.
interface ManualRow {
  roomName?: string;
  tur: string; // SINEKLIK | PERDE | KOMBI
  sys: string; // 1,9 | 2,8
  tip: string; // TEK | DUBLE
  layout?: string; // YANA | AŞAĞI
  kanat?: string; // HAREKETLI | SABIT
  adet: number;
  widthMm: number;
  heightMm: number;
  colorName?: string;
  comment?: string;
}

async function loadImalatRates(): Promise<{ rates: ImalatRates; gardinRate: number }> {
  const [sineklikRow, perdeRow] = await Promise.all([
    prisma.setting.findUnique({ where: { key: "prod_rates_sineklik" } }),
    prisma.setting.findUnique({ where: { key: "prod_rates_perde" } })
  ]);
  const rates: ImalatRates =
    sineklikRow?.value && typeof sineklikRow.value === "object" && !Array.isArray(sineklikRow.value)
      ? { ...DEFAULT_IMALAT_RATES, ...(sineklikRow.value as any) }
      : DEFAULT_IMALAT_RATES;
  const gardinRate = typeof perdeRow?.value === "number" ? perdeRow.value : DEFAULT_GARDIN_RATE;
  return { rates, gardinRate };
}

// Opretter (eller opdaterer) en ordre direkte fra Produktionsberegneren
// ELLER fra den manuelle ordre-formular (Koordinator/Installer). Opretter
// ALDRIG et Lead (RUNDE 9: "derudover når man opretter en manuel ordre, så
// oprettes en lead med reference, dette giver ikke mening da årsagen til
// en manuel ordre er at man bypasser lead processen") - produktlinjer
// hænger i stedet direkte paa Order via Measurement.orderId og OrderItem.
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const b = await req.json().catch(() => ({}));

  const musteri = String(b.musteri || "").trim();
  if (!musteri) return NextResponse.json({ error: "Kundens navn mangler." }, { status: 400 });

  const rows: ManualRow[] = Array.isArray(b.rows) ? b.rows : [];
  const legacyItems: ManualItem[] = Array.isArray(b.items) ? b.items : [];

  let itemsCreate: any[] = [];
  let measurementsCreate: any[] = [];
  let productsTotal = 0;

  if (rows.length > 0) {
    // RUNDE 9: den nye vej - fulde beregner-felter, pris udregnet server-side.
    const { rates, gardinRate } = await loadImalatRates();
    const colors = await prisma.color.findMany();
    let itemNumber = 1;
    for (const r of rows) {
      const widthMm = Math.max(0, Math.round(Number(r.widthMm) || 0));
      const heightMm = Math.max(0, Math.round(Number(r.heightMm) || 0));
      const adet = Math.max(1, Math.round(Number(r.adet) || 1));
      const tur = r.tur === "PERDE" || r.tur === "KOMBI" ? r.tur : "SINEKLIK";
      const sys = r.sys === "2,8" ? "2,8" : "1,9";
      const tip = r.tip === "DUBLE" ? "DUBLE" : "TEK";
      const layout = r.layout === "AŞAĞI" ? "AŞAĞI" : "YANA";
      const kanat = r.kanat === "SABIT" ? "SABIT" : "HAREKETLI";
      const colorName = r.colorName || "";
      const col = colors.find((c) => c.name === colorName);
      const colorSurchargePerSqm = col && !col.isStandard ? col.surchargePerSqm : 0;

      const priced = priceOfRow(
        { tur, sys, tip, widthCm: widthMm / 10, heightCm: heightMm / 10, adet, colorSurchargePerSqm },
        rates,
        gardinRate
      );
      const lineTotal = priced ? Math.round(priced.price * 100) / 100 : 0;
      productsTotal += lineTotal;

      const productName = tur === "PERDE" ? "Gardin" : tur === "KOMBI" ? "Myggenet & Plisser" : "Myggenet";
      itemsCreate.push({
        roomName: r.roomName || "",
        productName,
        widthMm,
        heightMm,
        colorName,
        comment: r.comment || "",
        isDoubleDoor: false,
        areaSqm: priced ? priced.m2 : 0,
        lineTotal
      });
      measurementsCreate.push({
        itemNumber: itemNumber++,
        roomName: r.roomName || "",
        productType: productName,
        widthMm,
        heightMm,
        colorName,
        comment: r.comment || "",
        tur, sys, tip, layout, kanat, adet
      });
    }
    if (itemsCreate.length === 0) return NextResponse.json({ error: "Ingen produkter at gemme." }, { status: 400 });
  } else {
    // Bagudkompatibel: den gamle vej hvor Produktionsberegneren selv har
    // udregnet priserne (dens interne "Gem"-flow, uændret adfærd).
    if (legacyItems.length === 0) return NextResponse.json({ error: "Ingen produkter at gemme." }, { status: 400 });
    productsTotal = legacyItems.reduce((s, it) => s + (Number(it.lineTotal) || 0), 0);
    itemsCreate = legacyItems.map((it) => ({
      roomName: it.roomName || "",
      productName: it.productName,
      widthMm: Math.max(0, Math.round(Number(it.widthMm) || 0)),
      heightMm: Math.max(0, Math.round(Number(it.heightMm) || 0)),
      colorName: it.colorName || "",
      comment: it.comment || "",
      isDoubleDoor: false,
      areaSqm: Math.round(((Number(it.widthMm) || 0) / 1000) * ((Number(it.heightMm) || 0) / 1000) * 100) / 100,
      lineTotal: Number(it.lineTotal) || 0
    }));
  }

  const spaceIdx = musteri.indexOf(" ");
  const firstName = spaceIdx === -1 ? musteri : musteri.slice(0, spaceIdx);
  const lastName = spaceIdx === -1 ? "" : musteri.slice(spaceIdx + 1);

  // RUNDE 9: montering ja/nej + levering er reelle ordre-niveau-valg, ogsaa
  // for en manuel ordre - monteringstillæg beregnes her, aldrig indtastet.
  const wantsInstallation = !!b.wantsInstallation;
  const deliveryMethod = b.deliveryMethod === "FRAGTES" ? "FRAGTES" : "AFHENTER_SELV";
  const shippingCost = !wantsInstallation && deliveryMethod === "FRAGTES" && typeof b.shippingCost === "number" ? Math.max(0, b.shippingCost) : null;
  const pricing = await getSetting("pricing");
  const installationTotal = calcInstallation(itemsCreate.length, wantsInstallation, pricing);

  const orderFields = {
    firstName,
    lastName,
    phone: String(b.tel || ""),
    email: String(b.email || ""),
    address: String(b.adres || ""),
    postalCode: String(b.postalCode || ""),
    city: String(b.city || ""),
    note: b.note || "Oprettet manuelt (bypass af lead-processen).",
    source: typeof b.source === "string" ? b.source : "",
    wantsInstallation,
    deliveryMethod,
    shippingCost,
    productsTotal,
    installationTotal,
    estimatedTotal: productsTotal + installationTotal
  };

  try {
    if (b.orderId) {
      const existing = await prisma.order.findUnique({ where: { id: b.orderId } });
      if (!existing) return NextResponse.json({ error: "Ordre ikke fundet." }, { status: 404 });
      await prisma.orderItem.deleteMany({ where: { orderId: b.orderId } });
      if (measurementsCreate.length > 0) await prisma.measurement.deleteMany({ where: { orderId: b.orderId } });
      const order = await prisma.order.update({
        where: { id: b.orderId },
        data: {
          ...orderFields,
          items: { create: itemsCreate },
          ...(measurementsCreate.length > 0 ? { measurements: { create: measurementsCreate } } : {})
        },
        include: { items: true }
      });
      return NextResponse.json({ ok: true, orderId: order.id, orderNumber: order.orderNumber });
    }

    const orderNumber = await nextOrderNumber();
    const order = await prisma.order.create({
      data: {
        orderNumber,
        ...orderFields,
        items: { create: itemsCreate },
        ...(measurementsCreate.length > 0 ? { measurements: { create: measurementsCreate } } : {})
      },
      include: { items: true }
    });
    return NextResponse.json({ ok: true, orderId: order.id, orderNumber: order.orderNumber });
  } catch (e: any) {
    console.error("Manuel ordre fejl:", e);
    return NextResponse.json({ error: e?.message || "Serverfejl" }, { status: 500 });
  }
}
