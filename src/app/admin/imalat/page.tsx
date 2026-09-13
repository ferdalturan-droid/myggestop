import { Suspense } from "react";
import ImalatCalc from "@/components/admin/ImalatCalc";
export const dynamic = "force-dynamic";
export default function Page() {
  return (
    <Suspense fallback={null}>
      <ImalatCalc />
    </Suspense>
  );
}
