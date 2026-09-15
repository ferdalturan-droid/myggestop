import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// RUNDE 10 (§K - "det skal være muligt at markere 'færdig' for hver
// produkt... i nuværende version kan bygger ikke flytte ordren til
// installering... men bygger har ikke muligheden for at trykke 'færdig'"):
// et let, dedikeret endpoint SPECIFIKT til at flippe én linjes
// builtAt-tidsstempel, tilgængeligt for BUILDER (som ellers ikke må skrive
// til /api/orders/[id]/production - den fulde beregner-gem-rute er stadig
// Koordinator/Installatør-only, jf. authWrite() der). Dette er bevidst et
// smalt hul: kun builtAt kan sættes herfra, intet andet felt på linjen.
export async function POST(req: NextRequest, { params }: { params: { measurementId: string } }) {
  const auth = await requireRole(["COORDINATOR", "INSTALLER", "BUILDER"]);
  if (!auth.ok) return auth.response;
  const b = await req.json().catch(() => ({}));
  const existing = await prisma.measurement.findUnique({ where: { id: params.measurementId } });
  if (!existing) return NextResponse.json({ error: "Linje ikke fundet" }, { status: 404 });
  // Samme tidsstempel-konvention som den fulde beregner-gem-rute: bevar
  // eksisterende builtAt hvis den allerede er sat (undgår at nulstille
  // historikken ved gentagne toggles), sæt et nyt ved tænding, null ved slukning.
  const done = typeof b.done === "boolean" ? b.done : existing.builtAt == null;
  const builtAt = done ? existing.builtAt || new Date() : null;
  const measurement = await prisma.measurement.update({ where: { id: params.measurementId }, data: { builtAt } });
  return NextResponse.json({ measurement });
}
