import ColorsManager from "@/components/admin/ColorsManager";
import ProfileSizesManager from "@/components/admin/ProfileSizesManager";
export const dynamic = "force-dynamic";
export default function Page() {
  return (
    <div className="space-y-8">
      <ColorsManager />
      <ProfileSizesManager />
    </div>
  );
}
