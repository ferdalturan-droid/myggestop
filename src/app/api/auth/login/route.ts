import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession, setSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) return NextResponse.json({ error: "Udfyld e-mail og adgangskode." }, { status: 400 });
  const user = await prisma.adminUser.findUnique({ where: { email: String(email).toLowerCase() } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return NextResponse.json({ error: "Forkert e-mail eller adgangskode." }, { status: 401 });
  }
  const token = await createSession({ sub: user.id, email: user.email, name: user.name });
  setSessionCookie(token);
  return NextResponse.json({ ok: true });
}
