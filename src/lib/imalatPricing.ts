// RUNDE 9 ("man skal kunne indtaste alle information omkring ordren, per
// produkt, inkl. mål/type... så prisen automatisk udregnes her"): udtrukket
// fra ImalatCalc.tsx's tidligere INTERNE (kun klient-side) priceOf()-
// funktion, så både Produktionsberegneren og den nye manuelle
// ordre-oprettelse (server + klient) bruger PRÆCIS samme prisformel -
// "et faktum lever kun ét sted" udvidet til prisberegning, samme princip
// som cuttingList.ts allerede bruger for selve skærelisten.
//
// VIGTIGT: dette er en ren beregningsfunktion (ingen fetch/IO), så den
// trygt kan importeres fra en Next.js API-route (server) OG en "use
// client"-komponent (browser) uden problemer.

export type ImalatRates = { tek19: number; tek28: number; dub19: number; dub28: number };

export const DEFAULT_IMALAT_RATES: ImalatRates = { tek19: 400, tek28: 450, dub19: 500, dub28: 550 };
export const DEFAULT_GARDIN_RATE = 400;

// Samme montering-formel som ImalatCalc.tsx hidtil har haft hardkodet
// ("500 kr opstart + 100 kr × antal stk.") - flyttet hertil og gjort
// indstillelig via Priser & gebyrer (installationBaseFee/installationPerProduct),
// så der kun findes ÉT sted denne formel er defineret/redigerbar, ikke to
// forskellige (den gamle pricing.ts-variant og denne) der kunne løbe fra
// hinanden. Default-værdierne matcher den hidtidige hardkodede adfærd.
export const DEFAULT_MONTERING_BASE_FEE = 500;
export const DEFAULT_MONTERING_PER_UNIT = 100;

export interface PriceableRow {
  tur: string; // SINEKLIK | PERDE | KOMBI
  sys: string; // 1,9 | 2,8
  tip: string; // TEK | DUBLE
  widthCm: number;
  heightCm: number;
  adet: number;
  colorSurchargePerSqm: number; // 0 hvis standardfarve/ingen farve
}

function ceilHalf(x: number): number {
  return x <= 0 ? 0 : Math.ceil((x - 1e-9) * 2) / 2;
}

export interface RowPriceResult {
  area: number; // eksakt areal i m² (uafrundet)
  m2: number; // afrundet op til nærmeste 0,5 m² - bruges til pris
  price: number; // total pris for linjen (alle "adet" inkl.)
  colorSurcharge: number; // heraf farvetillæg
}

// RUNDE 10 (§C/§E - op til tre farvevalg pr. linje: myggenet-farve,
// gardin-(stof)farve, gardin-stangfarve): prisformlen i priceOfRow kender
// fortsat kun ÉT samlet "colorSurchargePerSqm"-tal (uændret formel, lavere
// risiko) - denne hjælpefunktion er det ene sted der summerer de(t)
// relevante farvetillæg for en given "tur", så kaldere (manuel ordre,
// Lead-prisberegning, beregneren) ikke hver skal genopfinde reglen.
export interface ColorLike { name: string; surchargePerSqm: number; isStandard: boolean; category?: string }
export function sumColorSurcharge(
  colors: ColorLike[],
  sel: { colorName?: string; fabricColorName?: string; rodColorName?: string },
  tur: string
): number {
  const rel = tur === "PERDE" ? { net: false, stof: true, stang: true } : tur === "KOMBI" ? { net: true, stof: true, stang: false } : { net: true, stof: false, stang: false };
  let sum = 0;
  const add = (name: string | undefined, cat: string) => {
    if (!name) return;
    const c = colors.find((x) => x.name === name && (!x.category || x.category === cat));
    if (c && !c.isStandard) sum += c.surchargePerSqm || 0;
  };
  if (rel.net) add(sel.colorName, "MYGGENET");
  if (rel.stof) add(sel.fabricColorName, "GARDIN_STOF");
  if (rel.stang) add(sel.rodColorName, "GARDIN_STANG");
  return sum;
}

/** Slår den korrekte kr/m²-sats op for myggenet ud fra sys+tip. */
export function mygRateOf(sys: string, tip: string, rates: ImalatRates): number {
  return tip === "TEK" ? (sys === "1,9" ? rates.tek19 : rates.tek28) : (sys === "1,9" ? rates.dub19 : rates.dub28);
}

/**
 * Beregner prisen for én produktlinje - identisk formel til ImalatCalc.tsx's
 * tidligere interne priceOf(): myggenet/gardin/kombi (dobbelt pris), farve-
 * tillæg pr. m², oprundet til nærmeste 0,5 m².
 */
export function priceOfRow(row: PriceableRow, rates: ImalatRates, gardinRate: number): RowPriceResult | null {
  const en = row.widthCm, boy = row.heightCm, adet = Math.max(1, Math.round(row.adet) || 1);
  if (en <= 0 || boy <= 0) return null;
  const area = (en / 100) * (boy / 100);
  const m2 = ceilHalf(area);
  const colorPerSqm = row.colorSurchargePerSqm || 0;

  if (row.tur === "PERDE") {
    const price = m2 * (gardinRate + colorPerSqm) * adet;
    return { area, m2, price, colorSurcharge: m2 * colorPerSqm * adet };
  }
  const mygPrice = m2 * (mygRateOf(row.sys, row.tip, rates) + colorPerSqm) * adet;
  if (row.tur === "KOMBI") {
    return { area, m2, price: mygPrice * 2, colorSurcharge: m2 * colorPerSqm * adet * 2 };
  }
  return { area, m2, price: mygPrice, colorSurcharge: m2 * colorPerSqm * adet };
}

/** Samlet monteringsgebyr ud fra antal fysiske enheder (adet summeret over alle linjer). */
export function calcMonteringFee(unitCount: number, wantsInstallation: boolean, baseFee: number, perUnit: number): number {
  if (!wantsInstallation || unitCount <= 0) return 0;
  return baseFee + perUnit * unitCount;
}
