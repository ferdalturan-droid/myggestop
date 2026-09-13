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

export const SYS_OPTIONS: string[] = ["1,9", "2,8"];

export const TIP_LABEL: Record<string, string> = { TEK: "Enkelt", DUBLE: "Dobbelt" };
export const TIP_OPTIONS: [string, string][] = [
  ["TEK", "Enkelt"],
  ["DUBLE", "Dobbelt"]
];

export const LAYOUT_LABEL: Record<string, string> = { YANA: "Side", "AŞAĞI": "Ned" };
export const LAYOUT_OPTIONS: [string, string][] = [
  ["YANA", "Side"],
  ["AŞAĞI", "Ned"]
];

export const KANAT_LABEL: Record<string, string> = { HAREKETLI: "Bevægelig", SABIT: "Fast" };
export const KANAT_OPTIONS: [string, string][] = [
  ["HAREKETLI", "Bevægelig"],
  ["SABIT", "Fast"]
];

// Hvilke af de fem felter der er relevante afhænger af "tur", nøjagtig
// samme betingelser som i ImalatCalc.tsx's JSX (r.tur !== "PERDE" osv.).
export function felterRelevanteForTur(tur: string) {
  return {
    sys: tur !== "PERDE",
    tip: tur !== "PERDE",
    layout: tur !== "PERDE",
    kanat: tur !== "SINEKLIK"
  };
}
