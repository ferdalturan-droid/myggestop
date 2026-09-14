import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// MIDLERTIDIG DIAGNOSTIK (Runde 8 incident) - fjernes igen efter brug,
// samme praksis som runde7-data-wipe. Beskyttet med en simpel secret i
// query-string, da den kan afsloere raa DB-fejl.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("s");
  if (secret !== "diag8x") return NextResponse.json({ error: "nope" }, { status: 403 });

  const out: any = {};
  try {
    const leadCount = await prisma.$queryRawUnsafe(`SELECT count(*)::int AS n FROM "Lead"`);
    out.leadCount = leadCount;
  } catch (e: any) {
    out.leadCountError = String(e?.message || e);
  }
  try {
    const sourceRaw = await prisma.$queryRawUnsafe(`SELECT "source", count(*)::int AS n FROM "Lead" GROUP BY "source"`);
    out.sourceGroups = sourceRaw;
  } catch (e: any) {
    out.sourceGroupsError = String(e?.message || e);
  }
  try {
    const orderCount = await prisma.$queryRawUnsafe(`SELECT count(*)::int AS n FROM "Order"`);
    out.orderCount = orderCount;
  } catch (e: any) {
    out.orderCountError = String(e?.message || e);
  }
  try {
    const colTypes = await prisma.$queryRawUnsafe(`SELECT table_name, column_name, data_type, udt_name FROM information_schema.columns WHERE table_name IN ('Lead','Order','Measurement','Note') ORDER BY table_name, ordinal_position`);
    out.columns = colTypes;
  } catch (e: any) {
    out.columnsError = String(e?.message || e);
  }
  try {
    const viaClient = await prisma.lead.findMany({ take: 1 });
    out.prismaLeadFindManyOk = true;
    out.sample = viaClient;
  } catch (e: any) {
    out.prismaLeadFindManyError = String(e?.message || e);
  }
  try {
    const viaOrderClient = await prisma.order.findMany({ take: 1 });
    out.prismaOrderFindManyOk = true;
  } catch (e: any) {
    out.prismaOrderFindManyError = String(e?.message || e);
  }
  return NextResponse.json(out);
}
