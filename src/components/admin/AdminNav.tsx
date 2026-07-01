"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const LINKS = [
  { href: "/admin", label: "Oversigt" },
  { href: "/admin/ordrer", label: "Ordrer" },
  { href: "/admin/imalat", label: "İmalat hesaplama" },
  { href: "/admin/produkter", label: "Produkter" },
  { href: "/admin/priser", label: "Priser & gebyrer" },
  { href: "/admin/farver", label: "Farver" },
  { href: "/admin/galleri", label: "Galleri & videoer" },
  { href: "/admin/indhold", label: "Forside-indhold" },
  { href: "/admin/seo", label: "SEO" },
  { href: "/admin/indstillinger", label: "Kontakt & logo" }
];

export default function AdminNav({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  const Nav = (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
      {LINKS.map((l) => {
        const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
        return (
          <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
            className={`block rounded-lg px-3 py-3 text-[15px] font-medium transition ${active ? "bg-brand-greendark text-white" : "text-brand-ink2 hover:bg-brand-mist"}`}>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* mobil ust app-bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-brand-line bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <Link href="/admin" className="text-lg font-extrabold text-brand-ink">MYGGE<span className="text-brand-green">STOP</span></Link>
        <button onClick={() => setOpen(true)} aria-label="Menü" className="grid h-10 w-10 place-items-center rounded-lg border border-brand-line text-xl">☰</button>
      </div>

      {/* kayan menu (mobil) + sabit sidebar (masaustu) */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[82%] transform flex-col border-r border-brand-line bg-white transition-transform lg:w-64 lg:translate-x-0 ${open ? "translate-x-0 shadow-2xl" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between border-b border-brand-line px-5 py-4">
          <Link href="/admin" onClick={() => setOpen(false)} className="text-xl font-extrabold text-brand-ink">MYGGE<span className="text-brand-green">STOP</span></Link>
          <button onClick={() => setOpen(false)} aria-label="Kapat" className="grid h-9 w-9 place-items-center rounded-lg text-xl text-brand-ink2 lg:hidden">✕</button>
        </div>
        {Nav}
        <div className="border-t border-brand-line p-4">
          <p className="truncate text-xs text-brand-ink2/60">{email}</p>
          <div className="mt-2 flex gap-2">
            <Link href="/" className="flex-1 rounded-lg border border-brand-line px-3 py-2 text-center text-xs font-medium text-brand-ink2 hover:bg-brand-mist">Se site</Link>
            <button onClick={logout} className="flex-1 rounded-lg bg-brand-ink px-3 py-2 text-xs font-medium text-white hover:bg-brand-ink2">Log ud</button>
          </div>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}
    </>
  );
}
