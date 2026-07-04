import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeMonthYear } from "@/lib/communications";

const updateSchema = z.object({
  dateDrafted: z.string().optional(),
  commoType: z
    .enum(["NavLet", "CivilianLetter", "Orders", "Memorandum", "Others"])
    .optional(),
  subject: z.string().min(1).optional(),
  recipient: z.string().min(1).optional(),
  draftedBy: z.string().min(1).optional(),
  receivedBy: z.string().nullable().optional(),
  receivedDate: z.string().nullable().optional(),
  status: z.enum(["Completed", "Pending"]).optional(),
  remarks: z.string().nullable().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  await requireSession();
  const { id } = await context.params;

  const communication = await prisma.communication.findUnique({
    where: { id },
    include: {
      referenceFiles: true,
      editRequests: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!communication) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(communication);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = await requireSession();
  const { id } = await context.params;
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.communication.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existing.isLocked && session.role !== "ADMIN") {
    return NextResponse.json(
      { error: "This record is locked. Submit an edit request." },
      { status: 403 }
    );
  }

  const data: Record<string, unknown> = {};

  if (parsed.data.dateDrafted) {
    const dateDrafted = new Date(parsed.data.dateDrafted);
    data.dateDrafted = dateDrafted;
    data.monthYear = computeMonthYear(dateDrafted);
  }
  if (parsed.data.commoType) data.commoType = parsed.data.commoType;
  if (parsed.data.subject) data.subject = parsed.data.subject;
  if (parsed.data.recipient) data.recipient = parsed.data.recipient;
  if (parsed.data.draftedBy) data.draftedBy = parsed.data.draftedBy;
  if (parsed.data.receivedBy !== undefined)
    data.receivedBy = parsed.data.receivedBy;
  if (parsed.data.receivedDate !== undefined) {
    data.receivedDate = parsed.data.receivedDate
      ? new Date(parsed.data.receivedDate)
      : null;
  }
  if (parsed.data.status) data.status = parsed.data.status;
  if (parsed.data.remarks !== undefined) data.remarks = parsed.data.remarks;

  const updated = await prisma.communication.update({
    where: { id },
    data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  await requireAdmin();
  const { id } = await context.params;
  await prisma.communication.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
