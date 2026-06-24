import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const products = await prisma.product.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ products });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const b = await req.json();
  const slug = (b.slug || b.name || "produkt").toString().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const product = await prisma.product.create({
    data: {
      slug: slug + "-" + Math.random().toString(36).slice(2, 6),
      name: b.name || "Nyt produkt",
      shortText: b.shortText || "",
      description: b.description || "",
      pricePerSqm: Number(b.pricePerSqm) || 0,
      maxWidthMm: Number(b.maxWidthMm) || 2500,
      maxHeightMm: Number(b.maxHeightMm) || 2500,
      minWidthMm: Number(b.minWidthMm) || 150,
      minHeightMm: Number(b.minHeightMm) || 150,
      doubleDoorThresholdMm: b.doubleDoorThresholdMm == null || b.doubleDoorThresholdMm === "" ? null : Number(b.doubleDoorThresholdMm),
      isActive: b.isActive !== false,
      sortOrder: Number(b.sortOrder) || 0,
      imageUrl: b.imageUrl || "",
      features: Array.isArray(b.features) ? b.features : []
    }
  });
  return NextResponse.json({ product });
}
