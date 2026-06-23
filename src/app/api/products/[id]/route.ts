import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const b = await req.json();
  const data: any = {};
  const fields = ["name", "shortText", "description", "imageUrl"];
  for (const f of fields) if (f in b) data[f] = b[f];
  const nums = ["pricePerSqm", "maxWidthMm", "maxHeightMm", "minWidthMm", "minHeightMm", "sortOrder"];
  for (const f of nums) if (f in b) data[f] = Number(b[f]);
  if ("doubleDoorThresholdMm" in b) data.doubleDoorThresholdMm = b.doubleDoorThresholdMm == null || b.doubleDoorThresholdMm === "" ? null : Number(b.doubleDoorThresholdMm);
  if ("isActive" in b) data.isActive = !!b.isActive;
  if ("features" in b) data.features = Array.isArray(b.features) ? b.features : [];
  const product = await prisma.product.update({ where: { id: params.id }, data });
  return NextResponse.json({ product });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  await prisma.product.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
