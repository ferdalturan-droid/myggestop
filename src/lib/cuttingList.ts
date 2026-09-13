// RUNDE 6 (§"builder skal kunne trykke på en ordre også se alle detaljer
// omkring det de skal bygge og hvordan de bygger"): domænelogikken for
// skæreliste/tilskæring boede tidligere KUN inde i ImalatCalc.tsx (den nu
// fjernede "Produktionsberegner"-side) - udtrukket hertil ét sted, så
// både den interaktive beregner (redigering, Coordinator/Installer) og
// den nye read-only "byggedetaljer"-visning på ordresiden (alle roller,
// inkl. Bygger) bruger PRÆCIS samme beregning. "Et faktum lever kun ét
// sted" udvidet til at gælde afledte beregninger, ikke kun rå data.
export type Tur = "SINEKLIK" | "PERDE" | "KOMBI";
export type Sys = "1,9" | "2,8";
export type Tip = "TEK" | "DUBLE";
export type Layout = "YANA" | "AŞAĞI";
export type Kanat = "HAREKETLI" | "SABIT";

export interface CuttingRowInput {
  tur: string;
  sys: string;
  tip: string;
  layout: string;
  kanat: string;
  adet: number;
  widthMm: number | null;
  heightMm: number | null;
  colorName?: string;
}

export interface Part { label: string; qty: number; len?: number; kind: "cut" | "count" | "pile"; sys: string }

