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
