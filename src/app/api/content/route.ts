import { NextRequest, NextResponse } from "next/server";
import { getSetting, saveSetting } from "@/lib/settings";
import { requireAdmin } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ home: await getSetting("home") });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const b = await req.json();
  if (b.home) await saveSetting("home", b.home);
  return NextResponse.json({ home: await getSetting("home") });
}
