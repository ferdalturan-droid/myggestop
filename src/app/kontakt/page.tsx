import { buildMetadata } from "@/lib/seo";
import { getSetting } from "@/lib/settings";
import SectionHeading from "@/components/SectionHeading";
import ContactForm from "@/components/ContactForm";
import { IconMap, IconChat, IconTruck } from "@/components/Icons";

export const generateMetadata = () =>
  buildMetadata({
    title: "Kontakt Myggestop",
    description: "Kontakt Myggestop. Vi leverer til hele Danmark og tilbyder montering i København og omegn. Ring eller skriv til os.",
    path: "/kontakt"
  });

export default async function KontaktPage() {
  const c = await getSetting("contact");
  return (
    <section className="bg-mesh section">
      <div className="container-page">
        <SectionHeading eyebrow="Kontakt" title="Vi sidder klar til at hjælpe dig" text="Har du sporgsmal om mål, produkter, levering eller montering? Sa hor endelig fra os." />
        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
          <div className="space-y-5">
            <div className="card p-6">
              <h3 className="font-bold text-brand-ink">Kontaktoplysninger</h3>
              <ul className="mt-4 space-y-3 text-brand-ink2">
                <li className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-blue/10 text-brand-bluedark"><IconChat /></span>
                  <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="font-semibold hover:text-brand-blue">{c.phone}</a>
                </li>
                <li className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-blue/10 text-brand-bluedark">@</span>
                  <a href={`mailto:${c.email}`} className="font-semibold hover:text-brand-blue">{c.email}</a>
                </li>
                <li className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-blue/10 text-brand-bluedark"><IconMap /></span>
                  <span>{c.address}, {c.postalCode} {c.city}</span>
                </li>
              </ul>
              <p className="mt-4 border-t border-brand-line pt-4 text-sm text-brand-ink2/70">{c.openingHours}</p>
            </div>

            <div className="card p-6">
              <h3 className="font-bold text-brand-ink">Serviceområde</h3>
              <div className="mt-4 space-y-3">
                <p className="flex items-start gap-3 text-brand-ink2">
                  <span className="mt-0.5 grid h-8 w-8 flex-none place-items-center rounded-lg bg-brand-green/15 text-brand-greendark"><IconTruck className="h-5 w-5" /></span>
                  <span><strong>Vi leverer til hele Danmark.</strong> Bestil online og få dine specialfremstillede net leveret til døren.</span>
                </p>
                <p className="flex items-start gap-3 text-brand-ink2">
                  <span className="mt-0.5 grid h-8 w-8 flex-none place-items-center rounded-lg bg-brand-blue/15 text-brand-bluedark"><IconMap className="h-5 w-5" /></span>
                  <span><strong>Montering tilbydes i København og omegn.</strong> Vælg montering i bestillingen, så klarer vi opsaetningen.</span>
                </p>
              </div>
            </div>
          </div>

          <ContactForm />
        </div>
      </div>
    </section>
  );
}
