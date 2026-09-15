import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// RUNDE 10 (§E - "profilstørrelse skal også kunne oprettes i et bibliotek
// ... du skal bare oprette dem vi har markeret by default"): selv-helende
// default-seed, samme mønster som Farver - de to eksisterende, hårdkodede
// størrelser (1,9/2,8) oprettes automatisk første gang biblioteket læses,
// hvis det endnu er tomt.
async function ensureDefaults() {
  const count = await prisma.profileSize.count();
  if (count === 0) {
    await prisma.profileSize.createMany({
      data: [
        { value: "1,9", label: "1,9", sortOrder: 0 },
        { value: "2,8", label: "2,8", sortOrder: 1 }
      ]
    });
  }
}

export async function GET() {
  await ensureDefaults();
  const sizes = await prisma.profileSize.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ sizes });
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(["COORDINATOR"]);
  if (!auth.ok) return auth.response;
  const b = await req.json();
  if (Array.isArray(b.sizes)) {
    // RUNDE 10: BEMÆRK - selve prisberegningen (imalatPricing.ts) kender
    // kun to faste satser (1,9/2,8-tierne) - se schema.prisma-kommentaren
    // på ProfileSize. Vi tillader alligevel fri redigering/oprettelse her,
    // så biblioteket reelt er vedligeholdbart, som brugeren bad om.
    await prisma.$transaction([
      prisma.profileSize.deleteMany({}),
      prisma.profileSize.createMany({
        data: b.sizes.map((s: any, i: number) => ({
          value: String(s.value || "").trim() || `size-${i}`,
          label: String(s.label || s.value || "").trim() || "Størrelse",
          isActive: s.isActive !== false,
          sortOrder: Number(s.sortOrder) || i
        }))
      })
    ]);
    const sizes = await prisma.profileSize.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json({ sizes });
  }
  return NextResponse.json({ error: "Ugyldigt input" }, { status: 400 });
}
