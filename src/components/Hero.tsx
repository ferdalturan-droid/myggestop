import Link from "next/link";

export default function Hero({ home }: { home: any }) {
  return (
    <section className="bg-soft">
      <div className="container-page grid items-center gap-12 py-20 sm:py-28 lg:grid-cols-2 lg:gap-16">
        <div className="reveal">
          <span className="eyebrow">{home.heroEyebrow}</span>
          <h1 className="h-title mt-5 text-4xl leading-[1.07] sm:text-5xl lg:text-[3.75rem]">
            {home.heroTitle}
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-brand-ink2/70">
            {home.heroSubtitle}
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/produkter" className="btn-primary">Se produkter</Link>
            <Link href="/bestil" className="btn-secondary">Få et tilbud</Link>
          </div>
        </div>

        <div className="reveal">
          <div className="aspect-[4/5] w-full overflow-hidden rounded-2xl bg-white sm:aspect-[4/3] lg:aspect-[4/5]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/galleri/enkelt-dor.png" alt="Specialfremstillet myggenet til dør" className="h-full w-full object-contain" />
          </div>
        </div>
      </div>
    </section>
  );
}
