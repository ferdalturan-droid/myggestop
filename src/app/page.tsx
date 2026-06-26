import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSetting } from "@/lib/settings";
import Hero from "@/components/Hero";
import WhyUs from "@/components/WhyUs";
import HowItWorks from "@/components/HowItWorks";
import Faq from "@/components/Faq";
import CTASection from "@/components/CTASection";
import ProductCard from "@/components/ProductCard";

export const dynamic = "force-dynamic";

function Heading({ eyebrow, title, text }: { eyebrow?: string; title: string; text?: string }) {
  return (
    <div className="reveal mx-auto max-w-2xl text-center">
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2 className="h-title mt-4 text-3xl sm:text-4xl">{title}</h2>
      {text && <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-brand-ink2/65">{text}</p>}
    </div>
  );
}

export default async function HomePage() {
  const home = await getSetting("home");
  const products = await prisma.product.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
  const gallery = await prisma.galleryItem.findMany({ where: { isActive: true, type: "image" }, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }], take: 3 });

  return (
    <>
      <Hero home={home} />

      {/* Produkter */}
      <section className="section">
        <div className="container-page">
          <Heading eyebrow="Produkter" title="To løsninger – fremstillet efter mål" />
          <div className="mt-14 grid gap-6 md:grid-cols-2">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>

      {/* Derfor Myggestop */}
      <section className="section bg-soft">
        <div className="container-page">
          <Heading eyebrow="Derfor Myggestop" title="Kvalitet, du kan mærke" />
          <div className="mt-16"><WhyUs /></div>
        </div>
      </section>

      {/* Sadan virker det */}
      <section className="section">
        <div className="container-page">
          <Heading eyebrow="Sådan virker det" title="Fra mål til monteret – på fire trin" />
          <div className="mt-16"><HowItWorks /></div>
        </div>
      </section>

      {/* Galleri preview */}
      {gallery.length > 0 && (
        <section className="section bg-soft">
          <div className="container-page">
            <Heading eyebrow="Galleri" title="Se vores løsninger" />
            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {gallery.map((g) => (
                <div key={g.id} className="reveal overflow-hidden rounded-2xl border border-brand-line bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g.url} alt={g.alt || g.title} className="aspect-[3/4] w-full object-contain" />
                </div>
              ))}
            </div>
            <div className="reveal mt-12 text-center">
              <Link href="/galleri" className="btn-secondary">Se hele galleriet</Link>
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="section">
        <div className="container-narrow">
          <Heading eyebrow="Ofte stillede spørgsmål" title="Godt at vide" />
          <div className="mt-12"><Faq /></div>
        </div>
      </section>

      <CTASection home={home} />
    </>
  );
}
