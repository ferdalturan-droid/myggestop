import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// FASE 3 (§6.2/§6.3): COORDINATOR redigerer forventede linjer,
// INSTALLER udfylder de reelle mål ved opmaalingsbesoeget - samme
// endpoint, begge roller maa saette widthMm/heightMm.
export async function PATCH(req: NextRequest, { params }: { params: { measurementId: string } }) {
  const auth = await requireRole(["COORDINATOR", "INSTALLER"]);
  if (!auth.ok) return auth.response;
  const b = await req.json().catch(() => ({}));
  const data: any = {};
  for (const f of ["roomName", "productType", "colorName", "comment", "tur", "sys", "tip", "kanat"] as const) {
    if (typeof b[f] === "string") data[f] = b[f];
  }
  // RUNDE 2 (§11.3): "model" hedder "layout" i skemaet (undgaar navnekollision
  // med Prisma's eget model-begreb) - accepterer begge nøglenavne fra klienten.
  if (typeof b.layout === "string") data.layout = b.layout;
  else if (typeof b.model === "string") data.layout = b.model;
  if (typeof b.adet === "number" || typeof b.adet === "string") data.adet = Math.max(1, Math.round(Number(b.adet) || 1));
  if ("widthMm" in b) data.widthMm = b.widthMm === null || b.widthMm === "" ? null : Number(b.widthMm);
  if ("heightMm" in b) data.heightMm = b.heightMm === null || b.heightMm === "" ? null : Number(b.heightMm);
  const measurement = await prisma.measurement.update({ where: { id: params.measurementId }, data });
  return NextResponse.json({ measurement });
}

export async function DELETE(_req: NextRequest, { params }: { params: { measurementId: string } }) {
  const auth = await requireRole(["COORDINATOR"]);
  if (!auth.ok) return auth.response;
  await prisma.measurement.delete({ where: { id: params.measurementId } });
  return NextResponse.json({ ok: true });
}
