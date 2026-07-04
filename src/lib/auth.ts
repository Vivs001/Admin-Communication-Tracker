import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { Role } from "./constants";

const COOKIE_NAME = "nbrrmd_session";

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  role: Role;
  name: string;
}

export async function createSession(role: Role, name: string) {
  const token = await new SignJWT({ role, name })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      role: payload.role as Role,
      name: payload.name as string,
    };
  } catch {
    return null;
  }
}

export function verifyPassword(password: string): SessionPayload | null {
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin.viv";
  const userPassword = process.env.USER_PASSWORD ?? "viv.md";

  if (password === adminPassword) {
    return { role: "ADMIN", name: "Administrator" };
  }
  if (password === userPassword) {
    return { role: "USER", name: "NBRRMD User" };
  }
  return null;
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

export async function requireAdmin(): Promise<SessionPayload> {
  const session = await requireSession();
  if (session.role !== "ADMIN") throw new Error("Forbidden");
  return session;
}
