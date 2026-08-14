import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Nulstiller adgangskoden UDEN at kende den nuværende — kun muligt naar man allerede
// er logget ind som admin (gyldig session). Til brug naar man har glemt sin adgangskode.
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { newPassword } = await req.json().catch(() => ({}));
  if (!newPassword || String(newPassword).length < 6) {
    return NextResponse.json({ error: "Ny adgangskode skal være mindst 6 tegn." }, { status: 400 });
  }

  const user = await prisma.adminUser.findUnique({ where: { id: auth.session.sub } });
  if (!user) return NextResponse.json({ error: "Bruger ikke fundet." }, { status: 404 });

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.adminUser.update({ where: { id: user.id }, data: { passwordHash } });
  return NextResponse.json({ ok: true });
}
