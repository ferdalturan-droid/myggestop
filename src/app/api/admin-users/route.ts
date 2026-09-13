import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// FASE 2 (§5): minimal admin-opret-bruger-funktion, kun for COORDINATOR.
// Bruges til at oprette Builder-/Installer-konti med en midlertidig
// adgangskode.
export async function GET() {
  const auth = await requireRole(["COORDINATOR"]);
  if (!auth.ok) return auth.response;
  const users = await prisma.adminUser.findMany({
    select: { id: true, email: true, name: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" }
  });
  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(["COORDINATOR"]);
  if (!auth.ok) return auth.response;
  const b = await req.json().catch(() => ({}));
  const email = String(b.email || "").trim().toLowerCase();
  const name = String(b.name || "").trim() || "Bruger";
  const role = ["COORDINATOR", "BUILDER", "INSTALLER"].includes(b.role) ? b.role : "BUILDER";
  const password = String(b.password || "");
  if (!email || !email.includes("@")) return NextResponse.json({ error: "Ugyldig e-mail." }, { status: 400 });
  if (password.length < 6) return NextResponse.json({ error: "Adgangskode skal vaere mindst 6 tegn." }, { status: 400 });

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "En bruger med denne e-mail findes allerede." }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.adminUser.create({
    data: { email, name, role, passwordHash },
    select: { id: true, email: true, name: true, role: true, createdAt: true }
  });
  return NextResponse.json({ user });
}
