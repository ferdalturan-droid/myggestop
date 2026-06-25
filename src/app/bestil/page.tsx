import { prisma } from "@/lib/prisma";
import { getAllSettings } from "@/lib/settings";
import { buildMetadata } from "@/lib/seo";
import OrderForm from "@/components/OrderForm";
import MeasurementGuide from "@/components/MeasurementGuide";
import { PricingConfig } from "@/lib/pricing";

export const dynamic = "force-dynamic";
export const generateMetadata = () =>
  buildMetadata({
    title: "Bestil nu — Myggenet efter mål",
    description: "Bestil dine specialfremstillede myggenet online. Indtast mål, få estimeret pris, og vi kontakter dig med endelig pris og levering.",
    path: "/bestil",
    keywords: ["bestil myggenet", "myggenet specialmål", "myggenet pris", "plissédør bestil"]
  });

export default async function BestilPage() {
  const [products, colors, settings] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.color.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    getAllSettings()
  ]);

  const config: PricingConfig = {
    coloredFrameSurchargePerSqm: settings.pricing.coloredFrameSurchargePerSqm,
    doubleDoorSurcharge: settings.pricing.doubleDoorSurcharge,
    installationBaseFee: settings.pricing.installationBaseFee,
    installationPerProduct: settings.pricing.installationPerProduct
  };

  return (
    <section className="bg-mesh section">
      <div className="container-page">
        <div className="reveal max-w-2xl">
          <span className="eyebrow">Bestil nu</span>
          <h1 className="h-title mt-4 text-4xl sm:text-5xl">Bestil dine myggenet efter mål</h1>
          <p className="mt-4 text-lg text-brand-ink2/80">
            Tilføj så mange produkter du ønsker — et for hvert rum. Du ser en estimeret pris med det samme. Vi kontakter dig
            efterfolgende med endelig pris, levering og evt. montering.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_360px]">
          <OrderForm products={products as any} colors={colors as any} config={config} shippingText={settings.shipping.text} />
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <MeasurementGuide />
            <div className="card mt-6 p-6">
              <h3 className="font-bold text-brand-ink">Sa nemt er det</h3>
              <ol className="mt-3 space-y-2 text-sm text-brand-ink2/80">
                <li>1. Udfyld dine oplysninger.</li>
                <li>2. Tilføj produkter med mål pr. rum.</li>
                <li>3. Vælg montering eller levering.</li>
                <li>4. Send — du far en PDF-bekraeftelse pa mail.</li>
              </ol>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
