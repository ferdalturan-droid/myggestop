import { NextResponse } from "next/server";
import { getSession } from "./auth";
import type { Role } from "@prisma/client";

export async function requireAdmin() {
  const session = await getSession();
  if (!session) {
    return { ok: false as const, response: NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 }) };
  }
  return { ok: true as const, session };
}

// FASE 2 (§4): som requireAdmin, men kraever ogsaa at sessionens rolle
// er en af de tilladte. Brug til API-routes der svarer til
// Coordinator-kun sider (produkter, priser, farver, galleri, indhold,
// seo, ordrer, indstillinger, konto).
export async function requireRole(roles: Role[]) {
  const session = await getSession();
  if (!session) {
    return { ok: false as const, response: NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 }) };
  }
  if (!roles.includes(session.role)) {
    return { ok: false as const, response: NextResponse.json({ error: "Ingen adgang for din rolle" }, { status: 403 }) };
  }
  return { ok: true as const, session };
}
