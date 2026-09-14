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
  // RUNDE 9 ("hele 'installering' processen skal kun være en del af
  // processen hvis optionen der vælges er 'monteres = ja'"): naar en ordre
  // ikke skal monteres, forgrener visningen sig efter handedOverAt/
  // deliveryMethod i stedet for installedAt. Alle tre er valgfrie for
  // bagudkompatibilitet med steder der endnu kun kender de gamle felter.
  wantsInstallation?: boolean;
  handedOverAt?: Date | string | null;
  deliveryMethod?: string | null;
}

export function deriveOrderStageLabel(order: OrderStageLike): string {
  if (order.stage === "BETALT" || order.stage === "ANMELDT") return ORDER_STAGE_LABELS[order.stage];
  if (order.wantsInstallation === false) {
    if (order.handedOverAt) return order.deliveryMethod === "FRAGTES" ? "Sendt" : "Afhentet";
    if (order.readyAt) return order.deliveryMethod === "FRAGTES" ? "Klar til fragt" : "Klar til afhentning";
    return ORDER_STAGE_LABELS[order.stage] || order.stage;
  }
  if (order.installedAt) return "Installeret";
  if (order.readyAt) return "Klar";
  return ORDER_STAGE_LABELS[order.stage] || order.stage;
}