const TEK: Record<Sys, any> = { "1,9": { y5: 3.5, y6: 5.5, y7: 5.8, y8: 4, y9: 2.2, y12: 20, y13: 15 }, "2,8": { y5: 4, y6: 7.2, y7: 7.7, y8: 4.6, y9: 1.6, y12: 20, y13: 15 } };
const DUB: Record<Sys, any> = { "1,9": { y5: 3.7, y6: 5.7, y7: 5.8, y8: 4, y9: 2.2, y12: 54, y13: 5 }, "2,8": { y5: 4, y6: 7.2, y7: 7.5, y8: 4, y9: 2, y12: 52.5, y13: 5 } };
const ceil = (x: number) => Math.ceil(Math.round(x * 1e9) / 1e9);
export const fmtLen = (n: number) => (!isFinite(n) ? "-" : (Math.round(n * 100) / 100).toString().replace(".", ","));
const ceilHalf = (x: number) => (x <= 0 ? 0 : Math.ceil((x - 1e-9) * 2) / 2);
export const fmtKr = (n: number) => (Math.round(n * 100) / 100).toLocaleString("da-DK", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " kr";

const ORDER = ["RAMME BREDDE", "RAMME HØJDE", "FLØJ", "NET HØJDE", "BÅND", "PLISSE STRIMMEL", "MAGNET", "SNOR", "PLISSE SÆT", "GARDIN BREDDE", "ALUMINIUM PROFIL", "SELVKLÆBENDE STRIMMEL", "PILEANTAL"];

// Interne mål bruges i cm (samme konvention som ImalatCalc.tsx altid har haft) - Measurement/OrderItem gemmer mm, saa der konverteres ved kaldet.
function dimsCm(r: CuttingRowInput) {
  const en = (r.widthMm || 0) / 10, boy = (r.heightMm || 0) / 10, adet = Math.max(1, Math.round(r.adet) || 1);
  return { en, boy, adet };
}

function mygParts(r: CuttingRowInput): Part[] | null {
  const { en, boy, adet } = dimsCm(r);
  if (en <= 0 || boy <= 0) return null;
  const sys = (r.sys as Sys) || "1,9";
  const out: Part[] = [];
  const P = (label: string, qty: number, len: number | undefined, kind: Part["kind"]) => out.push({ label, qty, len, kind, sys });
  if (r.tip !== "DUBLE") {
    const s = TEK[sys]; let kasaEn, kasaBoy, kanat, tul, kat, ipBoy, ipAdet;
    if (r.layout !== "AŞAĞI") { kasaEn = en - s.y5; kasaBoy = boy - s.y6; kanat = boy - s.y7; tul = boy - s.y8; kat = en / s.y9; ipBoy = en + boy + s.y12; ipAdet = ceil((tul - 7) / 25) * adet; }
    else { kasaEn = en - s.y6; kasaBoy = boy - s.y5; kanat = en - s.y7; tul = en - s.y8; kat = boy / s.y9; ipBoy = en + boy + s.y13; ipAdet = ceil((tul - 7) / 26) * adet; }
    P("RAMME BREDDE", 2 * adet, kasaEn, "cut"); P("RAMME HØJDE", 2 * adet, kasaBoy, "cut"); P("FLØJ", adet, kanat, "cut"); P("NET HØJDE", adet, tul, "cut");
    P("SNOR", ipAdet, ipBoy, "cut"); P("BÅND", 2 * adet, tul, "cut"); P("PLISSE STRIMMEL", 2 * adet, tul, "cut"); P("PLISSE SÆT", adet, undefined, "count"); P("NET LAG", adet, kat, "pile");
  } else {
    const s = DUB[sys]; const kasaEn = en - s.y5, kasaBoy = boy - s.y6, kanat = boy - s.y7, tul = boy - s.y8, kat = (en / 2) / s.y9, ipBoy = en / 2 + boy + s.y12, ipAdet = ceil(((tul - 7) / (tul < 190 ? 28 : 25)) * 2) * adet, mik = boy - s.y13;
    P("RAMME BREDDE", 2 * adet, kasaEn, "cut"); P("RAMME HØJDE", 2 * adet, kasaBoy, "cut"); P("FLØJ", 2 * adet, kanat, "cut"); P("NET HØJDE", 2 * adet, tul, "cut");
    P("SNOR", ipAdet, ipBoy, "cut"); P("BÅND", 4 * adet, tul, "cut"); P("PLISSE STRIMMEL", 4 * adet, tul, "cut"); P("MAGNET", adet, mik, "cut"); P("PLISSE SÆT", 2 * adet, undefined, "count"); P("NET LAG", 2 * adet, kat, "pile");
  }
  return out;
}

function gardinParts(r: CuttingRowInput): Part[] | null {
  const { en, boy, adet } = dimsCm(r);
  if (en <= 0 || boy <= 0) return null;
  const off = r.kanat !== "SABIT" ? 0.4 : 2;
  const perdeEn = en - off, alumProfil = en - off, serit = en - off;
  const pile = boy / 2.2, alumAdet = 2 * adet, seritAdet = adet * 2, ipBoy = en + boy + 35;
  const out: Part[] = [];
  const P = (label: string, qty: number, len: number | undefined, kind: Part["kind"]) => out.push({ label, qty, len, kind, sys: "GARDIN" });
  P("GARDIN BREDDE", adet, perdeEn, "cut");
  P("ALUMINIUM PROFIL", alumAdet, alumProfil, "cut");
  P("SELVKLÆBENDE STRIMMEL", seritAdet, serit, "cut");
  P("SNOR", adet, ipBoy, "cut");
  P("PILEANTAL", adet, pile, "pile");
  return out;
}

export function partsFor(r: CuttingRowInput): Part[] | null {
  if (r.tur === "PERDE") return gardinParts(r);
  if (r.tur === "KOMBI") {
    const a = mygParts(r), b = gardinParts(r);
    if (!a && !b) return null;
    return [...(a || []), ...(b || [])];
  }
  return mygParts(r);
}

export interface CutAggRow { sys: string; label: string; len: number; qty: number }
export interface CountAggRow { sys: string; label: string; qty: number }

// Aggregerer skæreliste på tværs af alle linjer - samme "ens mål samles"-
// logik som ImalatCalc.tsx's Skæreliste (i alt).
export function aggregateCuttingList(rows: CuttingRowInput[]): { cutList: CutAggRow[]; counts: CountAggRow[] } {
  const cut: Record<string, CutAggRow> = {};
  const cnt: Record<string, number> = {};
  for (const r of rows) {
    const ps = partsFor(r);
    if (!ps) continue;
    for (const p of ps) {
      if (p.kind === "cut" && p.len !== undefined) {
        const k = `${p.sys}|${p.label}|${p.len.toFixed(2)}`;
        cut[k] = cut[k] || { sys: p.sys, label: p.label, len: p.len, qty: 0 };
        cut[k].qty += p.qty;
      } else if (p.kind === "count") {
        const k = `${p.sys}|${p.label}`;
        cnt[k] = (cnt[k] || 0) + p.qty;
      }
    }
  }
  const cutList = Object.values(cut).sort((a, b) => a.sys.localeCompare(b.sys) || ORDER.indexOf(a.label) - ORDER.indexOf(b.label) || a.len - b.len);
  const counts = Object.entries(cnt).map(([k, v]) => ({ sys: k.split("|")[0], label: k.split("|")[1], qty: v }));
  return { cutList, counts };
}
