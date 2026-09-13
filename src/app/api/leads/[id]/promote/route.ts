import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/requireAdmin";
import { promoteLeadToOrderStandalone } from "@/lib/promoteLead";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// RUNDE 2 (§11.6): forfremmelse sker nu AUTOMATISK naar lead.stage saettes
// til BEKRAEFTET (se PATCH /api/leads/[id]) - denne rute er IKKE laengere
// en bruger-trykbar handling nogen steder i UI'en. Bevaret udelukkende som
// et internt sikkerhedsnet (idempotent - goer intet hvis ordren allerede
// findes), i tilfaelde af at et lead mod forventning skulle ende bekraeftet
// uden ordre.
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(["COORDINATOR"]);
  if (!auth.ok) return auth.response;
  try {
    const order = await promoteLeadToOrderStandalone(params.id);
    return NextResponse.json({ order });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Kunne ikke forfremme." }, { status: 400 });
  }
}
