import { NextRequest, NextResponse } from "next/server";
import { getAllSettings, saveSetting } from "@/lib/settings";
import { requireAdmin } from "@/lib/requireAdmin";
import { AppSettings } from "@/data/defaults";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getAllSettings();
  return NextResponse.json({ settings: s });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const body = await req.json();
  const allowed: (keyof AppSettings)[] = ["pricing", "shipping", "contact", "branding", "home", "seo"];
  for (const key of allowed) {
    if (body[key]) await saveSetting(key, body[key]);
  }
  const s = await getAllSettings();
  return NextResponse.json({ settings: s });
}
