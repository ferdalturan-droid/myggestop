import { buildMetadata } from "@/lib/seo";
import SectionHeading from "@/components/SectionHeading";
import WhyUs from "@/components/WhyUs";
import MaterialsSection from "@/components/MaterialsSection";
import CTASection from "@/components/CTASection";
import { getSetting } from "@/lib/settings";


export const dynamic = "force-dynamic";
export const generateMetadata = () =>
  buildMetadata({
    title: "Hvorfor vælge Myggestop?",
    description: "Specialmål, høj kvalitet, professionel rådgivning, levering i hele Danmark og montering i København og omegn. Derfor vælger danskerne Myggestop.",
    path: "/hvorfor-myggestop"
  });

export default async function HvorforPage() {
  const home = await getSetting("home");
  return (
    <>
      <section className="bg-mesh section">
        <div className="container-page">
          <SectionHeading
            center
            eyebrow="Hvorfor vælge Myggestop?"
            title="Den trygge vej til et insektfrit hjem"
            text="Vi leverer ikke bare net — vi leverer ro, komfort og håndværk i høj kvalitet, tilpasset netop dit hjem."
          />
          <div className="mt-12">
            <WhyUs />
          </div>
        </div>
      </section>
      <section className="section pt-0">
        <div className="container-page">
          <SectionHeading
            center
            eyebrow="Materialer"
            title="Det er dette, vi bygger med"
            text="Åbn og se præcis, hvilke materialer der indgår i dit myggenet eller din plissegardin."
          />
          <div className="mt-12">
            <MaterialsSection />
          </div>
        </div>
      </section>
      <CTASection home={home} />
    </>
  );
}
