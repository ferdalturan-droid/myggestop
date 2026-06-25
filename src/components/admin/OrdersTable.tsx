"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { formatDKK } from "@/lib/pricing";
import { ORDER_STATUS_LABELS, ORDER_STATUS_ORDER } from "@/lib/types";

const STATUS_COLOR: Record<string, string> = {
  NY: "bg-blue-100 text-blue-700",
  UNDER_BEHANDLING: "bg-amber-100 text-amber-700",
  TILBUD_SENDT: "bg-violet-100 text-violet-700",
  AFVENTER_KUNDE: "bg-orange-100 text-orange-700",
  AFSLUTTET: "bg-green-100 text-green-700",
  ANNULLERET: "bg-red-100 text-red-700"
};

export default function OrdersTable() {
  const [orders, setOrders] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    const res = await fetch("/api/orders?" + params.toString());
    const d = await res.json();
    setOrders(d.orders || []);
    setLoading(false);
  }, [q, status]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  function exportCsv() {
    const headers = ["Ordrenr", "Dato", "Navn", "Email", "Telefon", "By", "Postnr", "Montering", "Status", "Estimeret total"];
    const rows = orders.map((o) => [
      o.orderNumber,
      new Date(o.createdAt).toLocaleDateString("da-DK"),
      `${o.firstName} ${o.lastName}`,
      o.email,
      o.phone,
      o.city,
      o.postalCode,
      o.wantsInstallation ? "Ja" : "Nej",
      ORDER_STATUS_LABELS[o.status],
      String(o.estimatedTotal).replace(".", ",")
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `myggestop-ordrer-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          className="input max-w-xs"
          placeholder="Sog ordrenr, navn, email, by..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="input max-w-[200px]" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Alle statusser</option>
          {ORDER_STATUS_ORDER.map((s) => (
            <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
          ))}
        </select>
        <button onClick={exportCsv} className="btn-ghost ml-auto py-2.5 text-sm">Eksporter CSV</button>
      </div>

      <div className="overflow-hidden rounded-xl2 border border-brand-line bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-line bg-brand-mist text-left text-xs uppercase tracking-wide text-brand-ink2/60">
                <th className="px-4 py-3">Ordrenr</th>
                <th className="px-4 py-3">Kunde</th>
                <th className="px-4 py-3">By</th>
                <th className="px-4 py-3">Produkter</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-line">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-brand-ink2/50">Indlaeser...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-brand-ink2/50">Ingen ordrer fundet.</td></tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-brand-mist/50">
                    <td className="px-4 py-3 font-semibold text-brand-ink">
                      <Link href={`/admin/ordrer/${o.id}`} className="hover:text-brand-blue">{o.orderNumber}</Link>
                      <div className="text-xs font-normal text-brand-ink2/50">{new Date(o.createdAt).toLocaleDateString("da-DK")}</div>
                    </td>
                    <td className="px-4 py-3">{o.firstName} {o.lastName}<div className="text-xs text-brand-ink2/50">{o.email}</div></td>
                    <td className="px-4 py-3">{o.city}</td>
                    <td className="px-4 py-3">{o.items.length}</td>
                    <td className="px-4 py-3 font-semibold">{formatDKK(o.estimatedTotal)}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLOR[o.status]}`}>{ORDER_STATUS_LABELS[o.status]}</span></td>
                    <td className="px-4 py-3 text-right"><Link href={`/admin/ordrer/${o.id}`} className="text-sm font-semibold text-brand-blue hover:underline">Åbn</Link></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
