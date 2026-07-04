import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeMonthYear, getNextLineNumber } from "@/lib/communications";

const createSchema = z.object({
  dateDrafted: z.string(),
  commoType: z.enum(["NavLet", "CivilianLetter", "Orders", "Others"]),
  subject: z.string().min(1),
  recipient: z.string().min(1),
  draftedBy: z.string().min(1),
  receivedBy: z.string().optional(),
  receivedDate: z.string().optional(),
  status: z.enum(["Completed", "Pending"]).default("Pending"),
  remarks: z.string().optional(),
});

export async function GET(request: NextRequest) {
  await requireSession();
  const month = request.nextUrl.searchParams.get("month");
  const status = request.nextUrl.searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (month) where.monthYear = month;
  if (status === "Completed" || status === "Pending") where.status = status;

  const communications = await prisma.communication.findMany({
    where,
    orderBy: [{ monthYear: "desc" }, { lineNumber: "asc" }],
    include: {
      referenceFiles: { select: { id: true, fileName: true } },
      editRequests: {
        where: { status: "Pending" },
        select: { id: true },
      },
    },
  });

  return NextResponse.json(communications);
}

export async function POST(request: NextRequest) {
  await requireSession();
  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const dateDrafted = new Date(parsed.data.dateDrafted);
  const monthYear = computeMonthYear(dateDrafted);
  const lineNumber = await getNextLineNumber(monthYear);

  const communication = await prisma.communication.create({
    data: {
      lineNumber,
      dateDrafted,
      monthYear,
      commoType: parsed.data.commoType,
      subject: parsed.data.subject,
      recipient: parsed.data.recipient,
      draftedBy: parsed.data.draftedBy,
      receivedBy: parsed.data.receivedBy || null,
      receivedDate: parsed.data.receivedDate
        ? new Date(parsed.data.receivedDate)
        : null,
      status: parsed.data.status,
      remarks: parsed.data.remarks || null,
    },
  });

  return NextResponse.json(communication, { status: 201 });
}
