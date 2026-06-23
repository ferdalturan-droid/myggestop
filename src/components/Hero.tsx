import Link from "next/link";
import { IconCheck } from "./Icons";

export default function Hero({ home }: { home: any }) {
  return (
    <section className="bg-mesh relative overflow-hidden">
      <div className="container-page grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-2">
        <div className="reveal">
          <span className="eyebrow">{home.heroEyebrow}</span>
          <h1 className="h-title mt-5 text-4xl leading-[1.08] sm:text-5xl lg:text-6xl">
            {home.heroTitle}
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-brand-ink2/80">{home.heroSubtitle}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/bestil" className="btn-primary text-base">
              {home.heroCtaPrimary}
            </Link>
            <Link href="/produkter" className="btn-ghost text-base">
              {home.heroCtaSecondary}
            </Link>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
            {(home.uspBar as string[]).map((u) => (
              <li key={u} className="flex items-center gap-2 text-sm font-medium text-brand-ink2">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-green/15 text-brand-greendark">
                  <IconCheck className="h-3.5 w-3.5" />
                </span>
                {u}
              </li>
            ))}
          </ul>
        </div>

        <div className="reveal relative">
          <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-tr from-brand-blue/20 to-brand-green/20 blur-2xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-white/60 p-3 shadow-soft backdrop-blur">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-brand-ink to-brand-ink2">
              {/* dekorativ net-illustration */}
              <svg viewBox="0 0 400 300" className="h-full w-full">
                <defs>
                  <pattern id="net" width="14" height="14" patternUnits="userSpaceOnUse">
                    <path d="M14 0H0V14" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                  </pattern>
                  <linearGradient id="frame" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#3aa9f0" />
                    <stop offset="1" stopColor="#0f5fa6" />
                  </linearGradient>
                </defs>
                <rect width="400" height="300" fill="url(#net)" />
                <rect x="70" y="55" width="260" height="190" rx="10" fill="none" stroke="url(#frame)" strokeWidth="10" />
                <rect x="86" y="71" width="228" height="158" fill="url(#net)" opacity="0.6" />
                <circle cx="320" cy="70" r="16" fill="#5cc524" className="animate-float" />
                <circle cx="345" cy="100" r="9" fill="#7ed957" />
              </svg>
              <div className="absolute bottom-4 left-4 rounded-xl bg-white/95 px-4 py-3 shadow-card">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-bluedark">Specialmal</p>
                <p className="text-sm font-bold text-brand-ink">Op til 2500 mm bredde</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
