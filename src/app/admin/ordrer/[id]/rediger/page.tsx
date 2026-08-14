import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import OrderEditForm from "@/components/admin/OrderEditForm";

export const dynamic = "force-dynamic";

export default async function OrderEditPage({ params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({ where: { id: params.id }, include: { items: true } });
  if (!order) notFound();

  return (
    <div>
      <Link href={`/admin/ordrer/${order.id}`} className="text-sm text-brand-blue hover:underline">← Tilbage til ordre</Link>
      <h1 className="mt-3 text-2xl font-extrabold text-brand-ink">Rediger {order.orderNumber}</h1>
      <div className="mt-6 max-w-2xl">
        <OrderEditForm order={order} />
      </div>
    </div>
  );
}
