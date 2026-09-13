import { redirect } from "next/navigation";

// RUNDE 6 (§G7): denne side er foldet ind i /admin/ordrer (Koordinatorens
// samlede ordre-overblik) - bevaret som et redirect, saa evt. gamle
// bogmærker/links fortsat virker.
export default function OrdrestatusPage() {
  redirect("/admin/ordrer");
}
