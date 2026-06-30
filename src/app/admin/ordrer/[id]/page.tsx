import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDKK } from "@/lib/pricing";
import { ORDER_STATUS_LABELS } from "@/lib/types";
import OrderStatusControl from "@/components/admin/OrderStatusControl";
import ImalatImportButton from "@/components/admin/ImalatImportButton";

export const dynamic = "force-dynamic";

export default async function OrderDetail({ params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({ where: { id: params.id }, include: { items: true } });
  if (!order) notFound();

  return (
    <div>
      <Link href="/admin/ordrer" className="text-sm text-brand-blue hover:underline">← Tilbage til ordrer</Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-ink">{order.orderNumber}</h1>
          <p className="text-sm text-brand-ink2/60">
            Oprettet {new Date(order.createdAt).toLocaleString("da-DK")} · Status: {ORDER_STATUS_LABELS[order.status]}
          </p>
        </div>
        <div className="flex gap-2">
          <ImalatImportButton musteri={`${order.firstName} ${order.lastName}`} items={order.items.map((it) => ({ widthMm: it.widthMm, heightMm: it.heightMm }))} />
          <a href={`/api/orders/${order.id}/pdf`} className="btn-primary py-2.5 text-sm" target="_blank" rel="noreferrer">Download PDF</a>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <div className="rounded-xl2 border border-brand-line bg-white p-6 shadow-card">
            <h2 className="mb-4 font-bold text-brand-ink">Produkter</h2>
            <div className="space-y-3">
              {order.items.map((it) => (
                <div key={it.id} className="rounded-xl border border-brand-line p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-brand-ink">{it.roomName || "—"} · {it.productName}{it.isDoubleDoor ? " (Dobbeltdør)" : ""}</span>
                    <span className="font-bold text-brand-bluedark">{formatDKK(it.lineTotal)}</span>
                  </div>
                  <div className="mt-1 text-sm text-brand-ink2/70">
                    {it.widthMm} × {it.heightMm} mm · {it.areaSqm.toString().replace(".", ",")} m² · Farve: {it.colorName || "—"}
                  </div>
                  {it.comment && <p className="mt-1 text-sm italic text-brand-ink2/60">"{it.comment}"</p>}
                </div>
              ))}
            </div>
            <div className="mt-5 space-y-1.5 border-t border-brand-line pt-4 text-sm">
              <div className="flex justify-between"><span className="text-brand-ink2/60">Produkter i alt</span><span>{formatDKK(order.productsTotal)}</span></div>
              {order.wantsInstallation && <div className="flex justify-between"><span className="text-brand-ink2/60">Montering</span><span>{formatDKK(order.installationTotal)}</span></div>}
              <div className="flex justify-between"><span className="text-brand-ink2/60">Fragt</span><span>Efter aftale</span></div>
              <div className="flex justify-between border-t border-brand-line pt-2 text-base font-bold"><span>Estimeret total</span><span className="text-brand-bluedark">{formatDKK(order.estimatedTotal)}</span></div>
            </div>
          </div>
          {order.note && (
            <div className="rounded-xl2 border border-brand-line bg-white p-6 shadow-card">
              <h2 className="mb-2 font-bold text-brand-ink">Bemærkning fra kunde</h2>
              <p className="text-sm text-brand-ink2/80">{order.note}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-xl2 border border-brand-line bg-white p-6 shadow-card">
            <h2 className="mb-3 font-bold text-brand-ink">Kunde</h2>
            <dl className="space-y-2 text-sm">
              <div><dt className="text-brand-ink2/50">Navn</dt><dd className="font-medium text-brand-ink">{order.firstName} {order.lastName}</dd></div>
              <div><dt className="text-brand-ink2/50">Telefon</dt><dd><a className="text-brand-blue hover:underline" href={`tel:${order.phone}`}>{order.phone}</a></dd></div>
              <div><dt className="text-brand-ink2/50">E-mail</dt><dd><a className="text-brand-blue hover:underline" href={`mailto:${order.email}`}>{order.email}</a></dd></div>
              <div><dt className="text-brand-ink2/50">Adresse</dt><dd className="text-brand-ink">{order.address}, {order.postalCode} {order.city}</dd></div>
              <div><dt className="text-brand-ink2/50">Montering</dt><dd className="text-brand-ink">{order.wantsInstallation ? "Ja — ønsker montering" : "Nej — kun levering"}</dd></div>
            </dl>
          </div>
          <div className="rounded-xl2 border border-brand-line bg-white p-6 shadow-card">
            <OrderStatusControl orderId={order.id} current={order.status} />
          </div>
        </div>
      </div>
    </div>
  );
}
