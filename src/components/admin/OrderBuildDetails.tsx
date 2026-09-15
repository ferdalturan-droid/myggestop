"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { partsFor, aggregateCuttingList, fmtLen, type CuttingRowInput } from "@/lib/cuttingList";
import { TUR_LABEL, TIP_LABEL, LAYOUT_LABEL, KANAT_LABEL, felterRelevanteForTur } from "@/lib/calcOptions";

// RUNDE 6 (§"builder skal kunne trykke på en ordre også se alle detaljer
// omkring det de skal bygge og hvordan de bygger... fjern 'production
// beregning' og flyt informationen ind i de respektive sider"): denne
// read-only visning erstatter behovet for at Bygger nogensinde skal ind i
// den (nu skjulte) Produktionsberegner blot for at SE hvad der skal
// bygges - den bruger nøjagtig samme beregning (src/lib/cuttingList.ts)
// som beregneren selv, så de aldrig kan vise to forskellige svar.
//
// RUNDE 10 (§K - "det skal være muligt at markere 'færdig' for hver
// produkt... men bygger har ikke muligheden for at trykke 'færdig'"): et
// "Færdig"-tjekmærke er nu tilføjet direkte her, pr. linje, via det nye
// lette /api/measurements/[id]/faerdig-endpoint (tilgængeligt for alle tre
// roller) - ikke laengere kun muligt inde i den skjulte beregner.
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
  builtAt?: string | Date | null;
};

function mmToCm(mm?: number | null) {
  if (mm == null) return "-";
  return (mm / 10).toString().replace(".", ",");
}

