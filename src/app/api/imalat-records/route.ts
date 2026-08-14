import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function keyFor(type: string) {
  return type === "PERDE" ? "perde_saved_records" : "imalat_saved_records";
}

// Gemte produktionsordrer (Myggenet/Gardin) gemmes centralt i databasen (Setting-tabellen),
// saa de er synlige paa tvaers af enheder/browsere — ikke kun lokalt i localStorage.
export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const type = req.nextUrl.searchParams.get("type") || "SINEKLIK";
  const row = await prisma.setting.findUnique({ where: { key: keyFor(type) } });
  const items = Array.isArray(row?.value) ? (row!.value as any[]) : [];
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const b = await req.json().catch(() => ({}));
  const type = b.type === "PERDE" ? "PERDE" : "SINEKLIK";
  const items = Array.isArray(b.items) ? b.items.slice(0, 50) : [];
  await prisma.setting.upsert({
    where: { key: keyFor(type) },
    update: { value: items as any },
    create: { key: keyFor(type), value: items as any }
  });
  return NextResponse.json({ ok: true });
}
