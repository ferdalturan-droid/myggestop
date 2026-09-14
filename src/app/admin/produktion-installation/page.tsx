import { redirect } from "next/navigation";

// RUNDE 8: siden er omdøbt til /admin/mine-opgaver (delta §1).
export default function Page() {
  redirect("/admin/mine-opgaver");
}
