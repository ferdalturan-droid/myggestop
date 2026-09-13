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
const BUILDER_PREFIXES = ["/admin/imalat", "/admin/faerdig", "/admin/afsluttede", "/admin/produktion", "/admin/kalender"];

// INSTALLER: samme som Builder, plus opmaalings- og installationslisten,
// den samlede produktion+installation-visning (Q8), og - RUNDE 2 - fuld
// adgang til ordrelisten/detaljen/redigering, da han (jf. brugerens egen
// procesbeskrivelse: "kun installer/coordinator kan redigere ordren") skal
// kunne redigere en ordre paa lige fod med Coordinator (haandhaevet paa
// API-niveau i /api/orders/[id] og /api/orders/[id]/production).
const INSTALLER_PREFIXES = [
  ...BUILDER_PREFIXES,
  "/admin/opmaaling",
  "/admin/installation",
  "/admin/kalender",
  "/admin/ordrer",
  "/admin/produktion-installation"
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

export function isPathAllowedForRole(pathname: string, role: Role): boolean {
  if (role === "COORDINATOR") return true;
  if (role === "BUILDER") {
    if (ORDER_DETAIL_ONLY.test(pathname)) return true;
    return matches(pathname, BUILDER_PREFIXES);
  }
  return matches(pathname, INSTALLER_PREFIXES); // INSTALLER
}

// Hvor en rolle sendes hen efter login, eller naar den rammer en side
// den ikke maa se. Jf. §5.
export function defaultHomeForRole(role: Role): string {
  if (role === "COORDINATOR") return "/admin";
  // RUNDE 2: Builders naturlige udgangspunkt er nu hans arbejdskoe
  // (Produktionskø), ikke en tom beregner - han kan stadig naa
  // Produktionsberegneren og Faerdig-listen via menuen.
  if (role === "BUILDER") return "/admin/produktion";
  // RUNDE 6: Installatørens samlede arbejdsside (opmåling + klar til
  // installation + produktions-kontekst), ikke laengere kun opmålingslisten.
  return "/admin/produktion-installation"; // INSTALLER
}
