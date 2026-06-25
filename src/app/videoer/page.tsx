import { buildMetadata } from "@/lib/seo";
import { prisma } from "@/lib/prisma";
import SectionHeading from "@/components/SectionHeading";

export const dynamic = "force-dynamic";
export const generateMetadata = () =>
  buildMetadata({
    title: "Videoer — Se Myggestop i brug",
    description: "Videoguider og produktvisninger af vores myggenet, myggedøre og plisségardiner.",
    path: "/videoer"
  });

export default async function VideoerPage() {
  const videos = await prisma.galleryItem.findMany({ where: { isActive: true, type: "video" }, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });
  return (
    <section className="section">
      <div className="container-page">
        <SectionHeading eyebrow="Videoer" title="Se vores løsninger i bevægelse" text="Produktvisninger og guides. Nye videoer tilføjes lobende." />
        {videos.length === 0 ? (
          <div className="mt-12 rounded-xl2 border border-dashed border-brand-line bg-brand-mist/50 p-12 text-center">
            <p className="text-brand-ink2/70">Der er endnu ingen videoer tilgængelige.</p>
            <p className="mt-1 text-sm text-brand-ink2/50">Vi uploader videoer her meget snart.</p>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {videos.map((v) => (
              <figure key={v.id} className="overflow-hidden rounded-xl2 border border-brand-line bg-brand-ink">
                <video src={v.url} controls className="aspect-video w-full" poster={v.thumbUrl || undefined} />
                {v.title && <figcaption className="p-4 text-sm font-medium text-white">{v.title}</figcaption>}
              </figure>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
