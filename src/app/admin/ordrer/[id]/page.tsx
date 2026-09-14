import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { formatDKK } from "@/lib/pricing";
import { deriveOrderStageLabel } from "@/lib/orderStage";
import OrderStageControl from "@/components/admin/OrderStageControl";
import OrderInstallAppointment from "@/components/admin/OrderInstallAppointment";
import ImalatImportButton from "@/components/admin/ImalatImportButton";
import OrderDeleteButton from "@/components/admin/OrderDeleteButton";
import OrderCsvExport from "@/components/admin/OrderCsvExport";
import OrderBuildDetails from "@/components/admin/OrderBuildDetails";

export const dynamic = "force-dynamic";

export default async function OrderDetail({ params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      items: true,
      appointments: { include: { assignedUser: { select: { id: true, name: true } } } },
      // RUNDE 6: byggedetaljer (skæreliste) beregnes af de rigtige
      // Lead->Measurement-rækker, samme kilde som Produktionsberegneren
      // altid har brugt for ordre-koblede sessioner (§8.6/§9).
      lead: { include: { measurements: { orderBy: { itemNumber: "asc" } } } }
    }
  });
  if (!order) notFound();
  // RUNDE 4 (§G1 - "bullet proof"): et OrderItem uden reelle mål (0×0 mm)
  // er per definition ikke et rigtigt PRODUKT - vis det aldrig, uanset
  // hvordan det skulle være opstået. "Montering"/"Rabat" er BEVIDST 0×0 mm
  // (faste gebyr-/rabatlinjer) og skal undtages fra dette filter. Roden
  // til hvordan spøgelseslinjerne opstod er rettet i promoteLead.ts,
  // dette er et ekstra visningslag mod gengangere.
  const visteItems = order.items.filter((it: any) => it.productName === "Montering" || it.productName === "Rabat" || !(it.widthMm === 0 && it.heightMm === 0));

  // RUNDE 2 (§11.1/Gruppe 2): "builder ser ordre+detaljer, alt der er
  // noedvendigt, read-only - kun installer/coordinator maa redigere ordren"
  // (brugerens egen procesbeskrivelse). canEdit styrer om
  // redigerings-knapperne overhovedet vises - selve skrive-adgangen er
  // desuden haandhaevet paa API-niveau (se /api/orders/[id]), saa dette er
  // et UX-lag oveni en reel serverside-spaerring, ikke eneste forsvar.
  const session = await getSession();
  const canEdit = session?.role === "COORDINATOR" || session?.role === "INSTALLER";
  // Sletning er fortsat snaevrere end almindelig redigering (COORDINATOR-
  // only paa API-niveau, jf. /api/orders/[id] DELETE) - vis derfor kun
  // knappen naar den reelt vil virke.
  const canDelete = session?.role === "COORDINATOR";
  // RUNDE 2 (§12.1): den gamle, frie OrderStatus (Ny/Under behandling/...)
  // er fjernet fra denne side - OrderStage (afledt her) er nu den eneste
  // status en ordre viser, saa der ikke findes to statusfelter der kan
  // sige to forskellige ting om samme ordre.
  const stageLabel = deriveOrderStageLabel({
    stage: order.stage,
    readyAt: order.readyAt ? order.readyAt.toISOString() : null,
    installedAt: order.installedAt ? order.installedAt.toISOString() : null,
    wantsInstallation: order.wantsInstallation,
    deliveryMethod: order.deliveryMethod,
    handedOverAt: order.handedOverAt ? order.handedOverAt.toISOString() : null
  });
  // RUNDE 7 (§4 i procesdokumentet): "Klar til installation" kan foerst
  // saettes naar ALLE maalelinjer er markeret Færdig i beregneren.
  const alleMaalinger = order.lead?.measurements || [];
  const antalLinjerIalt = alleMaalinger.length;
  const antalLinjerFaerdig = alleMaalinger.filter((m: any) => m.builtAt != null).length;
  const alleLinjerFaerdig = antalLinjerIalt === 0 || antalLinjerFaerdig === antalLinjerIalt;

  return (
    <div>
      <Link href="/admin/ordrer" className="text-sm text-brand-blue hover:underline">← Tilbage til ordrer</Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-ink">{order.orderNumber}</h1>
          <p className="text-sm text-brand-ink2/60">
            Oprettet {new Date(order.createdAt).toLocaleString("da-DK")} · {stageLabel}
          </p>
        </div>
        <div className="flex gap-2">
          {/* RUNDE 4 (§G4): den tidligere fremtrædende "Til produktionsberegner"-
              knap er fjernet herfra - adgang til beregneren skal ikke være
              et separat, aktivt skub. Er ordren allerede leadet, findes
              linket i stedet nede i "Produkter"-kortet, som en naturlig del
              af det at redigere målene, ikke en handling for sig selv. */}
          {canEdit && !order.leadId && (
            <ImalatImportButton
              musteri={`${order.firstName} ${order.lastName}`}
              tel={order.phone}
              adres={`${order.address}, ${order.postalCode} ${order.city}`}
              orderId={order.id}
              items={order.items.map((it: any) => ({ productName: it.productName, widthMm: it.widthMm, heightMm: it.heightMm }))}
            />
          )}
          <a href={`/api/orders/${order.id}/pdf`} className="btn-primary py-2.5 text-sm" target="_blank" rel="noreferrer">Download PDF</a>
          <OrderCsvExport orderNumber={order.orderNumber} items={visteItems.map((it: any) => ({ productName: it.productName, widthMm: it.widthMm, heightMm: it.heightMm, lineTotal: it.lineTotal }))} />
          {canEdit && <Link href={`/admin/ordrer/${order.id}/rediger`} className="btn-secondary py-2.5 text-sm">Rediger</Link>}
          {canDelete && <OrderDeleteButton orderId={order.id} orderNumber={order.orderNumber} />}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <div className="rounded-xl2 border border-brand-line bg-white p-6 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-brand-ink">Produkter</h2>
              {canEdit && order.leadId && (
                <a href={`/admin/imalat?orderId=${order.id}`} className="text-sm font-semibold text-brand-greendark hover:underline">Rediger mål & pris i beregner →</a>
              )}
            </div>
            <div className="space-y-3">
              {visteItems.length === 0 && <p className="text-sm text-brand-ink2/50">Ingen produkter registreret endnu.</p>}
              {visteItems.map((it: any) => (
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
              {!order.wantsInstallation && order.deliveryMethod === "FRAGTES" && (
                <div className="flex justify-between"><span className="text-brand-ink2/60">Fragt</span><span>{order.shippingCost != null ? formatDKK(order.shippingCost) : "Ikke angivet endnu"}</span></div>
              )}
              <div className="flex justify-between border-t border-brand-line pt-2 text-base font-bold"><span>Estimeret total</span><span className="text-brand-bluedark">{formatDKK(order.estimatedTotal)}</span></div>
            </div>
          </div>
          {order.note && (
            <div className="rounded-xl2 border border-brand-line bg-white p-6 shadow-card">
              <h2 className="mb-2 font-bold text-brand-ink">Bemærkning fra kunde</h2>
              <p className="text-sm text-brand-ink2/80">{order.note}</p>
            </div>
          )}
          {/* RUNDE 6 (§"builder skal kunne trykke på en ordre også se alle
              detaljer omkring det de skal bygge og hvordan de bygger"):
              erstatter behovet for at nogen rolle skal ind i den nu
              skjulte Produktionsberegner blot for at SE byggeinfo - synlig
              for alle tre roller, da alle tre allerede kan se selve siden. */}
          <OrderBuildDetails measurements={order.lead?.measurements || []} />
          <OrderInstallAppointment
            existing={order.appointments.filter((a: any) => a.type === "INSTALLATION").map((a: any) => ({ day: a.day, time: a.time, status: a.status || "TENTATIVE", assignedUserName: a.assignedUser?.name || null }))}
          />
        </div>

        <div className="space-y-6">
          <div className="rounded-xl2 border border-brand-line bg-white p-6 shadow-card">
            <h2 className="mb-3 font-bold text-brand-ink">Kunde</h2>
            <dl className="space-y-2 text-sm">
              <div><dt className="text-brand-ink2/50">Navn</dt><dd className="font-medium text-brand-ink">{order.firstName} {order.lastName}</dd></div>
              <div><dt className="text-brand-ink2/50">Telefon</dt><dd><a className="text-brand-blue hover:underline" href={`tel:${order.phone}`}>{order.phone}</a></dd></div>
              <div><dt className="text-brand-ink2/50">E-mail</dt><dd><a className="text-brand-blue hover:underline" href={`mailto:${order.email}`}>{order.email}</a></dd></div>
              <div><dt className="text-brand-ink2/50">Adresse</dt><dd className="text-brand-ink">{order.address}, {order.postalCode} {order.city}</dd></div>
              <div><dt className="text-brand-ink2/50">Montering</dt><dd className="text-brand-ink">{order.wantsInstallation ? "Ja — montering inkluderet" : "Nej — kunden modtager selv"}</dd></div>
              {!order.wantsInstallation && (
                <div>
                  <dt className="text-brand-ink2/50">Levering</dt>
                  <dd className="text-brand-ink">
                    {order.deliveryMethod === "FRAGTES" ? "Fragtes" : "Afhenter selv"}
                    {order.deliveryMethod === "FRAGTES" && (
                      <span className="text-brand-ink2/60"> · Fragtpris: {order.shippingCost != null ? formatDKK(order.shippingCost) : "ikke angivet endnu"}</span>
                    )}
                  </dd>
                </div>
              )}
            </dl>
          </div>
          {canEdit ? (
            <div className="rounded-xl2 border border-brand-line bg-white p-6 shadow-card">
              <OrderStageControl
                orderId={order.id}
                stage={order.stage}
                readyAt={order.readyAt ? order.readyAt.toISOString() : null}
                installedAt={order.installedAt ? order.installedAt.toISOString() : null}
                role={session?.role}
                alleLinjerFaerdig={alleLinjerFaerdig}
                antalLinjerIalt={antalLinjerIalt}
                antalLinjerFaerdig={antalLinjerFaerdig}
                wantsInstallation={order.wantsInstallation}
                deliveryMethod={order.deliveryMethod}
                handedOverAt={order.handedOverAt ? order.handedOverAt.toISOString() : null}
              />
            </div>
          ) : (
            // Builder: read-only status-spejl, ingen knapper - han saetter
            // "Klar" fra sin egen Produktionskø-side (§11.1/processen), ikke
            // her. Stadiet staar allerede i headeren ovenfor, men gentages
            // her tydeligt i samme layout Coordinator/Installer ser.
            <div className="rounded-xl2 border border-brand-line bg-white p-6 shadow-card">
              <p className="mb-1 text-sm font-medium text-brand-ink2">Produktionsstadie</p>
              <p className="text-base font-bold text-brand-ink">{stageLabel}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
