"use client";

// RUNDE 5 (§"bygger skal kunne downloade pdf og csv (i de sider de har
// adgang til)"): den eneste CSV-eksport der fandtes (OrdersTable.tsx) lå
// på ordre-LISTEN, som Bygger slet ikke har side-adgang til (kun enkelte
// ordredetaljer). Denne knap sidder derfor direkte på ordredetalje-siden,
// som Bygger allerede må se - ren client-side generering ud fra data der
// allerede ligger på siden, ingen ny API-adgang krævet.
//
// RUNDE 10 (§K - "den exportere kun highlevel info... byggedetaljer og
// samlet skæreliste for ordren skal eksporteres"): CSV'en har nu TO
// afsnit - produktlinjer (som før) og en fuld skæreliste pr. del, ved
// hjælp af samme delte beregning (cuttingList.ts) som selve ordresiden
// og PDF'en bruger. §I: prisen udelades helt af CSV'en for Bygger.
import { partsFor, aggregateCuttingList, fmtLen, type CuttingRowInput } from "@/lib/cuttingList";
import { TUR_LABEL } from "@/lib/calcOptions";

type Item = { productName: string; widthMm: number; heightMm: number; qty?: number; lineTotal: number };
type Measurement = {
  id: string;
  roomName?: string | null;
  tur?: string | null;
  sys?: string | null;
  tip?: string | null;
  layout?: string | null;
  kanat?: string | null;
  adet?: number | null;
  widthMm?: number | null;
  heightMm?: number | null;
  colorName?: string | null;
};

export default function OrderCsvExport({
  orderNumber, items, measurements = [], hidePrices = false
}: { orderNumber: string; items: Item[]; measurements?: Measurement[]; hidePrices?: boolean }) {
  function exportCsv() {
    const lines: string[] = [];
    const esc = (c: any) => `"${String(c ?? "").replace(/"/g, '""')}"`;
    const row = (cols: any[]) => lines.push(cols.map(esc).join(";"));

    row(["PRODUKTER"]);
    const headers = hidePrices ? ["Produkt", "Bredde (mm)", "Højde (mm)", "Antal"] : ["Produkt", "Bredde (mm)", "Højde (mm)", "Antal", "Linjepris (kr)"];
    row(headers);
    for (const it of items) {
      const cols = [it.productName, it.widthMm || "", it.heightMm || "", it.qty ?? 1];
      if (!hidePrices) cols.push(String(it.lineTotal).replace(".", ","));
      row(cols);
    }

    if (measurements.length > 0) {
      const rows: (CuttingRowInput & { id: string; roomName: string })[] = measurements.map((m) => ({
        id: m.id,
        roomName: m.roomName || "",
        tur: m.tur || "SINEKLIK",
        sys: m.sys || "1,9",
        tip: m.tip || "TEK",
        layout: m.layout || "YANA",
        kanat: m.kanat || "HAREKETLI",
        adet: m.adet || 1,
        widthMm: m.widthMm ?? null,
        heightMm: m.heightMm ?? null,
        colorName: m.colorName || ""
      }));

      row([]);
      row(["BYGGEDETALJER (pr. linje)"]);
      row(["Linje", "Produkt", "Rum", "Bredde (mm)", "Højde (mm)", "Farve", "Del", "Mål (cm) / stk."]);
      rows.forEach((r, i) => {
        const ps = partsFor(r);
        if (!ps || ps.length === 0) {
          row([i + 1, TUR_LABEL[r.tur] || r.tur, r.roomName, r.widthMm ?? "", r.heightMm ?? "", r.colorName || "", "-", "Mål mangler"]);
          return;
        }
        for (const p of ps) {
          const val = p.kind === "pile" ? `${fmtLen(p.len!)} lag` : p.kind === "count" ? `${p.qty} stk.` : `${p.qty} stk. × ${fmtLen(p.len!)} cm`;
          row([i + 1, TUR_LABEL[r.tur] || r.tur, r.roomName, r.widthMm ?? "", r.heightMm ?? "", r.colorName || "", p.label, val]);
        }
      });

      const { cutList, counts } = aggregateCuttingList(rows);
      if (cutList.length > 0 || counts.length > 0) {
        row([]);
        row(["SAMLET SKÆRELISTE"]);
        row(["System", "Del", "Mål (cm)", "Antal"]);
        for (const p of cutList) row([p.sys, p.label, `${fmtLen(p.len)} cm`, `${p.qty} stk.`]);
        for (const p of counts) row([p.sys, p.label, "-", `${p.qty} stk.`]);
      }
    }

    const csv = lines.join("\n");
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
