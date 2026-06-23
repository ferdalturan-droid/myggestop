import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/seo";
import SectionHeading from "@/components/SectionHeading";
import ProductCard from "@/components/ProductCard";
import CTASection from "@/components/CTASection";
import { getSetting } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const generateMetadata = () =>
  buildMetadata({
    title: "Produkter — Myggenet og plissegardin i specialmal",
    description: "Standard myggenet og plissegardin til vinduer og dore. Specialfremstillet efter mal. Levering i hele Danmark.",
    path: "/produkter",
    keywords: ["myggenet", "plissedor", "plissegardin", "myggedor", "insektnet vindue", "specialmal myggenet"]
  });

export default async function ProdukterPage() {
  const products = await prisma.product.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
  const home = await getSetting("home");
  return (
    <>
      <section className="bg-mesh section">
        <div className="container-page">
          <SectionHeading
            eyebrow="Produkter"
            title="Specialfremstillede myggenet til vinduer og dore"
            text="Alle vores produkter laves efter dine egne mal. Vaelg produkt, indtast mal i bestillingen, og fa en estimeret pris med det samme."
          />
          <img src="/produkter-banner.png" alt="Myggestop produkter - plissedor og myggenet til vinduer og dore" className="reveal mt-10 w-full rounded-xl2 border border-brand-line shadow-card" />
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-page grid gap-10 lg:grid-cols-2">
          {products.map((p) => (
            <div key={p.id} className="reveal card p-8">
              <h3 className="text-2xl font-bold text-brand-ink">{p.name}</h3>
              <p className="mt-3 leading-relaxed text-brand-ink2/80">{p.description}</p>
              <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
                <div className="rounded-xl bg-brand-mist p-4">
                  <dt className="text-brand-ink2/60">Max bredde</dt>
                  <dd className="text-lg font-bold text-brand-ink">{p.maxWidthMm} mm</dd>
                </div>
                <div className="rounded-xl bg-brand-mist p-4">
                  <dt className="text-brand-ink2/60">Max hojde</dt>
                  <dd className="text-lg font-bold text-brand-ink">{p.maxHeightMm} mm</dd>
                </div>
              </dl>
              {p.doubleDoorThresholdMm && (
                <p className="mt-4 rounded-xl border border-brand-blue/20 bg-brand-blue/5 p-4 text-sm text-brand-bluedark">
                  Ved bredder over {p.doubleDoorThresholdMm} mm klassificeres losningen automatisk som <strong>Dobbeltdor</strong>.
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      <CTASection home={home} />
    </>
  );
}
