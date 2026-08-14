import PasswordChangeForm from "@/components/admin/PasswordChangeForm";

export const dynamic = "force-dynamic";

export default function KontoPage() {
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-brand-ink">Konto</h1>
      <p className="mt-1 text-sm text-brand-ink2/65">Skift din adminadgangskode.</p>
      <div className="mt-6">
        <PasswordChangeForm />
      </div>
    </div>
  );
}
