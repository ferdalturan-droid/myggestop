import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEF_RATES = { tek19: 400, tek28: 450, dub19: 500, dub28: 550 };
const DEF_PERDE_RATE = 400;

// Produktionsberegnerens priser (kr/m²) — gemmes centralt saa de er ens paa tvaers af enheder.
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const [sineklikRow, perdeRow] = await Promise.all([
    prisma.setting.findUnique({ where: { key: "prod_rates_sineklik" } }),
    prisma.setting.findUnique({ where: { key: "prod_rates_perde" } })
  ]);
  const sineklik =
    sineklikRow?.value && typeof sineklikRow.value === "object" && !Array.isArray(sineklikRow.value)
      ? { ...DEF_RATES, ...(sineklikRow.value as any) }
      : DEF_RATES;
  const perde = typeof perdeRow?.value === "number" ? perdeRow.value : DEF_PERDE_RATE;
  return NextResponse.json({ sineklik, perde });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const b = await req.json().catch(() => ({}));
  if (b.type === "PERDE") {
    const value = Number(b.value) || 0;
    await prisma.setting.upsert({ where: { key: "prod_rates_perde" }, update: { value }, create: { key: "prod_rates_perde", value } });
  } else {
    const value = b.value && typeof b.value === "object" ? b.value : {};
    await prisma.setting.upsert({ where: { key: "prod_rates_sineklik" }, update: { value }, create: { key: "prod_rates_sineklik", value } });
  }
  return NextResponse.json({ ok: true });
}
