import { NextResponse } from "next/server";
import { getSession } from "./auth";

export async function requireAdmin() {
  const session = await getSession();
  if (!session) {
    return { ok: false as const, response: NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 }) };
  }
  return { ok: true as const, session };
}
