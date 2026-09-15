// RUNDE 10 (§H - "installatøren har bekræftet opmåling, skal pris sættes
// på LEAD... systemet kan allerede beregne pris... brug det"): ét sted der
// beregner den autoritative pris for ÉN Measurement-række, ved at genbruge
// den allerede eksisterende delte formel (imalatPricing.ts) - "et faktum
// lever kun ét sted" udvidet til nu ogsaa at gaelde selve Measurement-
// raekken (ikke kun den manuelle ordre-rute/beregneren).
import { prisma } from "@/lib/prisma";
import { priceOfRow, sumColorSurcharge, DEFAULT_IMALAT_RATES, DEFAULT_GARDIN_RATE, ImalatRates } from "@/lib/imalatPricing";

export interface MeasurementLike {
  tur: string;
  sys: string;
  tip: string;
  widthMm: number | null;
  heightMm: number | null;
  adet: number;
  colorName?: string | null;
  fabricColorName?: string | null;
  rodColorName?: string | null;
}

export async function loadImalatRatesAndColors(): Promise<{ rates: ImalatRates; gardinRate: number; colors: any[] }> {
  const [sineklikRow, perdeRow, colors] = await Promise.all([
    prisma.setting.findUnique({ where: { key: "prod_rates_sineklik" } }),
    prisma.setting.findUnique({ where: { key: "prod_rates_perde" } }),
    prisma.color.findMany()
  ]);
  const rates: ImalatRates =
    sineklikRow?.value && typeof sineklikRow.value === "object" && !Array.isArray(sineklikRow.value)
      ? { ...DEFAULT_IMALAT_RATES, ...(sineklikRow.value as any) }
      : DEFAULT_IMALAT_RATES;
  const gardinRate = typeof perdeRow?.value === "number" ? perdeRow.value : DEFAULT_GARDIN_RATE;
  return { rates, gardinRate, colors };
}

/** Returnerer NULL hvis linjen endnu ikke har gyldige mål (ikke muligt at beregne endnu). */
export async function calcMeasurementLineTotal(m: MeasurementLike): Promise<number | null> {
  if (!m.widthMm || !m.heightMm || m.widthMm <= 0 || m.heightMm <= 0) return null;
  const { rates, gardinRate, colors } = await loadImalatRatesAndColors();
  const colorSurchargePerSqm = sumColorSurcharge(colors, { colorName: m.colorName || "", fabricColorName: m.fabricColorName || "", rodColorName: m.rodColorName || "" }, m.tur);
  const priced = priceOfRow(
    { tur: m.tur, sys: m.sys, tip: m.tip, widthCm: m.widthMm / 10, heightCm: m.heightMm / 10, adet: m.adet || 1, colorSurchargePerSqm },
    rates,
    gardinRate
  );
  return priced ? Math.round(priced.price * 100) / 100 : null;
}

// RUNDE 10 (§H - opfølgende selvhelbredende rettelse): "beregningsmekanismen
// skal bruges" antog implicit at ENHVER linjes calculatedLineTotal allerede
// var udfyldt på beregningstidspunktet. To huller i den antagelse fundet ved
// egen live-verifikation efter deploy (ikke rapporteret af brugeren endnu,
// men ville uundgåeligt være blevet det - "hvis du mangler et eneste
// detalje, vil jeg brokke mig"):
//  1) Målelinjer oprettet FØR denne rundes kode (al eksisterende data i
//     produktion) har calculatedLineTotal == null i databasen - det gamle
//     "|| 0"-fallback i PATCH /api/leads/[id] tolkede det stille som "0 kr",
//     saa et lead med reelle, gyldige mål kunne alligevel faa "Beregnet
//     pris: 0 kr." udelukkende fordi linjen var gammel.
//  2) Selv for NYE leads: hvis en linje tilføjes/rettes/slettes EFTER
//     "Markér opmåling færdig" allerede er trykket (f.eks. en rettelse),
//     blev lead.calculatedPriceDkk aldrig genberegnet - kun selve
//     null->true-overgangen udløste en beregning.
// Denne ene funktion løser begge: den genberegner (og reparerer i
// databasen, selvhelbredende for al gammel data) enhver linje der mangler
// en gemt calculatedLineTotal, summerer, og - hvis leadet allerede er
// markeret Opmålt - skriver den friske sum til lead.calculatedPriceDkk med
// det samme. Kaldes både fra leads/[id]-PATCH'en og fra alle tre
// measurements-endpoints (POST/PATCH/DELETE), så prisen ALTID er i sync
// med de linjer der reelt findes, uanset hvornår/i hvilken rækkefølge de
// blev oprettet eller rettet.
export async function recalcLeadCalculatedPrice(tx: any, leadId: string): Promise<number> {
  const lead = await tx.lead.findUnique({ where: { id: leadId }, select: { measuredAt: true } });
  const linjer = await tx.measurement.findMany({ where: { leadId } });
  let sum = 0;
  for (const m of linjer) {
    let total = m.calculatedLineTotal;
    if (total == null) {
      total = await calcMeasurementLineTotal(m);
      if (total != null) {
        // Selvhelbredende: reparerer gamle/manglende linjer permanent, saa
        // dette kun sker ÉN gang pr. linje, ikke ved hvert kald.
        await tx.measurement.update({ where: { id: m.id }, data: { calculatedLineTotal: total } });
      }
    }
    sum += total || 0;
  }
  if (lead?.measuredAt) {
    await tx.lead.update({ where: { id: leadId }, data: { calculatedPriceDkk: sum } });
  }
  return sum;
}
