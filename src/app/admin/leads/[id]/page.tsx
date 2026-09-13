import LeadDetail from "@/components/admin/LeadDetail";
export const dynamic = "force-dynamic";
export default function Page({ params }: { params: { id: string } }) {
  return <LeadDetail id={params.id} />;
}
