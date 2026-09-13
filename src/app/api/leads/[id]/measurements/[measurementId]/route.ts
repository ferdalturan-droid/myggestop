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
  for (const f of ["roomName", "productType", "colorName", "comment"] as const) {
    if (typeof b[f] === "string") data[f] = b[f];
  }
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