export default function OrderBuildDetails({ measurements }: { measurements: Measurement[] }) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);
  const [showListe, setShowListe] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  // RUNDE 10 (§K): optimistisk lokal builtAt-tilstand, så et klik føles
  // øjeblikkeligt - den efterfølgende router.refresh() henter den
  // autoritative sandhed (og opdaterer "0 af 2 linjer færdig"-tælleren i
  // OrderStageControl, som beregnes server-side på selve siden).
  const [builtOverride, setBuiltOverride] = useState<Record<string, boolean>>({});

  async function toggleFaerdig(id: string, currentlyDone: boolean) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/measurements/${id}/faerdig`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ done: !currentlyDone })
      });
      if (res.ok) {
        setBuiltOverride((prev) => ({ ...prev, [id]: !currentlyDone }));
        router.refresh();
      }
    } finally {
      setBusyId(null);
    }
  }

  const rows: (CuttingRowInput & { id: string })[] = useMemo(
    () =>
      measurements.map((m) => ({
        id: m.id,
        tur: m.tur || "SINEKLIK",
        sys: m.sys || "1,9",
        tip: m.tip || "TEK",
        layout: m.layout || "YANA",
        kanat: m.kanat || "HAREKETLI",
        adet: m.adet || 1,
        widthMm: m.widthMm ?? null,
        heightMm: m.heightMm ?? null,
        colorName: m.colorName || ""
      })),
    [measurements]
  );

  const { cutList, counts } = useMemo(() => aggregateCuttingList(rows), [rows]);

  if (measurements.length === 0) {
    return (
      <div className="rounded-xl2 border border-brand-line bg-white p-6 shadow-card">
        <h2 className="mb-2 font-bold text-brand-ink">Byggedetaljer</h2>
        <p className="text-sm text-brand-ink2/60">Denne ordre har ingen registrerede måle-/opsætningsdetaljer (typisk fordi den er oprettet manuelt uden et lead bagved) — se produktlisten ovenfor for mål og priser.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl2 border border-brand-line bg-white p-6 shadow-card">
      <h2 className="mb-1 font-bold text-brand-ink">Byggedetaljer</h2>
      <p className="mb-4 text-sm text-brand-ink2/60">Sådan skal hver linje bygges, og den samlede skæreliste. Samme beregning som i beregneren — kun visning, redigeres på leadet/i beregneren.</p>

      <div className="space-y-2">
        {rows.map((r, i) => {
          const m = measurements[i];
          const ps = partsFor(r);
          const rel = felterRelevanteForTur(r.tur);
          const open = openId === r.id;
          const erFaerdig = builtOverride[r.id] ?? m.builtAt != null;
          return (
            <div key={r.id} className={`rounded-xl border ${erFaerdig ? "border-brand-green/40 bg-brand-green/5" : "border-brand-line"}`}>
              <div className="flex w-full flex-wrap items-center justify-between gap-2 px-4 py-3">
                <button type="button" onClick={() => setOpenId(open ? null : r.id)} className="flex flex-1 items-center gap-2 text-left text-sm font-bold text-brand-ink">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-greendark text-xs text-white">{i + 1}</span>
                  {TUR_LABEL[r.tur] || r.tur}
                  {m.roomName ? ` · ${m.roomName}` : ""}
                  <span className="font-normal text-brand-ink2/60">{mmToCm(r.widthMm)}×{mmToCm(r.heightMm)} cm{r.colorName ? ` · ${r.colorName}` : ""}</span>
                </button>
                <div className="flex items-center gap-2">
                  {/* RUNDE 10 (§K): "Færdig"-tjekmærke direkte her, pr. linje - virker for alle tre roller. */}
                  <button
                    type="button"
                    onClick={() => toggleFaerdig(r.id, erFaerdig)}
                    disabled={busyId === r.id}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition disabled:opacity-50 ${erFaerdig ? "bg-brand-greendark text-white" : "border border-brand-line text-brand-ink2 hover:bg-brand-mist"}`}
                  >
                    {busyId === r.id ? "..." : erFaerdig ? "Færdig ✓" : "Markér færdig"}
                  </button>
                  <button type="button" onClick={() => setOpenId(open ? null : r.id)} className="text-xs font-semibold text-brand-greendark">{open ? "Skjul ▲" : "Vis detaljer ▼"}</button>
                </div>
              </div>
              {open && (
                <div className="border-t border-brand-line bg-brand-mist/40 px-4 py-3">
                  <div className="mb-2 flex flex-wrap gap-3 text-xs text-brand-ink2/70">
                    {rel.sys && <span>System: <b className="text-brand-ink">{r.sys}</b></span>}
                    {rel.tip && <span>Type: <b className="text-brand-ink">{TIP_LABEL[r.tip] || r.tip}</b></span>}
                    {rel.layout && <span>Retning: <b className="text-brand-ink">{LAYOUT_LABEL[r.layout] || r.layout}</b></span>}
                    {rel.kanat && <span>Fløj: <b className="text-brand-ink">{KANAT_LABEL[r.kanat] || r.kanat}</b></span>}
                    <span>Antal: <b className="text-brand-ink">{r.adet}</b></span>
                  </div>
                  {ps && ps.length > 0 ? (
                    <div className="grid gap-1.5 text-sm sm:grid-cols-2">
                      {ps.map((p, idx) => (
                        <div key={p.label + idx} className="flex justify-between rounded bg-white px-3 py-1.5">
                          <span className="text-brand-ink2/70">{p.label}</span>
                          <span className="font-semibold text-brand-ink">{p.kind === "pile" ? `${fmtLen(p.len!)} lag` : p.kind === "count" ? `${p.qty} stk.` : `${p.qty} stk. × ${fmtLen(p.len!)} cm`}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-brand-ink2/50">Mål mangler endnu for denne linje — skærelisten kan ikke beregnes før mål er indtastet.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {(cutList.length > 0 || counts.length > 0) && (
        <div className="mt-6">
          <button type="button" onClick={() => setShowListe((s) => !s)} className="flex w-full items-center justify-between rounded-xl border border-brand-line bg-brand-mist/50 px-4 py-3 text-left">
            <span>
              <span className="text-base font-bold text-brand-ink">Samlet skæreliste</span>
              <span className="ml-2 text-sm text-brand-ink2/55">{cutList.length + counts.length} dele</span>
            </span>
            <span className="text-sm font-semibold text-brand-greendark">{showListe ? "Skjul ▲" : "Vis ▼"}</span>
          </button>
          {showListe && (
            <div className="mt-3 overflow-x-auto rounded-xl border border-brand-line">
              <table className="w-full min-w-[420px] text-sm">
                <thead>
                  <tr className="bg-brand-mist text-left text-xs uppercase tracking-wide text-brand-ink2/60">
                    <th className="px-3 py-2">System</th>
                    <th className="px-3 py-2">Del</th>
                    <th className="px-3 py-2">Mål</th>
                    <th className="px-3 py-2">Antal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-line">
                  {cutList.map((p, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2 text-brand-ink2/70">{p.sys}</td>
                      <td className="px-3 py-2 font-medium text-brand-ink">{p.label}</td>
                      <td className="px-3 py-2 font-semibold text-brand-ink">{fmtLen(p.len)} cm</td>
                      <td className="px-3 py-2 text-brand-ink">{p.qty} stk.</td>
                    </tr>
                  ))}
                  {counts.map((p, idx) => (
                    <tr key={"c" + idx} className="bg-brand-mist/40">
                      <td className="px-3 py-2 text-brand-ink2/70">{p.sys}</td>
                      <td className="px-3 py-2 font-medium text-brand-ink">{p.label}</td>
                      <td className="px-3 py-2 text-brand-ink2/50">—</td>
                      <td className="px-3 py-2 text-brand-ink">{p.qty} stk.</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
