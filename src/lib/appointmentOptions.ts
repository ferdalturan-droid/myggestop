// RUNDE 3: delte konstanter for kalenderens opgavetyper, saa
// KalenderList.tsx og API-ruterne bruger praecis de samme labels/regler
// ét sted (samme princip som calcOptions.ts for beregneren).
export const APPT_TYPE_LABEL: Record<string, string> = {
  MAALING: "Opmåling",
  INSTALLATION: "Installation",
  PRODUKTION: "Produktion",
  ORDRE: "Ordre"
};

export const APPT_TYPE_OPTIONS: [string, string][] = [
  ["MAALING", "Opmåling"],
  ["INSTALLATION", "Installation"],
  ["PRODUKTION", "Produktion"],
  ["ORDRE", "Ordre"]
];

// Hver opgavetype hoerer naturligt til én ressource - saettes automatisk
// naar Coordinator vaelger type i "+ Ny aftale", saa der ikke kan opstaa
// en Opmåling-opgave der fejlagtigt ligger paa Byggerens kalender.
export const APPT_TYPE_RESOURCE: Record<string, string | null> = {
  MAALING: "INSTALLER",
  INSTALLATION: "INSTALLER",
  PRODUKTION: "BUILDER",
  ORDRE: null
};

export const RESOURCE_LABEL: Record<string, string> = {
  BUILDER: "Bygger",
  INSTALLER: "Installatør"
};
