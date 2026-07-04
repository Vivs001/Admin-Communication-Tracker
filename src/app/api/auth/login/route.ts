import { NextRequest, NextResponse } from "next/server";
import { createSession, destroySession, verifyPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "Password required" }, { status: 400 });
    }

    const session = verifyPassword(password);
    if (!session) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    await createSession(session.role, session.name);
    return NextResponse.json({ role: session.role, name: session.name });
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}

export async function DELETE() {
  await destroySession();
  return NextResponse.json({ ok: true });
}
