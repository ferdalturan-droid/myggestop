// FASE 2/3/4 - rollebaseret adgang, jf. Myggestop - Arkitektur-specifikation.md §4/§5.
// Eet centralt sted der definerer hvilke /admin-ruter de enkelte roller
// maa se, saa middleware.ts og AdminNav.tsx bruger nøjagtig samme regel.
import type { Role } from "@prisma/client";

// BUILDER: Produktionsberegneren (+ Faerdig/Afsluttede, som hoerer til
// samme "gamle" produktionssystem, se §10.2) og sin egen produktionskoe.
//
// RUNDE 2 (§11.1/Gruppe 2): "/admin/imalat" er BEVIDST beholdt her, selvom
// §11.1 oprindeligt bad om at fjerne den - undersoegelsen af Q7 viste at
// den gamle Faerdig-liste (FaerdigList.tsx/AfsluttedeList.tsx, 11 reelle
// igangvaerende jobs) navigerer Builderen ind i netop denne rute for at
// aabne en gemt opgave i beregneren. At fjerne ruten helt ville have
// oedelagt et system brugeren eksplicit sagde IKKE maa toeres (Q7). Den
// egentlige pointe i §11.1 - at Builder ikke maa redigere en ORDRES
// officielle maal/pris via den ordre-koblede beregner (?orderId=) - er i
// stedet haandhaevet praecist der hvor det taeller: skrive-adgangen paa
// PATCH /api/orders/[id]/production er begraenset til COORDINATOR/INSTALLER
// (se den rute). Builder kan stadig AABNE ?orderId=-visningen (GET), men
// et forsoeg paa at gemme bliver afvist af API'et - server-haandhaevet,
// ikke kun en skjult knap.
// RUNDE 3: Builder faar nu ogsaa sin egen kalendervisning (skema for i
// dag/i morgen/ugen, read-only bortset fra sit eget "i gang"/"faerdig"-
// tryk paa produktionsopgaver) - /api/kalender begraenser server-side,
// hvad han rent faktisk faar tilbage (kun hans egne ressource-koblede
// aftaler), saa denne rute-adgang alene giver ham ikke andres kalender.
const BUILDER_PREFIXES = ["/admin/imalat", "/admin/faerdig", "/admin/afsluttede", "/admin/produktion", "/admin/kalender", "/admin/mine-opgaver"];

// INSTALLER: samme som Builder, plus opmaalings- og installationslisten og
// den samlede "Mine opgaver"-visning.
// RUNDE 8 (delta §1 - "Installer ser ALDRIG Coordinators ordreliste,
// ordre-detalje eller redigeringsformular. Installer ser ALDRIG leads."):
// "/admin/ordrer" er fjernet helt herfra. Ordre-kontekst til installation
// vises i stedet INDE i "Mine opgaver" (read-only, via OrderBuildDetails +
// selve installationskortet) - ikke som en separat side. Den eneste
// undtagelse er den snaevre manuelle ordre-oprettelse (justeret paa
// brugerens instruks: "only coordinator and installer can add this
// by-pass manual entry"), som har sin egen smalle rute - se
// ORDER_MANUAL_CREATE_ONLY nedenfor.
const INSTALLER_PREFIXES = [
  ...BUILDER_PREFIXES,
  "/admin/opmaaling",
  "/admin/installation",
  "/admin/kalender",
  "/admin/mine-opgaver"
];

function matches(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

// Kun én ordres detaljeside (praecis ét path-segment efter /admin/ordrer/),
// f.eks. /admin/ordrer/abc123 - IKKE /admin/ordrer (listen) og IKKE
// /admin/ordrer/abc123/rediger (redigeringsformularen). Bruges til at give
// Builder en read-only "alt hvad han skal bruge"-visning af den ordre han
// er ved at bygge, uden at aabne selve ordrelisten eller redigerings-UI'et
// for ham (§11.1/processen: "builder ser ordre+detaljer, read-only").
const ORDER_DETAIL_ONLY = /^\/admin\/ordrer\/[^/]+$/;

// RUNDE 8 (bruger: "in case customer is a friend or someone off-cycle, it
// should be possible to add a order manually... only coordinator and
// installer can add this by-pass manual entry"): en enkelt, eksakt sti -
// IKKE et praefiks - saa Installer faar adgang til netop denne handling
// uden at faa resten af ordre-omraadet aabnet ved en fejl.
const ORDER_MANUAL_CREATE_ONLY = "/admin/ordrer/ny";

export function isPathAllowedForRole(pathname: string, role: Role): boolean {
  if (role === "COORDINATOR") return true;
  if (role === "BUILDER") {
    if (ORDER_DETAIL_ONLY.test(pathname)) return true;
    return matches(pathname, BUILDER_PREFIXES);
  }
  if (pathname === ORDER_MANUAL_CREATE_ONLY) return true; // INSTALLER
  return matches(pathname, INSTALLER_PREFIXES); // INSTALLER
}

// Hvor en rolle sendes hen efter login, eller naar den rammer en side
// den ikke maa se. Jf. §5.
export function defaultHomeForRole(role: Role): string {
  if (role === "COORDINATOR") return "/admin";
  // RUNDE 8 (delta §1 - "Builder får samme side med kun fanerne I dag ·
  // Produktion"): Builder og Installer deler nu samme udgangspunkt.
  if (role === "BUILDER") return "/admin/mine-opgaver";
  return "/admin/mine-opgaver"; // INSTALLER
}
