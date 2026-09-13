"use client";

// RUNDE 5 (§"bygger skal kunne downloade pdf og csv (i de sider de har
// adgang til)"): den eneste CSV-eksport der fandtes (OrdersTable.tsx) lå
// på ordre-LISTEN, som Bygger slet ikke har side-adgang til (kun enkelte
// ordredetaljer). Denne knap sidder derfor direkte på ordredetalje-siden,
// som Bygger allerede må se - ren client-side generering ud fra data der
// allerede ligger på siden, ingen ny API-adgang krævet.
type Item = { productName: string; widthMm: number; heightMm: number; qty?: number; lineTotal: number };

export default function OrderCsvExport({ orderNumber, items }: { orderNumber: string; items: Item[] }) {
  function exportCsv() {
    const headers = ["Produkt", "Bredde (mm)", "Højde (mm)", "Antal", "Linjepris (kr)"];
    const rows = items.map((it) => [
      it.productName,
      it.widthMm || "",
      it.heightMm || "",
      it.qty ?? 1,
      String(it.lineTotal).replace(".", ",")
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${orderNumber}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button onClick={exportCsv} className="btn-secondary py-2.5 text-sm">Download CSV</button>
  );
}
