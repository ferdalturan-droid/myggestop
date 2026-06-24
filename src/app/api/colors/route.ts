import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const colors = await prisma.color.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ colors });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const b = await req.json();
  // bulk replace eller enkelt oprettelse
  if (Array.isArray(b.colors)) {
    await prisma.$transaction([
      prisma.color.deleteMany({}),
      prisma.color.createMany({
        data: b.colors.map((c: any, i: number) => ({
          name: c.name || "Farve",
          hex: c.hex || "#ffffff",
          surchargePerSqm: Number(c.surchargePerSqm) || 0,
          isStandard: !!c.isStandard,
          isActive: c.isActive !== false,
          sortOrder: Number(c.sortOrder) || i
        }))
      })
    ]);
    const colors = await prisma.color.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json({ colors });
  }
  const color = await prisma.color.create({
    data: {
      name: b.name || "Farve",
      hex: b.hex || "#ffffff",
      surchargePerSqm: Number(b.surchargePerSqm) || 0,
      isStandard: !!b.isStandard,
      sortOrder: Number(b.sortOrder) || 0
    }
  });
  return NextResponse.json({ color });
}
