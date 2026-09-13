// FASE 2 - rollebaseret adgang, jf. Myggestop - Arkitektur-specifikation.md §4/§5.
// Eet centralt sted der definerer hvilke /admin-ruter de enkelte roller
// maa se, saa middleware.ts og AdminNav.tsx bruger nøjagtig samme regel.
import type { Role } from "@prisma/client";

// BUILDER og INSTALLER faar (indtil videre) kun adgang til
// Produktionsberegneren og dens to tilhoerende sider (Faerdig/Afsluttede
// ordrer) - jf. §4: "Genbrug komponenten 1:1 ... giv installatoeren
// noejagtig samme adgang som Builder til /admin/imalat". Opmaalings- og
// installationslister kommer foerst i Fase 3/4.
const SHARED_PRODUCTION_PREFIXES = ["/admin/imalat", "/admin/faerdig", "/admin/afsluttede"];

export function isPathAllowedForRole(pathname: string, role: Role): boolean {
  if (role === "COORDINATOR") return true;
  return SHARED_PRODUCTION_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

// Hvor en rolle sendes hen efter login, eller naar den rammer en side
// den ikke maa se.
export function defaultHomeForRole(role: Role): string {
  if (role === "COORDINATOR") return "/admin";
  // §5 foreskriver /admin/opmaaling for INSTALLER, men den side
  // bygges foerst i Fase 3. Indtil da er /admin/imalat baade BUILDER
  // og INSTALLER's eneste (og dermed ogsaa deres standard-) side.
  return "/admin/imalat";
}
