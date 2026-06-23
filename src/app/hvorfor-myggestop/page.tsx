import { buildMetadata } from "@/lib/seo";
import SectionHeading from "@/components/SectionHeading";
import WhyUs from "@/components/WhyUs";
import CTASection from "@/components/CTASection";
import { getSetting } from "@/lib/settings";

export const generateMetadata = () =>
  buildMetadata({
    title: "Hvorfor vaelge Myggestop?",
    description: "Specialmal, hoj kvalitet, professionel radgivning, levering i hele Danmark og montering i Kobenhavn og omegn. Derfor vaelger danskerne Myggestop.",
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
            eyebrow="Hvorfor vaelge Myggestop?"
            title="Den trygge vej til et insektfrit hjem"
            text="Vi leverer ikke bare net — vi leverer ro, komfort og handvaerk i hoj kvalitet, tilpasset netop dit hjem."
          />
          <div className="mt-12">
            <WhyUs />
          </div>
        </div>
      </section>
      <CTASection home={home} />
    </>
  );
}
