import OrdersTable from "@/components/admin/OrdersTable";

export const dynamic = "force-dynamic";

export default function AdminOrders() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold text-brand-ink">Ordrer</h1>
      <p className="mb-6 text-sm text-brand-ink2/65">Sog, filtrer, eksporter og administrer alle bestillinger.</p>
      <OrdersTable />
    </div>
  );
}
