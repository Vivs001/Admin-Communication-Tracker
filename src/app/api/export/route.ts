import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  commoTypeLabel,
  formatDateDrafted,
  formatDisplayMonth,
} from "@/lib/constants";

export async function GET(request: NextRequest) {
  await requireSession();

  const month = request.nextUrl.searchParams.get("month");
  const format = request.nextUrl.searchParams.get("format") ?? "xlsx";

  const where = month ? { monthYear: month } : {};

  const communications = await prisma.communication.findMany({
    where,
    orderBy: [{ monthYear: "desc" }, { lineNumber: "asc" }],
    include: { referenceFiles: { select: { fileName: true } } },
  });

  const rows = communications.map((c) => ({
    LN: c.lineNumber,
    Month: formatDisplayMonth(c.monthYear),
    "Date Drafted": formatDateDrafted(c.dateDrafted),
    "Created At": c.createdAt.toISOString().split("T")[0],
    "Commo Type": commoTypeLabel(c.commoType),
    Subject: c.subject,
    To: c.recipient,
    "PIC/Drafted By": c.draftedBy,
    "Received By": c.receivedBy ?? "",
    "Received Date": c.receivedDate
      ? formatDateDrafted(c.receivedDate)
      : "",
    Status: c.status,
    Remarks: c.remarks ?? "",
    Locked: c.isLocked ? "Yes" : "No",
    References: c.referenceFiles.map((f) => f.fileName).join("; "),
  }));

  if (format === "csv") {
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const filename = month
      ? `nbrrmd-commo-${month}.csv`
      : "nbrrmd-commo-all.csv";

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Communications");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  const filename = month
    ? `nbrrmd-commo-${month}.xlsx`
    : "nbrrmd-commo-all.xlsx";

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
