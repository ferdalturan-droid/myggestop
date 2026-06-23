import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDKK } from "@/lib/pricing";
import { ORDER_STATUS_LABELS } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [total, ny, behandling, afsluttet, recent, sum] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: "NY" } }),
    prisma.order.count({ where: { status: "UNDER_BEHANDLING" } }),
    prisma.order.count({ where: { status: "AFSLUTTET" } }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { items: true } }),
    prisma.order.aggregate({ _sum: { estimatedTotal: true } })
  ]);

  const stats = [
    { label: "Ordrer i alt", value: total },
    { label: "Nye ordrer", value: ny },
    { label: "Under behandling", value: behandling },
    { label: "Afsluttede", value: afsluttet }
  ];

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-brand-ink">Oversigt</h1>
      <p className="mt-1 text-sm text-brand-ink2/65">Velkommen tilbage. Her er status pa din forretning.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl2 border border-brand-line bg-white p-5 shadow-card">
            <p className="text-sm text-brand-ink2/60">{s.label}</p>
            <p className="mt-1 text-3xl font-extrabold text-brand-ink">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl2 bg-brand-ink p-5 text-white">
        <p className="text-sm text-slate-300">Samlet estimeret ordrevaerdi</p>
        <p className="mt-1 text-3xl font-extrabold text-brand-green">{formatDKK(sum._sum.estimatedTotal || 0)}</p>
      </div>

      <div className="mt-8 rounded-xl2 border border-brand-line bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-brand-line px-6 py-4">
          <h2 className="font-bold text-brand-ink">Seneste ordrer</h2>
          <Link href="/admin/ordrer" className="text-sm font-semibold text-brand-blue hover:underline">Se alle</Link>
        </div>
        <div className="divide-y divide-brand-line">
          {recent.length === 0 && <p className="px-6 py-8 text-center text-sm text-brand-ink2/60">Ingen ordrer endnu.</p>}
          {recent.map((o) => (
            <Link key={o.id} href={`/admin/ordrer/${o.id}`} className="flex items-center justify-between px-6 py-4 hover:bg-brand-mist">
              <div>
                <p className="font-semibold text-brand-ink">{o.orderNumber} · {o.firstName} {o.lastName}</p>
                <p className="text-sm text-brand-ink2/60">{o.items.length} produkt(er) · {o.city}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-brand-ink">{formatDKK(o.estimatedTotal)}</p>
                <p className="text-xs text-brand-ink2/60">{ORDER_STATUS_LABELS[o.status]}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
