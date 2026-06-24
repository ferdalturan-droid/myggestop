export const ORDER_STATUS_LABELS: Record<string, string> = {
  NY: "Ny ordre",
  UNDER_BEHANDLING: "Under behandling",
  TILBUD_SENDT: "Tilbud sendt",
  AFVENTER_KUNDE: "Afventer kunde",
  AFSLUTTET: "Afsluttet",
  ANNULLERET: "Annulleret"
};

export const ORDER_STATUS_ORDER = [
  "NY",
  "UNDER_BEHANDLING",
  "TILBUD_SENDT",
  "AFVENTER_KUNDE",
  "AFSLUTTET",
  "ANNULLERET"
] as const;

export const GALLERY_CATEGORIES = [
  { key: "vinduer", label: "Vinduer" },
  { key: "dore", label: "Dore" },
  { key: "dobbeltdore", label: "Dobbeltdore" },
  { key: "plisse", label: "Plise gardin" },
  { key: "videoer", label: "Videoer" }
] as const;
