import { buildMetadata } from "@/lib/seo";
import SectionHeading from "@/components/SectionHeading";
import GalleryGrid from "@/components/GalleryGrid";

export const generateMetadata = () =>
  buildMetadata({
    title: "Galleri — Myggenet, dore og plissegardin",
    description: "Se eksempler pa vores specialfremstillede myggenet til vinduer, dore, dobbeltdore og plissegardiner.",
    path: "/galleri"
  });

export default function GalleriPage() {
  return (
    <section className="section">
      <div className="container-page">
        <SectionHeading eyebrow="Galleri" title="Inspiration fra virkelige losninger" text="Filtrer efter type og se vores arbejde med myggenet til vinduer, dore og dobbeltdore samt plissegardiner." />
        <div className="mt-10">
          <GalleryGrid />
        </div>
      </div>
    </section>
  );
}
