import { NextRequest, NextResponse } from "next/server";
import { getSetting, saveSetting } from "@/lib/settings";
import { requireAdmin } from "@/lib/requireAdmin";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ seo: await getSetting("seo") });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const b = await req.json();
  if (b.seo) await saveSetting("seo", b.seo);
  return NextResponse.json({ seo: await getSetting("seo") });
}
