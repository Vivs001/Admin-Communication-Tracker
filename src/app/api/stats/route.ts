import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDisplayMonth } from "@/lib/constants";

export async function GET() {
  await requireSession();

  const grouped = await prisma.communication.groupBy({
    by: ["monthYear", "status", "commoType"],
    _count: { id: true },
  });

  const monthMap = new Map<
    string,
    {
      monthYear: string;
      label: string;
      total: number;
      completed: number;
      pending: number;
      byType: Record<string, number>;
    }
  >();

  for (const row of grouped) {
    if (!monthMap.has(row.monthYear)) {
      monthMap.set(row.monthYear, {
        monthYear: row.monthYear,
        label: formatDisplayMonth(row.monthYear),
        total: 0,
        completed: 0,
        pending: 0,
        byType: {},
      });
    }
    const entry = monthMap.get(row.monthYear)!;
    entry.total += row._count.id;
    entry.byType[row.commoType] =
      (entry.byType[row.commoType] ?? 0) + row._count.id;
    if (row.status === "Completed") entry.completed += row._count.id;
    if (row.status === "Pending") entry.pending += row._count.id;
  }

  const months = Array.from(monthMap.values()).sort((a, b) =>
    b.monthYear.localeCompare(a.monthYear)
  );

  const grandTotal = months.reduce((sum, m) => sum + m.total, 0);

  return NextResponse.json({ months, grandTotal });
}
