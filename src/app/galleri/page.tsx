import { buildMetadata } from "@/lib/seo";
import SectionHeading from "@/components/SectionHeading";
import GalleryGrid from "@/components/GalleryGrid";


export const dynamic = "force-dynamic";
export const generateMetadata = () =>
  buildMetadata({
    title: "Galleri — Myggenet, døre og plisségardin",
    description: "Se eksempler pa vores specialfremstillede myggenet til vinduer, døre, dobbeltdøre og plisségardiner.",
    path: "/galleri"
  });

export default function GalleriPage() {
  return (
    <section className="section">
      <div className="container-page">
        <SectionHeading eyebrow="Galleri" title="Inspiration fra virkelige løsninger" text="Filtrer efter type og se vores arbejde med myggenet til vinduer, døre og dobbeltdøre samt plisségardiner." />
        <div className="mt-10">
          <GalleryGrid />
        </div>
      </div>
    </section>
  );
}
