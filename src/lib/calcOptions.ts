// RUNDE 2 (§11.3): delte valgmuligheder for tur/sys/tip/layout/kanat -
// nøjagtig de samme værdier ImalatCalc.tsx allerede bruger. Defineres ÉT
// sted og genbruges i ImalatCalc.tsx, OpmaalingList.tsx og LeadDetail.tsx,
// så installatøren/koordinator kan indtaste den fulde beregner-konfiguration
// direkte på en Measurement-linje, ikke kun bredde/højde.
export const TUR_LABEL: Record<string, string> = { SINEKLIK: "Myggenet", PERDE: "Gardin", KOMBI: "Myggenet & Plisser" };
export const TUR_OPTIONS: [string, string][] = [
  ["SINEKLIK", "Myggenet"],
  ["PERDE", "Gardin"],
  ["KOMBI", "Myggenet & Plisser"]
];

// RUNDE 10 (§C - brugerens fire kategorier "Dobbelt myggenet"/"Single
// myggenet"/"Myggenet & Plisser"/"Gardin"): de to første er samme "tur"
// (SINEKLIK), kun adskilt af "tip" (Enkelt/Dobbelt) - denne kombinerede
// liste bruges hvor et enkelt, brugervendt "Produkttype"-valg giver mere
// mening end to separate dropdowns (tur + tip). value er "tur|tip".
export const PRODUCT_CATEGORY_OPTIONS: [string, string][] = [
  ["SINEKLIK|TEK", "Myggenet (enkelt)"],
  ["SINEKLIK|DUBLE", "Myggenet (dobbelt)"],
  ["KOMBI|TEK", "Myggenet & Plisser"],
  ["PERDE|TEK", "Gardin"]
];
export function categoryKey(tur: string, tip: string): string {
  return tur === "SINEKLIK" ? `SINEKLIK|${tip === "DUBLE" ? "DUBLE" : "TEK"}` : `${tur}|TEK`;
}

// RUNDE 10 (§E - "profilstørrelse skal oprettes i et bibliotek"): dette er
// nu KUN fallback-default, hvis /api/profile-sizes endnu ikke er hentet -
// selve dropdown-listen i UI'en henter fra biblioteket (se ProfileSize-
// modellen), saa den kan vedligeholdes uden en ny deploy.
export const SYS_OPTIONS: string[] = ["1,9", "2,8"];

export const TIP_LABEL: Record<string, string> = { TEK: "Enkelt", DUBLE: "Dobbelt" };
export const TIP_OPTIONS: [string, string][] = [
  ["TEK", "Enkelt"],
  ["DUBLE", "Dobbelt"]
];

// RUNDE 10 (§C - brugerens "Retning: Nedvendt/Sidevendt", gælder nu ALLE
// fire kategorier, inkl. Gardin - tidligere kun Myggenet/Kombi): omdøbt
// fra "Side"/"Ned" til de eksakte termer brugeren angav.
export const LAYOUT_LABEL: Record<string, string> = { YANA: "Sidevendt", "AŞAĞI": "Nedvendt" };
export const LAYOUT_OPTIONS: [string, string][] = [
  ["YANA", "Sidevendt"],
  ["AŞAĞI", "Nedvendt"]
];

export const KANAT_LABEL: Record<string, string> = { HAREKETLI: "Bevægelig", SABIT: "Fast" };
export const KANAT_OPTIONS: [string, string][] = [
  ["HAREKETLI", "Bevægelig"],
  ["SABIT", "Fast"]
];

// RUNDE 10 (§C - nyt felt "undertype: Lavprofil/Normal", gælder alle fire
// kategorier).
export const SUBTYPE_LABEL: Record<string, string> = { LAVPROFIL: "Lavprofil", NORMAL: "Normal" };
export const SUBTYPE_OPTIONS: [string, string][] = [
  ["NORMAL", "Normal"],
  ["LAVPROFIL", "Lavprofil"]
];

// RUNDE 10 (§C - brugerens fulde dropdown-oversigt pr. kategori): "sys"
// (profilstørrelse) og "layout" (retning) gælder nu ALLE FIRE kategorier,
// inkl. Gardin (tidligere kun myggenet/kombi) - "tip" (enkelt/dobbelt)
// gælder KUN ren myggenet (Kombi/Gardin bruger "Fløj" (kanat) i stedet for
// at udtrykke bevægelig/fast). "kanat" (Fløj) gælder Kombi + Gardin, ikke
// ren myggenet - uændret fra tidligere.
export function felterRelevanteForTur(tur: string) {
  return {
    sys: true,
    tip: tur === "SINEKLIK",
    layout: true,
    kanat: tur !== "SINEKLIK"
  };
}

// RUNDE 10 (§C - "Myggenet Farve"/"Gardin Farve"/"Gardin Stang Farve" er
// forskellige felter afhængig af kategori): hvilke af de tre farvefelter
// (colorName=myggenet, fabricColorName=gardin-stof, rodColorName=gardin-
// stang) der skal vises for en given "tur".
export function farveFelterRelevanteForTur(tur: string) {
  return {
    net: tur === "SINEKLIK" || tur === "KOMBI",
    stof: tur === "KOMBI" || tur === "PERDE",
    stang: tur === "PERDE"
  };
}

// RUNDE 10 (§C - "tilføj alle relevante rum-optioner for et hjem"): fast
// liste, ikke et vedligeholdt bibliotek (brugeren bad specifikt om et
// bibliotek for Farver og Profilstørrelse, ikke Rum) - "Andet" tillader
// fortsat fri tekst, som forslag §5 i det forrige dokument nævnte.
export const ROOM_OPTIONS: string[] = [
  "Stue", "Køkken", "Udestue", "Entré", "Bryggers", "Kontor", "Soveværelse",
  "Værelse 1", "Værelse 2", "Værelse 3", "Bad/Toilet", "Altan/Terrasse", "Andet"
];
