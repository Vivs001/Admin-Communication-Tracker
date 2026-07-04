import { prisma } from "./prisma";
import { formatMonthYear } from "./constants";

export async function getNextLineNumber(monthYear: string): Promise<number> {
  const last = await prisma.communication.findFirst({
    where: { monthYear },
    orderBy: { lineNumber: "desc" },
    select: { lineNumber: true },
  });
  return (last?.lineNumber ?? 0) + 1;
}

export function computeMonthYear(dateDrafted: Date): string {
  return formatMonthYear(dateDrafted);
}
