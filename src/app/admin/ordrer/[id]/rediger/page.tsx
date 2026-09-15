import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import OrderEditForm from "@/components/admin/OrderEditForm";
import ManualOrderForm from "@/components/admin/ManualOrderForm";

export const dynamic = "force-dynamic";

// RUNDE 10 (§M - "hvis manuel ordre oprettes skal pris og alle detaljer
// vedrørende ordren kunne editeres... hvis det er en ordre gennem lead, er
// prisen defineret allerede og skal derefter være fast"): denne side
// forgrener nu efter ordrens OPRINDELSE. En manuel ordre (order.leadId ==
// null) har ALDRIG haft en lead-fase med en aftalt pris, og genbruger
// derfor fuldt ud ManualOrderForm i redigerings-tilstand (frit redigerbare
// mål/farve/pris). En lead-baseret ordre beholder OrderEditForm (kunde-/
// leverings-felter) - dens produkt-/prislinjer redigeres i stedet via den
// nye, lette OrderItemsPriceEditor der er indlejret DÉR (kun fjern linje/
// justér pris, rører aldrig Lead.measurements-sandheden).
export default async function OrderEditPage({ params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: true, measurements: { orderBy: [{ itemNumber: "asc" }, { createdAt: "asc" }] } }
  });
  if (!order) notFound();
  const backHref = `/admin/ordrer/${order.id}`;

  return (
    <div>
      <Link href={backHref} className="text-sm text-brand-blue hover:underline">← Tilbage til ordre</Link>
      <h1 className="mt-3 text-2xl font-extrabold text-brand-ink">Rediger {order.orderNumber}</h1>
      <div className="mt-6 max-w-2xl">
        {order.leadId ? <OrderEditForm order={order} /> : <ManualOrderForm initialOrder={order} backHref={backHref} />}
      </div>
    </div>
  );
}
