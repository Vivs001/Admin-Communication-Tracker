import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const session = await requireAdmin();
  const { id } = await context.params;
  const { lock } = await request.json();

  if (typeof lock !== "boolean") {
    return NextResponse.json({ error: "lock boolean required" }, { status: 400 });
  }

  const existing = await prisma.communication.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.communication.update({
    where: { id },
    data: lock
      ? {
          isLocked: true,
          lockedBy: session.name,
          lockedAt: new Date(),
        }
      : {
          isLocked: false,
          lockedBy: null,
          lockedAt: null,
        },
  });

  return NextResponse.json(updated);
}
