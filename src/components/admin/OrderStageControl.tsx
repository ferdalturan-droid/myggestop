"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { deriveOrderStageLabel } from "@/lib/orderStage";

// RUNDE 2 (Q4/§6.5/§6.7): KOE -> I_PRODUKTION er en BEVIDST koordinator-
// handling ("Send til produktion"), ikke automatik og ikke et frit
// dropdown-valg - det er en menneskelig kalendervurdering (er der plads?),
// modsat Bekræftet->Order som er et udledeligt faktum (§11.6). Klar/
// Installeret er FORTSAT rene datoer, aldrig et stadie-valg (§6.3,
// uændret). Betalt/Anmeldt er Coordinators afsluttende handlinger.
//
// RUNDE 4 (§G5/§G6): proces-rækkefølgen er nu en reel regel, ikke kun en
// visuel antydning - "man først flytter en opgave til produktion, og
// derefter kan flytte til installeringsfasen. Begge ting kan ikke ske
// samtidigt". Og: "Klar" er reelt Byggerens handling (sættes normalt fra
// Produktionskøen), "Installeret" er Installatørens - denne side viser nu
// kun de knapper der giver mening for DEN rolle der ser den, hver
// markering kræver en kort bekræftelse ("soft validation"), og når den er
// sat, låses den (vises som en færdig-tilstand, ikke en knap man kan
// trykke på igen) - kun Koordinator kan fortryde en fejlagtig markering.
export default function OrderStageControl({
  orderId, stage, readyAt, installedAt, role, alleLinjerFaerdig = true, antalLinjerIalt = 0, antalLinjerFaerdig = 0
}: {
  orderId: string; stage: string; readyAt: string | null; installedAt: string | null; role?: string;
  // RUNDE 7 (§4 i procesdokumentet): "Færdig"-markeringen pr. linje i
  // beregneren spærrer nu reelt for "Klar til installation", indtil ALLE
  // linjer er markeret - ellers betød markeringen ingenting ("er der en
  // grund til den, og afspejler den logisk noget?"). Default true, saa en
  // ordre uden nogen linjer (manuel ordre) aldrig spærres unødigt.
  alleLinjerFaerdig?: boolean; antalLinjerIalt?: number; antalLinjerFaerdig?: number;
}) {
  const router = useRouter();
  const [s, setS] = useState(stage);
  const [ready, setReady] = useState(readyAt);
  const [installed, setInstalled] = useState(installedAt);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const erKoordinator = role === "COORDINATOR";

  async function saetStage(next: string, extra: any = {}) {
    setSaving(true);
    setErr(null);
    const res = await fetch(`/api/orders/${orderId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stage: next, ...extra }) });
    setSaving(false);
    if (res.ok) { setS(next); setMsg("Gemt ✓"); setTimeout(() => setMsg(null), 1800); router.refresh(); }
    else { const d = await res.json().catch(() => ({})); setErr(d.error || "Kunne ikke gemme."); }
  }

  async function markerKlar() {
    if (!confirm("Markér ordren som klar i produktion? Den bliver herefter synlig for installation.")) return;
    setErr(null);
    const res = await fetch(`/api/produktion/${orderId}/klar`, { method: "POST" });
    const d = await res.json();
    if (res.ok) { setReady(d.order.readyAt); router.refresh(); } else setErr(d.error || "Kunne ikke markere klar.");
  }
  async function fortrydKlar() {
    if (!confirm("Fortryd 'Klar'? Brug kun dette ved en fejlregistrering.")) return;
    const res = await fetch(`/api/produktion/${orderId}/klar`, { method: "DELETE" });
    const d = await res.json();
    if (res.ok) { setReady(null); router.refresh(); }
  }
  async function markerInstalleret() {
    if (!confirm("Markér ordren som installeret hos kunden?")) return;
    setErr(null);
    const res = await fetch(`/api/installation/${orderId}/installeret`, { method: "POST" });
    const d = await res.json();
    if (res.ok) { setInstalled(d.order.installedAt); router.refresh(); } else setErr(d.error || "Kunne ikke markere installeret.");
  }
  async function fortrydInstalleret() {
    if (!confirm("Fortryd 'Installeret'? Brug kun dette ved en fejlregistrering.")) return;
    const res = await fetch(`/api/installation/${orderId}/installeret`, { method: "DELETE" });
    const d = await res.json();
    if (res.ok) { setInstalled(null); router.refresh(); }
  }

  const visning = deriveOrderStageLabel({ stage: s, readyAt: ready, installedAt: installed });

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-brand-ink2">Produktionsstadie</label>
      <p className="mb-3 text-base font-bold text-brand-ink">{visning}</p>

      {s === "KOE" && (
        <div className="rounded-lg border border-dashed border-brand-line bg-brand-mist/30 p-3">
          {/* RUNDE 8 ("Calendar (tentative and fixed) can only be created
              directly from calendar, i dont want any ui possiblity to
              auto-create as it confuses"): dette er nu KUN et stadie-skift.
              Naar byggeren reelt skal planlaegges, opretter Koordinator selv
              en Produktion-aftale hos den navngivne bygger fra Kalender-
              siden (soeg efter ordrenummeret der for at koble den). */}
          <p className="mb-2 text-xs text-brand-ink2/60">Ordren ligger i køen (backlog). Når den er klar til at blive bygget, sender du den til produktion herunder — book selve arbejdet hos en bygger fra Kalender-siden, når det er planlagt.</p>
          <button
            disabled={saving}
            onClick={() => { if (confirm("Send ordren til produktion?")) saetStage("I_PRODUKTION"); }}
            className="btn-primary py-2 text-sm disabled:opacity-50"
          >
            Send til produktion
          </button>
        </div>
      )}

      {s === "I_PRODUKTION" && (
        <div className="space-y-2">
          {/* RUNDE 4 (§G5): "Klar" er Byggerens handling (sættes normalt
              fra Produktionskøen) - her vises den kun som Koordinatorens
              mulighed for selv at markere/rette den, IKKE til Installatør. */}
          {ready ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-brand-greendark px-3 py-1.5 text-xs font-semibold text-white">Klar til installation ✓ ({new Date(ready).toLocaleDateString("da-DK")})</span>
              {erKoordinator && <button onClick={fortrydKlar} className="text-xs font-medium text-red-500 hover:underline">Fortryd (kun ved fejl)</button>}
            </div>
          ) : erKoordinator ? (
            <div>
              {/* RUNDE 7 (§4 i procesdokumentet): kan foerst markeres naar
                  ALLE maalelinjer er "Færdig" i beregneren - ellers betyder
                  Færdig-fluebenet ingenting reelt. */}
              <button
                onClick={markerKlar}
                disabled={!alleLinjerFaerdig}
                title={!alleLinjerFaerdig ? `${antalLinjerFaerdig} af ${antalLinjerIalt} linjer er markeret Færdig i beregneren - alle skal være det først` : undefined}
                className="rounded-full border border-brand-line px-3 py-1.5 text-xs font-semibold text-brand-ink2 hover:bg-brand-mist disabled:opacity-40"
              >
                Klar til installation
              </button>
              {!alleLinjerFaerdig && antalLinjerIalt > 0 && (
                <p className="mt-1 text-xs text-amber-700">{antalLinjerFaerdig} af {antalLinjerIalt} linjer markeret Færdig i beregneren — marker alle før ordren kan sendes videre.</p>
              )}
            </div>
          ) : (
            <p className="text-xs text-brand-ink2/50">Afventer at byggeren markerer ordren klar til installation.</p>
          )}

          {installed ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-brand-greendark px-3 py-1.5 text-xs font-semibold text-white">Installeret ✓ ({new Date(installed).toLocaleDateString("da-DK")})</span>
              {erKoordinator && <button onClick={fortrydInstalleret} className="text-xs font-medium text-red-500 hover:underline">Fortryd (kun ved fejl)</button>}
            </div>
          ) : (
            (erKoordinator || role === "INSTALLER") && (
              <button onClick={markerInstalleret} disabled={!ready} title={!ready ? "Ordren skal være markeret klar i produktion først" : undefined} className="rounded-full border border-brand-line px-3 py-1.5 text-xs font-semibold text-brand-ink2 hover:bg-brand-mist disabled:opacity-40">
                Marker Installeret
              </button>
            )
          )}
        </div>
      )}

      {/* RUNDE 4 (§G6): "Markér betalt"/"Markér anmeldt" er nu KUN synligt
          og brugbart for Koordinator - ingen andre roller. */}
      {erKoordinator && (s === "I_PRODUKTION" || s === "BETALT" || s === "ANMELDT") && installed && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-brand-line pt-3">
          <button disabled={saving || s !== "I_PRODUKTION"} onClick={() => { if (confirm("Markér ordren som betalt?")) saetStage("BETALT"); }} className={`rounded-full px-3 py-1.5 text-xs font-semibold disabled:opacity-40 ${s === "BETALT" || s === "ANMELDT" ? "bg-brand-greendark text-white" : "border border-brand-line text-brand-ink2 hover:bg-brand-mist"}`}>
            {s === "BETALT" || s === "ANMELDT" ? "Betalt ✓" : "Markér betalt"}
          </button>
          <button disabled={saving || s !== "BETALT"} onClick={() => { if (confirm("Markér ordren som anmeldt?")) saetStage("ANMELDT"); }} className={`rounded-full px-3 py-1.5 text-xs font-semibold disabled:opacity-40 ${s === "ANMELDT" ? "bg-brand-greendark text-white" : "border border-brand-line text-brand-ink2 hover:bg-brand-mist"}`}>
            {s === "ANMELDT" ? "Anmeldt ✓" : "Markér anmeldt"}
          </button>
        </div>
      )}
      {msg && <p className="mt-2 text-sm font-medium text-brand-greendark">{msg}</p>}
      {err && <p className="mt-2 text-sm font-medium text-red-600">{err}</p>}
    </div>
  );
}
