import Link from "next/link";

export default function CTASection({ home }: { home: any }) {
  return (
    <section className="section">
      <div className="container-page">
        <div className="grain-dark reveal relative overflow-hidden rounded-[2rem] px-8 py-14 text-center sm:px-16 sm:py-20">
          <h2 className="h-title mx-auto max-w-2xl text-3xl text-white sm:text-4xl">{home.ctaTitle}</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">{home.ctaText}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/bestil" className="btn-green text-base">
              {home.ctaButton}
            </Link>
            <Link href="/kontakt" className="btn inline-flex border border-white/30 text-white hover:bg-white/10">
              Kontakt os
            </Link>
          </div>
          <p className="mt-6 text-sm text-slate-400">Uforpligtende · Ingen online betaling · Vi vender tilbage med endelig pris</p>
        </div>
      </div>
    </section>
  );
}
