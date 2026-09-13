import ProduktionList from "@/components/admin/ProduktionList";
import InstallationList from "@/components/admin/InstallationList";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// RUNDE 2 (Q8): Installer havde tidligere to separate, overlappende
// fane-punkter ("Produktionskø" og "Installation") for to lister der reelt
// er to faser af samme arbejde for ham. Denne side samler dem ét sted,
// bag ét menupunkt ("Produktion & installation") - Coordinator og Builder
// beholder deres to separate sider/menupunkter helt uændret (roles.ts/
// AdminNav.tsx), jf. brugerens eksplicitte svar: "to for Coordinator/
// Builder, ét samlet for Installer". Genbruger de to eksisterende,
// allerede fungerende listekomponenter uændret - ingen duplikeret logik.
export default async function Page() {
  const session = await getSession();
  return (
    <div className="space-y-10">
      <ProduktionList role={session?.role} />
      <div className="border-t border-brand-line pt-8">
        <InstallationList />
      </div>
    </div>
  );
}
