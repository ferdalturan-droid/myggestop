import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// RUNDE 10 (§E - "alle farver (gardin farve, gardin stang farve, myggenet
// farve) skal kunne oprettes under 'farve'-sektionen"): saa snart der
// findes MYGGENET-farver men slet ingen GARDIN_STOF/GARDIN_STANG-farver
// endnu (dvs. denne runde aldrig har kørt før for denne database), sås
// standardsættet brugeren selv angav ind - additivt, rører aldrig
// eksisterende farver. Samme "selvhelende default"-mønster som
// DEFAULT_IMALAT_RATES allerede bruger andre steder i kodebasen.
async function ensureDefaultColorCategories() {
  const [stofCount, stangCount] = await Promise.all([
    prisma.color.count({ where: { category: "GARDIN_STOF" } }),
    prisma.color.count({ where: { category: "GARDIN_STANG" } })
  ]);
  const toCreate: any[] = [];
  if (stofCount === 0) {
    ["Hvid", "Grå", "Orange", "Gul", "Sort"].forEach((name, i) =>
      toCreate.push({ name, hex: "#ffffff", surchargePerSqm: name === "Hvid" ? 0 : 20, isStandard: name === "Hvid", category: "GARDIN_STOF", sortOrder: i })
    );
  }
  if (stangCount === 0) {
    ["Hvid", "Grå", "Sort"].forEach((name, i) =>
      toCreate.push({ name, hex: "#ffffff", surchargePerSqm: name === "Hvid" ? 0 : 20, isStandard: name === "Hvid", category: "GARDIN_STANG", sortOrder: i })
    );
  }
  if (toCreate.length > 0) await prisma.color.createMany({ data: toCreate });
}

export async function GET() {
  await ensureDefaultColorCategories();
  const colors = await prisma.color.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ colors });
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(["COORDINATOR"]);
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
          sortOrder: Number(c.sortOrder) || i,
          category: ["MYGGENET", "GARDIN_STOF", "GARDIN_STANG"].includes(c.category) ? c.category : "MYGGENET"
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
      sortOrder: Number(b.sortOrder) || 0,
      category: ["MYGGENET", "GARDIN_STOF", "GARDIN_STANG"].includes(b.category) ? b.category : "MYGGENET"
    }
  });
  return NextResponse.json({ color });
}
