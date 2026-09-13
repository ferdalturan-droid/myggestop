import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { token, newPassword } = await req.json().catch(() => ({}));
  if (!token || !newPassword || String(newPassword).length < 6) {
    return NextResponse.json({ error: "Ugyldigt link eller for kort adgangskode (min. 6 tegn)." }, { status: 400 });
  }
  const user = await prisma.adminUser.findUnique({ where: { resetToken: String(token) } });
  if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
    return NextResponse.json({ error: "Linket er ugyldigt eller udløbet. Bed om et nyt." }, { status: 400 });
  }
  const passwordHash = await bcrypt.hash(String(newPassword), 10);
  await prisma.adminUser.update({ where: { id: user.id }, data: { passwordHash, resetToken: null, resetTokenExpiry: null } });
  return NextResponse.json({ ok: true });
}
