import { buildMetadata } from "@/lib/seo";
import CTASection from "@/components/CTASection";
import { getSetting } from "@/lib/settings";
import { IconStar, IconTools, IconShield, IconChat, IconCheck, IconMap } from "@/components/Icons";


export const dynamic = "force-dynamic";
export const generateMetadata = () =>
  buildMetadata({
    title: "Om Os",
    description:
      "Myggestop – mere end 3 års erfaring med skræddersyede myggenet og insektbeskyttelse. Egen produktion på værksted i Glostrup. Kvalitet, håndværk og personlig service.",
    path: "/om-os"
  });

export default async function OmPage() {
  const home = await getSetting("home");

  const story = [
    {
      icon: IconStar,
      title: "Vores historie",
      text:
        "Vores rejse begyndte med en stærk interesse for håndværk og funktionelle løsninger. Gennem årene har vi deltaget i relevante kurser og uddannelsesforløb for løbende at udvikle vores kompetencer og sikre, at vores kunder altid får produkter af højeste kvalitet."
    },
    {
      icon: IconTools,
      title: "Egen produktion i Glostrup",
      text:
        "Alle vores produkter bliver fremstillet på vores eget værksted i Glostrup, hvor vi selv står for produktionen fra start til slut. Dette giver os fuld kontrol over kvaliteten og gør det muligt at levere skræddersyede løsninger, der passer perfekt til den enkelte kundes behov."
    },
    {
      icon: IconShield,
      title: "Præcision og holdbarhed",
      text:
        "Vi lægger stor vægt på præcision, holdbarhed og professionel service. Hver ordre bliver behandlet med omhu, og vi arbejder målrettet på at skabe løsninger, der både er funktionelle, æstetiske og langtidsholdbare."
    },
    {
      icon: IconChat,
      title: "Kundetilfredshed i fokus",
      text:
        "Hos Myggestop er kundetilfredshed vores højeste prioritet. Derfor tilbyder vi personlig rådgivning, professionel opmåling og produkter fremstillet med fokus på kvalitet ned til mindste detalje."
    }
  ];

  const stats = [
    ["3+", "års erfaring"],
    ["100%", "egen produktion"],
    ["1:1", "skræddersyet efter mål"]
  ];

  return (
    <>
      {/* HERO */}
      <section className="bg-mesh section">
        <div className="container-page grid items-center gap-12 lg:grid-cols-2">
          <div className="reveal">
            <span className="eyebrow">Om Myggestop</span>
            <h1 className="h-title mt-5 text-4xl sm:text-5xl lg:text-6xl">Om Os</h1>
            <p className="mt-6 text-lg leading-relaxed text-brand-ink2/85">
              Hos Myggestop brænder vi for kvalitet, godt håndværk og skræddersyede løsninger. Med mere end 3 års
              erfaring i branchen har vi hjulpet mange private og erhvervskunder med effektive løsninger inden for
              myggenet, insektbeskyttelse og specialtilpassede produkter til vinduer og døre.
            </p>
            <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2">
              {["Eget værksted i Glostrup", "Mere end 3 års erfaring", "Skræddersyet efter mål"].map((t) => (
                <li key={t} className="flex items-center gap-2 text-sm font-medium text-brand-ink2">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-green/15 text-brand-greendark">
                    <IconCheck className="h-3.5 w-3.5" />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="reveal relative">
            <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-tr from-brand-blue/20 to-brand-green/20 blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-white/60 p-3 shadow-soft backdrop-blur">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/produkter-banner.png" alt="Myggestop produkter fra eget værksted" className="w-full rounded-[1.5rem]" />
              <div className="absolute bottom-6 left-6 rounded-xl bg-white/95 px-4 py-3 shadow-card">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-bluedark">Egen produktion</p>
                <p className="text-sm font-bold text-brand-ink">Værksted i Glostrup</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STAT BAND */}
      <section className="section pt-0">
        <div className="container-page">
          <div className="grain-dark grid gap-8 rounded-[2rem] px-8 py-12 text-center sm:grid-cols-3 sm:px-12">
            {stats.map(([n, l]) => (
              <div key={l} className="reveal">
                <div className="bg-gradient-to-r from-brand-blue to-brand-green bg-clip-text text-5xl font-extrabold text-transparent">
                  {n}
                </div>
                <p className="mt-2 text-sm uppercase tracking-wider text-slate-300">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STORY BLOCKS */}
      <section className="section pt-0">
        <div className="container-page grid gap-6 md:grid-cols-2">
          {story.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="reveal card p-7 transition hover:-translate-y-1 hover:shadow-soft">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-brand-blue/15 to-brand-green/15 text-brand-bluedark">
                  <Icon />
                </span>
                <h2 className="mt-4 text-xl font-bold text-brand-ink">{s.title}</h2>
                <p className="mt-2 leading-relaxed text-brand-ink2/80">{s.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CLOSING */}
      <section className="section pt-0">
        <div className="container-page">
          <div className="reveal mx-auto max-w-3xl rounded-[2rem] border border-brand-line bg-brand-mist p-10 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand-green/15 text-brand-greendark">
              <IconMap />
            </span>
            <p className="mt-5 text-2xl font-semibold leading-snug text-brand-ink">
              Vi ser frem til at hjælpe dig med den rette løsning til dit hjem eller din virksomhed.
            </p>
          </div>
        </div>
      </section>

      <CTASection home={home} />
    </>
  );
}
