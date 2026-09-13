import ProduktionList from "@/components/admin/ProduktionList";
import InstallationList from "@/components/admin/InstallationList";
import OpmaalingList from "@/components/admin/OpmaalingList";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// RUNDE 2 (Q8): Installer havde tidligere to separate, overlappende
// fane-punkter ("Produktionskø" og "Installation") for to lister der reelt
// er to faser af samme arbejde for ham. Denne side samler dem ét sted,
// bag ét menupunkt ("Produktion & installation") - Coordinator og Builder
// beholder deres to separate sider/menupunkter helt uændret (roles.ts/
// AdminNav.tsx), jf. brugerens eksplicitte svar: "to for Coordinator/
// Builder, ét samlet for Installer".
//
// RUNDE 6: udvidet til Installatørens fulde arbejdsside med tre klart
// adskilte sektioner, jf. den nye procesbeskrivelse:
// 1) Opmålinger der skal laves (uændret OpmaalingList).
// 2) Klar til installation - hans egentlige handling: åbn ordren og
//    bekræft installeret, i den rækkefølge kalenderen reelt er booket i.
// 3) Produktion - "Installer skal kunne se produktion... fordi de har en
//    bredere arbejdsgang", men KUN som kontekst (readOnly) - han bygger
//    ikke selv, og en handlingsknap der alligevel altid ville blive
//    afvist af API'et er forvirrende UX, ikke reel funktionalitet.
export default async function Page() {
  const session = await getSession();
  return (
    <div className="space-y-10">
      <OpmaalingList />
      <div className="border-t border-brand-line pt-8">
        <InstallationList />
      </div>
      <div className="border-t border-brand-line pt-8">
        <ProduktionList role={session?.role} readOnly />
      </div>
    </div>
  );
}
