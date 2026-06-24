import { buildMetadata } from "@/lib/seo";
import CTASection from "@/components/CTASection";
import { getSetting } from "@/lib/settings";
import { IconStar, IconTools, IconChat } from "@/components/Icons";

export const generateMetadata = () =>
  buildMetadata({
    title: "Om Os",
    description:
      "Myggestop – mere end 3 års erfaring med skræddersyede myggenet og insektbeskyttelse. Egen produktion på værksted i Glostrup. Kvalitet, håndværk og personlig service.",
    path: "/om-os"
  });

export default async function OmPage() {
  const home = await getSetting("home");
  const highlights = [
    { icon: IconStar, title: "3+ års erfaring", text: "Mange tilfredse private- og erhvervskunder." },
    { icon: IconTools, title: "Eget værksted i Glostrup", text: "Vi står selv for produktionen fra start til slut." },
    { icon: IconChat, title: "Personlig rådgivning", text: "Professionel opmåling og fokus på hver detalje." }
  ];

  return (
    <>
      <section className="bg-mesh section">
        <div className="container-page">
          <div className="reveal max-w-3xl">
            <span className="eyebrow">Om Myggestop</span>
            <h1 className="h-title mt-5 text-4xl sm:text-5xl">Om Os</h1>
            <p className="mt-6 text-lg leading-relaxed text-brand-ink2/85">
              Hos Myggestop brænder vi for kvalitet, godt håndværk og skræddersyede løsninger. Med mere end 3 års
              erfaring i branchen har vi hjulpet mange private og erhvervskunder med effektive løsninger inden for
              myggenet, insektbeskyttelse og specialtilpassede produkter til vinduer og døre.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {highlights.map((h) => {
              const Icon = h.icon;
              return (
                <div key={h.title} className="reveal card p-6">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-brand-blue to-brand-bluedark text-white">
                    <Icon />
                  </span>
                  <h3 className="mt-4 text-lg font-bold text-brand-ink">{h.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-brand-ink2/75">{h.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section pt-2">
        <div className="container-page">
          <div className="reveal mx-auto max-w-3xl space-y-5 text-lg leading-relaxed text-brand-ink2/85">
            <p>
              Vores rejse begyndte med en stærk interesse for håndværk og funktionelle løsninger. Gennem årene har vi
              deltaget i relevante kurser og uddannelsesforløb for løbende at udvikle vores kompetencer og sikre, at
              vores kunder altid får produkter af højeste kvalitet.
            </p>
            <p>
              Alle vores produkter bliver fremstillet på vores eget værksted i Glostrup, hvor vi selv står for
              produktionen fra start til slut. Dette giver os fuld kontrol over kvaliteten og gør det muligt at levere
              skræddersyede løsninger, der passer perfekt til den enkelte kundes behov.
            </p>
            <p>
              Vi lægger stor vægt på præcision, holdbarhed og professionel service. Hver ordre bliver behandlet med
              omhu, og vi arbejder målrettet på at skabe løsninger, der både er funktionelle, æstetiske og
              langtidsholdbare.
            </p>
            <p>
              Hos Myggestop er kundetilfredshed vores højeste prioritet. Derfor tilbyder vi personlig rådgivning,
              professionel opmåling og produkter fremstillet med fokus på kvalitet ned til mindste detalje.
            </p>
            <p className="text-xl font-semibold text-brand-ink">
              Vi ser frem til at hjælpe dig med den rette løsning til dit hjem eller din virksomhed.
            </p>
          </div>
        </div>
      </section>

      <CTASection home={home} />
    </>
  );
}
