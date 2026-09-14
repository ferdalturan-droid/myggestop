"use client";
import { useEffect, useState } from "react";

// RUNDE 4 (§G5): "i gang" og "klar" er nu tydelige, envejs-handlinger med
// en kort bekræftelse ("soft validation") - når en handling er udført,
// låses den (vises som en færdig-tilstand) i stedet for en knap man kan
// trykke på igen. Kun Koordinator kan fortryde en fejlagtig markering
// (se OrderStageControl.tsx på selve ordre-siden).
//
// RUNDE 6 (§"builder... skal kunne trykke på en ordre også se alle
// detaljer... hvordan de bygger"): "Åbn" peger nu på selve ordredetaljen
// (som nu indeholder byggedetaljer/skæreliste), ikke længere direkte ind i
// den skjulte Produktionsberegner - Coordinator får desuden fortsat et
// separat redigerings-link til beregneren, da han (modsat Bygger) reelt
// må ændre mål/pris der.
// RUNDE 6 (§"note: Installer skal kunne se produktion... fordi de har en
// bredere arbejdsgang"): readOnly skjuler handlingsknapperne, så Installer
// kan se produktionskøen som ren kontekst uden en knap han alligevel ikke
// må bruge (API'et afviser ham allerede, men en knap der altid fejler er
// forvirrende UX).
export default function ProduktionList({ role, readOnly = false }: { role?: string; readOnly?: boolean } = {}) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const erKoordinator = role === "COORDINATOR";

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/produktion", { cache: "no-store" });
      const d = await res.json();
      setOrders(d.orders || []);
    } catch {}
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function markerKlar(id: string) {
    if (!confirm("Markér ordren som klar til installation? Den bliver herefter synlig for installatøren, og kan ikke ændres af dig igen.")) return;
    const res = await fetch(`/api/produktion/${id}/klar`, { method: "POST" });
    if (res.ok) { setMsg("Markeret klar til installation ✓"); setTimeout(() => setMsg(null), 2000); load(); }
    else { const d = await res.json().catch(() => ({})); setMsg(d.error || "Kunne ikke markere klar."); setTimeout(() => setMsg(null), 3000); }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-ink">Produktionskø</h1>
          <p className="mt-1 text-sm text-brand-ink2/65">{readOnly ? "Ordrer der er i produktion lige nu (læs kun)." : "Ordrer der er forfremmet til produktion, i den rækkefølge de er booket."}</p>
        </div>
        <button onClick={load} className="btn-secondary py-2 text-sm">Opdater</button>
      </div>
      {msg && <p className="mb-3 text-sm font-medium text-brand-greendark">{msg}</p>}
      {loading && <p className="text-brand-ink2/60">Indlæser...</p>}
      {!loading && orders.length === 0 && <div className="rounded-xl border border-brand-line bg-white p-8 text-center text-brand-ink2/60">Ingen ordrer i produktion lige nu.</div>}
      <div className="space-y-2">
        {orders.map((o) => (
          <div key={o.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-line bg-white px-4 py-3 text-sm">
            <div>
              <span className="font-semibold text-brand-ink">{o.orderNumber} · {o.firstName} {o.lastName}</span>
              <span className="ml-2 text-brand-ink2/55">{o.items?.length || 0} produkt(er) · {o.city}</span>
              {o.readyAt && <span className="ml-2 rounded-full bg-brand-greendark/15 px-2 py-0.5 text-xs font-semibold text-brand-greendark">Klar til installation ✓</span>}
              {/* RUNDE 7 (§4 i procesdokumentet): fremdrift pr. ordre, saa
                  Byggeren kan se hvor langt han er UDEN at aabne hver ordre. */}
              {!o.readyAt && o.antalLinjerIalt > 0 && (
                <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${o.alleLinjerFaerdig ? "bg-brand-greendark/15 text-brand-greendark" : "bg-brand-mist text-brand-ink2/70"}`}>
                  {o.antalLinjerFaerdig} af {o.antalLinjerIalt} linjer færdig
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <a href={`/admin/ordrer/${o.id}`} className="font-semibold text-brand-blue hover:underline">Se ordre & byggedetaljer</a>
              {erKoordinator && !readOnly && <a href={`/admin/imalat?orderId=${o.id}`} className="text-brand-ink2/60 hover:underline">Rediger i beregner</a>}
              {!readOnly && !o.readyAt && (
                <button
                  onClick={() => markerKlar(o.id)}
                  disabled={!o.alleLinjerFaerdig}
                  title={!o.alleLinjerFaerdig ? "Marker alle linjer Færdig i beregneren først" : undefined}
                  className="rounded-full border border-brand-greendark px-3 py-1 text-xs font-semibold text-brand-greendark hover:bg-green-50 disabled:cursor-not-allowed disabled:border-brand-line disabled:text-brand-ink2/40 disabled:hover:bg-transparent"
                >
                  Klar til installation
                </button>
              )}
              {!readOnly && o.readyAt && erKoordinator && (
                <span className="text-xs text-brand-ink2/40">Fortryd på ordresiden ved fejl</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
