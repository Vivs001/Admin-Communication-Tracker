"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { NavBar, TrackerHeader } from "@/components/NavBar";
import {
  commoTypeLabel,
  formatDateDrafted,
  formatDisplayMonth,
  statusColor,
} from "@/lib/constants";

interface Communication {
  id: string;
  lineNumber: number;
  dateDrafted: string;
  monthYear: string;
  commoType: string;
  subject: string;
  recipient: string;
  draftedBy: string;
  receivedBy: string | null;
  receivedDate: string | null;
  status: string;
  remarks: string | null;
  isLocked: boolean;
  editRequests: { id: string }[];
}

export default function DashboardPage() {
  const [items, setItems] = useState<Communication[]>([]);
  const [month, setMonth] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (month) params.set("month", month);
    if (statusFilter) params.set("status", statusFilter);

    setLoading(true);
    fetch(`/api/communications?${params}`)
      .then((r) => r.json())
      .then(setItems)
      .finally(() => setLoading(false));
  }, [month, statusFilter]);

  const months = useMemo(() => {
    const set = new Set(items.map((i) => i.monthYear));
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [items]);

  const grouped = useMemo(() => {
    const map = new Map<string, Communication[]>();
    for (const item of items) {
      if (!map.has(item.monthYear)) map.set(item.monthYear, []);
      map.get(item.monthYear)!.push(item);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [items]);

  return (
    <div className="min-h-screen bg-gray-100">
      <NavBar />
      <main className="mx-auto max-w-7xl px-4 py-6">
        <TrackerHeader />

        <div className="mb-4 flex flex-wrap gap-3">
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">All months</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {formatDisplayMonth(m)}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">All statuses</option>
            <option value="Completed">Completed</option>
            <option value="Pending">Pending</option>
          </select>
        </div>

        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : items.length === 0 ? (
          <div className="rounded-lg bg-white p-8 text-center shadow">
            <p className="text-gray-600">No communications found.</p>
            <Link
              href="/communications/new"
              className="mt-4 inline-block text-blue-700 hover:underline"
            >
              Add your first letter
            </Link>
          </div>
        ) : (
          grouped.map(([monthYear, rows]) => (
            <div key={monthYear} className="mb-8 overflow-hidden rounded-lg shadow">
              <div className="tracker-month-bar px-4 py-2 text-center font-bold text-black">
                {formatDisplayMonth(monthYear)}
              </div>
              <div className="overflow-x-auto bg-white">
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="tracker-table-header text-left">
                      <th className="border px-2 py-2">LN</th>
                      <th className="border px-2 py-2">Date Drafted</th>
                      <th className="border px-2 py-2">Commo Type</th>
                      <th className="border px-2 py-2">Subject</th>
                      <th className="border px-2 py-2">To</th>
                      <th className="border px-2 py-2">PIC/Drafted By</th>
                      <th className="border px-2 py-2">Received By & Date</th>
                      <th className="border px-2 py-2">Status</th>
                      <th className="border px-2 py-2">Remarks</th>
                      <th className="border px-2 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => (
                      <tr
                        key={row.id}
                        className={idx % 2 === 0 ? "tracker-row-alt" : "bg-white"}
                      >
                        <td className="border px-2 py-2">{row.lineNumber}</td>
                        <td className="border px-2 py-2 whitespace-nowrap">
                          {formatDateDrafted(new Date(row.dateDrafted))}
                        </td>
                        <td className="border px-2 py-2">
                          {commoTypeLabel(row.commoType)}
                        </td>
                        <td className="border px-2 py-2 max-w-xs truncate">
                          {row.subject}
                          {row.isLocked && (
                            <span className="ml-1 rounded bg-gray-800 px-1 text-xs text-white">
                              LOCKED
                            </span>
                          )}
                          {row.editRequests.length > 0 && (
                            <span className="ml-1 rounded bg-purple-600 px-1 text-xs text-white">
                              REQ
                            </span>
                          )}
                        </td>
                        <td className="border px-2 py-2">{row.recipient}</td>
                        <td className="border px-2 py-2">{row.draftedBy}</td>
                        <td className="border px-2 py-2">
                          {[row.receivedBy, row.receivedDate && formatDateDrafted(new Date(row.receivedDate))]
                            .filter(Boolean)
                            .join(" / ") || "—"}
                        </td>
                        <td className="border px-2 py-2">
                          <span
                            className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${statusColor(row.status)}`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="border px-2 py-2 max-w-xs truncate text-red-700">
                          {row.remarks ?? ""}
                        </td>
                        <td className="border px-2 py-2">
                          <Link
                            href={`/communications/${row.id}`}
                            className="text-blue-700 hover:underline"
                          >
                            Open
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
