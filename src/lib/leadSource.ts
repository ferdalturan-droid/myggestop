// RUNDE 8 ("ikke frit tekstfelt men en liste rapporteringsmulighed for at
// se hvilken platform lead kom fra"): faste, rapporterbare kilde-
// kategorier. HJEMMESIDE sættes automatisk af webformularen
// (src/app/api/leads/route.ts / OrderForm.tsx-flowet) - alle andre vælges
// eksplicit af Koordinator ved manuel "Nyt lead"-oprettelse.
export const LEAD_SOURCE_LABEL: Record<string, string> = {
  HJEMMESIDE: "Hjemmeside",
  META: "Meta (Facebook/Instagram)",
  GOOGLE: "Google",
  HENVISNING: "Henvisning",
  PERSONLIG_KONTAKT: "Personlig kontakt",
  ANDET: "Andet"
};

// Rækkefølge i "Nyt lead"-formularens dropdown. HJEMMESIDE er bevidst ikke
// med her - den sættes kun automatisk, aldrig manuelt af Koordinator.
export const LEAD_SOURCE_MANUAL_OPTIONS: [string, string][] = [
  ["META", LEAD_SOURCE_LABEL.META],
  ["GOOGLE", LEAD_SOURCE_LABEL.GOOGLE],
  ["HENVISNING", LEAD_SOURCE_LABEL.HENVISNING],
  ["PERSONLIG_KONTAKT", LEAD_SOURCE_LABEL.PERSONLIG_KONTAKT],
  ["ANDET", LEAD_SOURCE_LABEL.ANDET]
];

export const LEAD_SOURCE_ALL: string[] = ["HJEMMESIDE", "META", "GOOGLE", "HENVISNING", "PERSONLIG_KONTAKT", "ANDET"];
