"use client";

import { useEffect, useState } from "react";
import { NavBar, TrackerHeader } from "@/components/NavBar";
import { formatDisplayMonth } from "@/lib/constants";

export default function ExportPage() {
  const [months, setMonths] = useState<string[]>([]);
  const [month, setMonth] = useState("");
  const [format, setFormat] = useState<"xlsx" | "csv">("xlsx");

  useEffect(() => {
    fetch("/api/communications")
      .then((r) => r.json())
      .then((items: { monthYear: string }[]) => {
        const set = new Set(items.map((i) => i.monthYear));
        setMonths(Array.from(set).sort((a, b) => b.localeCompare(a)));
      });
  }, []);

  function download() {
    const params = new URLSearchParams({ format });
    if (month) params.set("month", month);
    window.location.href = `/api/export?${params}`;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <NavBar />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <TrackerHeader />

        <div className="rounded-lg bg-white p-8 shadow">
          <h2 className="mb-2 text-xl font-semibold">Export Communications</h2>
          <p className="mb-6 text-sm text-gray-600">
            Download the letter list including dates drafted and created, status,
            remarks, and reference file names.
          </p>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Month</label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2"
              >
                <option value="">All months</option>
                {months.map((m) => (
                  <option key={m} value={m}>
                    {formatDisplayMonth(m)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as "xlsx" | "csv")}
                className="w-full rounded border border-gray-300 px-3 py-2"
              >
                <option value="xlsx">Excel (.xlsx)</option>
                <option value="csv">CSV (.csv)</option>
              </select>
            </div>

            <button
              onClick={download}
              className="w-full rounded bg-green-700 px-4 py-3 font-medium text-white hover:bg-green-800"
            >
              Download Export
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
