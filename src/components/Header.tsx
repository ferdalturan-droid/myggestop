"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const NAV = [
  { href: "/", label: "Forside" },
  { href: "/produkter", label: "Produkter" },
  { href: "/galleri", label: "Galleri" },
  { href: "/videoer", label: "Videoer" },
  { href: "/hvorfor-myggestop", label: "Hvorfor os" },
  { href: "/om-os", label: "Om os" },
  { href: "/kontakt", label: "Kontakt" }
];

export default function Header({ logoUrl, phone }: { logoUrl: string; phone: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);
  if (pathname.startsWith("/admin")) return null;

  return (
    <header
      className={`sticky top-0 z-50 transition-all ${
        scrolled ? "bg-white/90 shadow-card backdrop-blur" : "bg-white/70 backdrop-blur"
      }`}
    >
      <div className="container-page flex h-20 items-center justify-between gap-4">
        <Link href="/" className="flex items-center" aria-label="Myggestop forside">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl} alt="Myggestop" className="h-10 w-auto" />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => {
            const active = pathname === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  active ? "bg-brand-blue/10 text-brand-bluedark" : "text-brand-ink2 hover:bg-brand-mist hover:text-brand-blue"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <a href={`tel:${phone.replace(/\s/g, "")}`} className="hidden text-sm font-semibold text-brand-ink2 sm:block">
            {phone}
          </a>
          <Link href="/bestil" className="btn-primary hidden sm:inline-flex">
            Bestil nu
          </Link>
          <button
            aria-label="Menu"
            onClick={() => setOpen((o) => !o)}
            className="grid h-11 w-11 place-items-center rounded-full border border-brand-line lg:hidden"
          >
            <span className="text-xl">{open ? "✕" : "☰"}</span>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-brand-line bg-white lg:hidden">
          <div className="container-page flex flex-col py-3">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="rounded-lg px-3 py-3 text-base font-medium text-brand-ink2 hover:bg-brand-mist">
                {n.label}
              </Link>
            ))}
            <Link href="/bestil" className="btn-primary mt-2">
              Bestil nu
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
