import { buildMetadata } from "@/lib/seo";
import SectionHeading from "@/components/SectionHeading";
import CTASection from "@/components/CTASection";
import { getSetting } from "@/lib/settings";
import { IconCheck } from "@/components/Icons";

export const generateMetadata = () =>
  buildMetadata({
    title: "Om Myggestop",
    description: "Myggestop er en dansk specialist i specialfremstillede myggenet til vinduer og dore. Laer os at kende.",
    path: "/om-os"
  });

export default async function OmPage() {
  const home = await getSetting("home");
  const contact = await getSetting("contact");
  return (
    <>
      <section className="bg-mesh section">
        <div className="container-page grid items-center gap-12 lg:grid-cols-2">
          <div className="reveal">
            <span className="eyebrow">Om Myggestop</span>
            <h1 className="h-title mt-5 text-4xl sm:text-5xl">Dansk specialist i myggenet efter mal</h1>
            <p className="mt-5 text-lg leading-relaxed text-brand-ink2/80">
              Myggestop er grundlagt med en enkel mission: at give danske hjem friske, insektfrie rum — uden at ga pa kompromis
              med design og kvalitet. Vi specialfremstiller myggenet og plissegardiner til vinduer og dore efter dine praecise mal.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-brand-ink2/80">
              Vi leverer i hele Danmark og tilbyder professionel montering i Kobenhavn og omegn. Vores fokus er holdbare materialer,
              praecist handvaerk og en kundeservice, hvor du altid kan fa fat i et rigtigt menneske.
            </p>
            <ul className="mt-6 space-y-3">
              {["Specialmal til ethvert vindue og dor", "Holdbare materialer i hoj kvalitet", "Personlig dansk radgivning", "Levering i hele Danmark"].map((t) => (
                <li key={t} className="flex items-center gap-3 text-brand-ink2">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-green/15 text-brand-greendark">
                    <IconCheck className="h-4 w-4" />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="reveal card p-8">
            <h3 className="text-xl font-bold text-brand-ink">Sadan arbejder vi</h3>
            <ol className="mt-6 space-y-6">
              {[
                ["1", "Du bestiller online", "Indtast dine mal og produktonsker i bestillingsformularen. Du ser en estimeret pris med det samme."],
                ["2", "Vi kontakter dig", "Vi vender tilbage med endelig pris, levering og evt. montering — helt uforpligtende."],
                ["3", "Produktion & levering", "Vi producerer dit net efter mal og leverer til doren — eller monterer det i Kobenhavn og omegn."]
              ].map(([n, t, d]) => (
                <li key={n} className="flex gap-4">
                  <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-gradient-to-br from-brand-blue to-brand-bluedark font-bold text-white">{n}</span>
                  <div>
                    <p className="font-bold text-brand-ink">{t}</p>
                    <p className="text-sm text-brand-ink2/75">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-6 rounded-xl bg-brand-mist p-4 text-sm text-brand-ink2/80">{contact.serviceAreaText}</p>
          </div>
        </div>
      </section>
      <CTASection home={home} />
    </>
  );
}
