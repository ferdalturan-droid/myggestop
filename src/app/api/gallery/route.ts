import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const type = searchParams.get("type");
  const where: any = { isActive: true };
  if (category && category !== "alle") where.category = category;
  if (type) where.type = type;
  const items = await prisma.galleryItem.findMany({ where, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const b = await req.json();
  const item = await prisma.galleryItem.create({
    data: {
      type: b.type === "video" ? "video" : "image",
      category: b.category || "vinduer",
      url: b.url,
      thumbUrl: b.thumbUrl || "",
      title: b.title || "",
      alt: b.alt || b.title || "Myggestop",
      sortOrder: Number(b.sortOrder) || 0
    }
  });
  return NextResponse.json({ item });
}
