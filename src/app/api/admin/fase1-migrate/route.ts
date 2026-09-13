import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { runOrdersToLeadsMigration } from "@/lib/migrateOrdersToLeads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// MIDLERTIDIG RUTE - kun til engangs-migrering af Fase 1
// (Myggestop - Arkitektur-specifikation.md §7 punkt 5). Fjernes igen
// naar migreringen er koert og verificeret. Kun tilgaengelig for en
// logget ind admin (requireAdmin) og kraever eksplicit dryRun:false
// for overhovedet at skrive noget.
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const b = await req.json().catch(() => ({}));
  const dryRun = b?.dryRun !== false; // default = dry-run, skal eksplicit slaas fra
  const summary = await runOrdersToLeadsMigration({ dryRun });
  return NextResponse.json(summary);
}
