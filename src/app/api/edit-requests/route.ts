import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  communicationId: z.string(),
  requestedFields: z.record(z.unknown()),
  reason: z.string().optional(),
});

export async function GET() {
  const session = await requireSession();

  const where =
    session.role === "ADMIN"
      ? {}
      : { requestedBy: session.name };

  const requests = await prisma.editRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      communication: {
        select: {
          id: true,
          lineNumber: true,
          subject: true,
          monthYear: true,
          isLocked: true,
        },
      },
    },
  });

  return NextResponse.json(requests);
}

export async function POST(request: NextRequest) {
  const session = await requireSession();
  const body = await request.json();
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const communication = await prisma.communication.findUnique({
    where: { id: parsed.data.communicationId },
  });

  if (!communication) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!communication.isLocked) {
    return NextResponse.json(
      { error: "Record is not locked. Edit directly instead." },
      { status: 400 }
    );
  }

  const existingPending = await prisma.editRequest.findFirst({
    where: {
      communicationId: parsed.data.communicationId,
      status: "Pending",
    },
  });

  if (existingPending) {
    return NextResponse.json(
      { error: "A pending request already exists for this record." },
      { status: 409 }
    );
  }

  const editRequest = await prisma.editRequest.create({
    data: {
      communicationId: parsed.data.communicationId,
      requestedBy: session.name,
      requestedFields: parsed.data.requestedFields,
      reason: parsed.data.reason || null,
    },
  });

  return NextResponse.json(editRequest, { status: 201 });
}
