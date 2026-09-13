// FASE 3 (§3.2): "current lead status" beregnes i applikationslaget, ALDRIG
// gemt redundant i databasen - samme moenster som Excel-loesningens
// "Current Lead Status"-formel.
export const LEAD_STAGE_LABELS: Record<string, string> = {
  NYT_LEAD: "Nyt lead",
  KONTAKTET: "Kontaktet",
  OPMAALING_BOOKET: "Opmåling booket",
  TILBUD_GIVET: "Tilbud givet",
  BEKRAEFTET: "Bekræftet"
};

export const LEAD_STAGE_ORDER = ["NYT_LEAD", "KONTAKTET", "OPMAALING_BOOKET", "TILBUD_GIVET", "BEKRAEFTET"];

export interface MeasurementLike {
  widthMm: number | null;
  heightMm: number | null;
}

/** true hvis mindst een linje har baade widthMm og heightMm udfyldt. */
export function harReelMaaling(measurements: MeasurementLike[]): boolean {
  return measurements.some((m) => m.widthMm != null && m.heightMm != null);
}

/**
 * Afledt visningsstatus: viser "Opmålt" i stedet for "Opmåling booket" naar
 * opmaalingen reelt er gjort (mindst een linje har begge maal udfyldt).
 */
export function deriveLeadStatusLabel(stage: string, measurements: MeasurementLike[]): string {
  if (stage === "OPMAALING_BOOKET" && harReelMaaling(measurements)) return "Opmålt";
  return LEAD_STAGE_LABELS[stage] || stage;
}
