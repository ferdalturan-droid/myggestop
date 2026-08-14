import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { currentPassword, newPassword } = await req.json().catch(() => ({}));
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Udfyld begge felter." }, { status: 400 });
  }
  if (String(newPassword).length < 6) {
    return NextResponse.json({ error: "Ny adgangskode skal være mindst 6 tegn." }, { status: 400 });
  }

  const user = await prisma.adminUser.findUnique({ where: { id: auth.session.sub } });
  if (!user) return NextResponse.json({ error: "Bruger ikke fundet." }, { status: 404 });

  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) return NextResponse.json({ error: "Nuværende adgangskode er forkert." }, { status: 401 });

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.adminUser.update({ where: { id: user.id }, data: { passwordHash } });
  return NextResponse.json({ ok: true });
}
