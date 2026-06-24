import { prisma } from "@/lib/prisma";
import { getSetting } from "@/lib/settings";
import Hero from "@/components/Hero";
import SectionHeading from "@/components/SectionHeading";
import WhyUs from "@/components/WhyUs";
import CTASection from "@/components/CTASection";
import ProductCard from "@/components/ProductCard";
import { IconShield, IconLeaf, IconRuler, IconTruck, IconTools, IconChat } from "@/components/Icons";

export const dynamic = "force-dynamic";

const BENEFITS = [
  { icon: IconShield, title: "Beskyttelse mod insekter", text: "Hold myg, fluer, hvepse og andre insekter ude — abne vinduer uden bekymring." },
  { icon: IconLeaf, title: "Bedre komfort", text: "Frisk luft og naturligt lys hele aret, uden generende insekter i hjemmet." },
  { icon: IconRuler, title: "Specialfremstillet", text: "Hvert net laves efter dine praecise mal for perfekt pasform." },
  { icon: IconTools, title: "Nem montering", text: "Enkle losninger du selv kan saette op — eller lad os montere i Kobenhavn." },
  { icon: IconTruck, title: "Hurtig levering", text: "Vi producerer og sender hurtigt til hele Danmark." },
  { icon: IconChat, title: "Dansk kundeservice", text: "Personlig radgivning og support pa dansk fra start til slut." }
];

export default async function HomePage() {
  const home = await getSetting("home");
  const products = await prisma.product.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });

  return (
    <>
      <Hero home={home} />

      {/* Intro / benefits */}
      <section className="section">
        <div className="container-page">
          <SectionHeading
            center
            eyebrow="Hvorfor myggenet?"
            title={home.introTitle}
            text={home.introText}
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b, i) => {
              const Icon = b.icon;
              return (
                <div key={b.title} className="reveal card p-6" style={{ transitionDelay: `${i * 50}ms` }}>
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-brand-blue to-brand-bluedark text-white">
                    <Icon />
                  </span>
                  <h3 className="mt-4 text-lg font-bold text-brand-ink">{b.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-brand-ink2/75">{b.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="section bg-brand-mist">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading eyebrow="Produkter" title="Vaelg din losning" text="To gennemprovede produkter — begge i frit specialmal." />
            <a href="/produkter" className="btn-ghost">Se alle produkter</a>
          </div>
          <img src="/produkter-banner.png" alt="Myggestop produkter - plissedor og myggenet" className="mt-10 w-full rounded-xl2 border border-brand-line shadow-card" />
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      <CTASection home={home} />
    </>
  );
}
