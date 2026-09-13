// FASE 4 (§3.3): "Klar" og "Installeret" er afledte visninger (fra
// readyAt/installedAt), ikke selvstaendige OrderStage-vaerdier. Beregnes
// ALTID her, aldrig gemt redundant i databasen.
export const ORDER_STAGE_LABELS: Record<string, string> = {
  KOE: "I kø",
  I_PRODUKTION: "I produktion",
  BETALT: "Betalt",
  ANMELDT: "Anmeldt"
};

export interface OrderStageLike {
  stage: string;
  readyAt: Date | string | null;
  installedAt: Date | string | null;
}

export function deriveOrderStageLabel(order: OrderStageLike): string {
  if (order.stage === "BETALT" || order.stage === "ANMELDT") return ORDER_STAGE_LABELS[order.stage];
  if (order.installedAt) return "Installeret";
  if (order.readyAt) return "Klar";
  return ORDER_STAGE_LABELS[order.stage] || order.stage;
}
