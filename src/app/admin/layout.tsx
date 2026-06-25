import Link from "next/link";
import { headers } from "next/headers";
import { getSession } from "@/lib/auth";
import AdminNav from "@/components/admin/AdminNav";

export const metadata = { title: "Admin · Myggestop", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const h = headers();
  const path = h.get("x-invoke-path") || h.get("x-pathname") || "";
  const session = await getSession();
  // login-siden har sin egen fulde skærm
  if (!session) {
    return <>{children}</>;
  }
  return (
    <div className="min-h-screen bg-brand-mist">
      <div className="flex">
        <AdminNav email={session.email} />
        <div className="min-h-screen flex-1 lg:pl-64">
          <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
