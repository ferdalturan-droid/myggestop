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

/**
 * RUNDE 2 (§11.2): denne funktion viste TIDLIGERE "Opmålt" saa snart BARE
 * ÉN linje havde begge maal udfyldt - det er netop den fejl §6.2a advarer
 * imod (et lead med 3 forventede linjer, hvor kun een er maalt, saa
 * fejlagtigt ud som faerdigt opmaalt). Beholdt her udelukkende som en
 * "er der overhovedet indtastet noget?"-hjaelper til UI-visning et andet
 * sted - den maa ALDRIG bruges til at afgoere om opmaalingen er faerdig.
 * Det goer KUN Lead.measuredAt (eksplicit signeret af installatoeren).
 */
export function harReelMaaling(measurements: MeasurementLike[]): boolean {
  return measurements.some((m) => m.widthMm != null && m.heightMm != null);
}

/**
 * Afledt visningsstatus: viser "Opmålt" i stedet for "Opmåling booket" KUN
 * naar installatoeren eksplicit har sat measuredAt (§6.2a/§11.2) - ikke
 * baseret paa om nogle Measurement-raekker tilfaeldigvis har udfyldte tal.
 */
export function deriveLeadStatusLabel(stage: string, measuredAt: Date | string | null | undefined): string {
  if (stage === "OPMAALING_BOOKET" && measuredAt) return "Opmålt";
  return LEAD_STAGE_LABELS[stage] || stage;
}
