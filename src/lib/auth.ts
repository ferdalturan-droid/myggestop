import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import type { Role } from "@prisma/client";

const COOKIE = "myg_admin";
const ALG = "HS256";

function secret(): Uint8Array {
  const s = process.env.AUTH_SECRET || "dev-only-secret-change-me-please-32chars";
  return new TextEncoder().encode(s);
}

export interface SessionPayload {
  sub: string; // admin id
  email: string;
  name: string;
  role: Role; // FASE 2 (§3.1/§5)
}

export async function createSession(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ email: payload.email, name: payload.name, role: payload.role })
    .setProtectedHeader({ alg: ALG })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    // FASE 2: sessioner udstedt foer rollefeltet blev tilfoejet har intet
    // "role"-claim - de behandles som COORDINATOR (den eneste rolle der
    // fandtes foer ombygningen), saa ingen bliver logget ud af skiftet.
    const role = (payload.role as Role) || "COORDINATOR";
    return {
      sub: String(payload.sub),
      email: String(payload.email),
      name: String(payload.name),
      role
    };
  } catch {
    return null;
  }
}

export function setSessionCookie(token: string) {
  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
}

export function clearSessionCookie() {
  cookies().set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

/** Til server components / route handlers. */
export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

/** Til middleware (NextRequest). */
export async function getSessionFromRequest(req: NextRequest): Promise<SessionPayload | null> {
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export const COOKIE_NAME = COOKIE;
