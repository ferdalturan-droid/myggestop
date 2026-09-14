// RUNDE 3: delte konstanter for kalenderens opgavetyper, saa
// KalenderList.tsx og API-ruterne bruger praecis de samme labels/regler
// ét sted (samme princip som calcOptions.ts for beregneren).
export const APPT_TYPE_LABEL: Record<string, string> = {
  MAALING: "Opmåling",
  INSTALLATION: "Installation",
  PRODUKTION: "Produktion",
  ORDRE: "Ordre"
};

// RUNDE 5: "Ordre" fjernet som valgbar type ("fjern 'ordre' fra kalender
// typer" - Runde 4-instruktion, udestående til nu). APPT_TYPE_LABEL
// beholder ORDRE, saa aeldre allerede-oprettede aftaler af denne type
// fortsat vises korrekt, men den kan ikke laengere vaelges paa ny.
export const APPT_TYPE_OPTIONS: [string, string][] = [
  ["MAALING", "Opmåling"],
  ["INSTALLATION", "Installation"],
  ["PRODUKTION", "Produktion"]
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

// RUNDE 7 (§"in the calendar it is hard to know hat hoes where for wht"):
// hver opgavetype faar en fast farve, brugt konsekvent som venstre-kant og
// prik i kalenderens legend, saa man med et blik kan se HVAD en aftale
// drejer sig om uden at laese teksten foerst.
export const APPT_TYPE_COLOR: Record<string, { border: string; dot: string }> = {
  MAALING: { border: "border-l-sky-500", dot: "bg-sky-500" },
  INSTALLATION: { border: "border-l-violet-500", dot: "bg-violet-500" },
  PRODUKTION: { border: "border-l-amber-500", dot: "bg-amber-500" },
  ORDRE: { border: "border-l-brand-line", dot: "bg-brand-ink2/40" }
};
export const FRI_AFTALE_COLOR = { border: "border-l-slate-300", dot: "bg-slate-300" };
