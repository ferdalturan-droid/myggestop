// ---------------------------------------------------------------------------
// Myggestop prisberegning (ren logik - bruges baade server- og klient-side)
// ---------------------------------------------------------------------------

export interface PricingConfig {
  coloredFrameSurchargePerSqm: number;
  doubleDoorSurcharge: number;
  installationBaseFee: number;
  installationPerProduct: number;
}

export interface ProductPricing {
  pricePerSqm: number;
  doubleDoorThresholdMm: number | null;
}

export interface ColorPricing {
  surchargePerSqm: number;
  isStandard: boolean;
}

export interface LineInput {
  widthMm: number;
  heightMm: number;
  product: ProductPricing;
  color?: ColorPricing | null;
}

export interface LineResult {
  exactAreaSqm: number; // praecist areal (kun til visning/reference)
  areaSqm: number; // afrundet op til naermeste 0,5 m2 - bruges til pris
  isDoubleDoor: boolean;
  baseTotal: number; // areal * pris pr. m2
  colorSurcharge: number; // farvetillaeg (pr. m2 * areal)
  doubleDoorSurcharge: number; // fast tillaeg
  lineTotal: number; // samlet for linjen (ekskl. montering)
}

/**
 * Kommerciel oprunding: rund ALTID OP til naermeste 0,5 m2.
 * Eksempler: 1,25 -> 1,5 | 1,80 -> 2,0 | 2,08 -> 2,5 | 2,88 -> 3,0
 */
export function roundUpToHalf(value: number): number {
  if (value <= 0) return 0;
  // Brug et lille epsilon sa f.eks. praecis 2,0 ikke ryger op til 2,5 pga. flydetal.
  const eps = 1e-9;
  return Math.ceil((value - eps) * 2) / 2;
}

/** Areal i m2 ud fra mm (uafrundet). */
export function exactAreaSqm(widthMm: number, heightMm: number): number {
  const w = Math.max(0, widthMm) / 1000;
  const h = Math.max(0, heightMm) / 1000;
  return w * h;
}

export function isDoubleDoor(widthMm: number, product: ProductPricing): boolean {
  if (product.doubleDoorThresholdMm == null) return false;
  return widthMm > product.doubleDoorThresholdMm;
}

export function calcLine(input: LineInput, config: PricingConfig): LineResult {
  const { widthMm, heightMm, product, color } = input;
  const exact = exactAreaSqm(widthMm, heightMm);
  const area = roundUpToHalf(exact);

  const baseTotal = round2(area * product.pricePerSqm);

  // Farvetillaeg: brug farvens egen sats hvis sat, ellers globalt tillaeg for ikke-standardfarve.
  let colorPerSqm = 0;
  if (color && !color.isStandard) {
    colorPerSqm = color.surchargePerSqm > 0 ? color.surchargePerSqm : config.coloredFrameSurchargePerSqm;
  }
  const colorSurcharge = round2(area * colorPerSqm);

  const dbl = isDoubleDoor(widthMm, product);
  const doubleDoorSurcharge = dbl ? config.doubleDoorSurcharge : 0;

  const lineTotal = round2(baseTotal + colorSurcharge + doubleDoorSurcharge);

  return {
    exactAreaSqm: round3(exact),
    areaSqm: area,
    isDoubleDoor: dbl,
    baseTotal,
    colorSurcharge,
    doubleDoorSurcharge,
    lineTotal
  };
}

export interface OrderTotals {
  productsTotal: number;
  installationTotal: number;
  estimatedTotal: number;
  itemCount: number;
}

export function calcInstallation(
  itemCount: number,
  wantsInstallation: boolean,
  config: PricingConfig
): number {
  if (!wantsInstallation || itemCount <= 0) return 0;
  return round2(config.installationBaseFee + config.installationPerProduct * itemCount);
}

export function calcOrderTotals(
  lines: LineResult[],
  wantsInstallation: boolean,
  config: PricingConfig
): OrderTotals {
  const productsTotal = round2(lines.reduce((s, l) => s + l.lineTotal, 0));
  const installationTotal = calcInstallation(lines.length, wantsInstallation, config);
  return {
    productsTotal,
    installationTotal,
    estimatedTotal: round2(productsTotal + installationTotal),
    itemCount: lines.length
  };
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
function round3(n: number): number {
  return Math.round((n + Number.EPSILON) * 1000) / 1000;
}

/** Formater DKK pa dansk: 1.234,50 kr. */
export function formatDKK(n: number): string {
  return (
    new Intl.NumberFormat("da-DK", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(n) + " kr."
  );
}
