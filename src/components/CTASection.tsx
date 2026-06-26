import Link from "next/link";

export default function CTASection({ home }: { home: any }) {
  return (
    <section className="section">
      <div className="container-page">
        <div className="grain-dark reveal rounded-3xl px-8 py-20 text-center sm:px-16">
          <h2 className="h-title mx-auto max-w-2xl text-3xl text-white sm:text-4xl">{home.ctaTitle}</h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-white/70">{home.ctaText}</p>
          <div className="mt-9">
            <Link href="/bestil" className="btn-primary">{home.ctaButton}</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
