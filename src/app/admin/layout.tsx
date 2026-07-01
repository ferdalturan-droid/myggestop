import { getSession } from "@/lib/auth";
import AdminNav from "@/components/admin/AdminNav";

export const metadata = { title: "Admin · Myggestop", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) return <>{children}</>;
  return (
    <div className="min-h-screen bg-brand-mist">
      <AdminNav email={session.email} />
      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-8 sm:py-8">{children}</div>
      </main>
    </div>
  );
}
