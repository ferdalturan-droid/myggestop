// FASE 2/3/4 - rollebaseret adgang, jf. Myggestop - Arkitektur-specifikation.md §4/§5.
// Eet centralt sted der definerer hvilke /admin-ruter de enkelte roller
// maa se, saa middleware.ts og AdminNav.tsx bruger nøjagtig samme regel.
import type { Role } from "@prisma/client";

// BUILDER: Produktionsberegneren (+ Faerdig/Afsluttede, som hoerer til
// samme "gamle" produktionssystem, se §10.2) og sin egen produktionskoe.
const BUILDER_PREFIXES = ["/admin/imalat", "/admin/faerdig", "/admin/afsluttede", "/admin/produktion"];

// INSTALLER: samme som Builder (§4: "giv ham noejagtig samme adgang som
// Builder"), plus opmaalings- og installationslisten.
const INSTALLER_PREFIXES = [...BUILDER_PREFIXES, "/admin/opmaaling", "/admin/installation", "/admin/kalender"];

function matches(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function isPathAllowedForRole(pathname: string, role: Role): boolean {
  if (role === "COORDINATOR") return true;
  if (role === "BUILDER") return matches(pathname, BUILDER_PREFIXES);
  return matches(pathname, INSTALLER_PREFIXES); // INSTALLER
}

// Hvor en rolle sendes hen efter login, eller naar den rammer en side
// den ikke maa se. Jf. §5.
export function defaultHomeForRole(role: Role): string {
  if (role === "COORDINATOR") return "/admin";
  if (role === "BUILDER") return "/admin/imalat";
  return "/admin/opmaaling"; // INSTALLER
}
