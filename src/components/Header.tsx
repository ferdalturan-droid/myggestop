"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const NAV = [
  { href: "/", label: "Forside" },
  { href: "/produkter", label: "Produkter" },
  { href: "/galleri", label: "Galleri" },
  { href: "/videoer", label: "Videoer" },
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
      className={`sticky top-0 z-50 border-b transition-all ${
        scrolled ? "border-brand-goldline bg-brand-black/95 shadow-card backdrop-blur" : "border-brand-goldline/60 bg-brand-black/85 backdrop-blur"
      }`}
    >
      <div className="container-page flex h-24 items-center justify-between gap-4">
        <Link href="/" className="flex items-center" aria-label="Nordica forside">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl} alt="Nordica – Myggenet & Gardin" className="h-16 w-auto sm:h-20" />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => {
            const active = pathname === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  active ? "bg-brand-blue/15 text-brand-blue" : "text-brand-cream2 hover:bg-brand-charcoal hover:text-brand-blue"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <a href={`tel:${phone.replace(/\s/g, "")}`} className="hidden text-sm font-semibold text-brand-cream2 sm:block">
            {phone}
          </a>
          <Link href="/bestil" className="btn-primary hidden sm:inline-flex">
            Bestil nu
          </Link>
          <button
            aria-label="Menu"
            onClick={() => setOpen((o) => !o)}
            className="grid h-11 w-11 place-items-center rounded-full border border-brand-goldline text-brand-cream lg:hidden"
          >
            <span className="text-xl">{open ? "✕" : "☰"}</span>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-brand-goldline bg-brand-black lg:hidden">
          <div className="container-page flex flex-col py-3">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="rounded-lg px-3 py-3 text-base font-medium text-brand-cream2 hover:bg-brand-charcoal">
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
