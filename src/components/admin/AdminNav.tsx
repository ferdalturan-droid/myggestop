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

  return (
    <>
      <div className="flex items-center justify-between border-b border-brand-line bg-white px-5 py-4 lg:hidden">
        <span className="text-lg font-extrabold text-brand-ink">MYGGE<span className="text-brand-green">STOP</span></span>
        <button onClick={() => setOpen((o) => !o)} className="rounded-lg border border-brand-line px-3 py-1.5 text-sm">Menu</button>
      </div>
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-brand-line bg-white transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-full flex-col">
          <div className="border-b border-brand-line px-6 py-5">
            <Link href="/admin" className="text-xl font-extrabold text-brand-ink">MYGGE<span className="text-brand-green">STOP</span></Link>
            <p className="mt-0.5 text-xs text-brand-ink2/50">Administration</p>
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {LINKS.map((l) => {
              const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    active ? "bg-brand-blue text-white" : "text-brand-ink2 hover:bg-brand-mist"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-brand-line p-4">
            <p className="truncate text-xs text-brand-ink2/60">{email}</p>
            <div className="mt-2 flex gap-2">
              <Link href="/" className="flex-1 rounded-lg border border-brand-line px-3 py-2 text-center text-xs font-medium text-brand-ink2 hover:bg-brand-mist">Se site</Link>
              <button onClick={logout} className="flex-1 rounded-lg bg-brand-ink px-3 py-2 text-xs font-medium text-white hover:bg-brand-ink2">Log ud</button>
            </div>
          </div>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setOpen(false)} />}
    </>
  );
}
