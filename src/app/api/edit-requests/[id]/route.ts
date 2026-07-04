import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const reviewSchema = z.object({
  action: z.enum(["approve", "deny", "approve_and_apply"]),
  adminNote: z.string().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  await requireAdmin();
  const { id } = await context.params;
  const body = await request.json();
  const parsed = reviewSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const editRequest = await prisma.editRequest.findUnique({
    where: { id },
    include: { communication: true },
  });

  if (!editRequest) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (editRequest.status !== "Pending") {
    return NextResponse.json({ error: "Already reviewed" }, { status: 400 });
  }

  if (parsed.data.action === "deny") {
    const updated = await prisma.editRequest.update({
      where: { id },
      data: {
        status: "Denied",
        adminNote: parsed.data.adminNote || null,
        reviewedAt: new Date(),
      },
    });
    return NextResponse.json(updated);
  }

  const fields = editRequest.requestedFields as Record<string, unknown>;
  const updateData: Record<string, unknown> = {};

  if (typeof fields.remarks === "string") updateData.remarks = fields.remarks;
  if (typeof fields.receivedBy === "string")
    updateData.receivedBy = fields.receivedBy;
  if (typeof fields.receivedDate === "string" && fields.receivedDate) {
    updateData.receivedDate = new Date(fields.receivedDate);
  }
  if (fields.status === "Completed" || fields.status === "Pending") {
    updateData.status = fields.status;
  }
  if (typeof fields.subject === "string") updateData.subject = fields.subject;

  if (parsed.data.action === "approve") {
    await prisma.communication.update({
      where: { id: editRequest.communicationId },
      data: { isLocked: false },
    });
  }

  if (
    parsed.data.action === "approve_and_apply" &&
    Object.keys(updateData).length > 0
  ) {
    await prisma.communication.update({
      where: { id: editRequest.communicationId },
      data: updateData,
    });
  } else if (parsed.data.action === "approve") {
    if (Object.keys(updateData).length > 0) {
      await prisma.communication.update({
        where: { id: editRequest.communicationId },
        data: updateData,
      });
    }
  }

  const updated = await prisma.editRequest.update({
    where: { id },
    data: {
      status: "Approved",
      adminNote: parsed.data.adminNote || null,
      reviewedAt: new Date(),
    },
  });

  return NextResponse.json(updated);
}
