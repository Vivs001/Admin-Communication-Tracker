"use client";

import { useEffect, useState } from "react";
import { NavBar, TrackerHeader } from "@/components/NavBar";
import { commoTypeLabel } from "@/lib/constants";

interface MonthStat {
  monthYear: string;
  label: string;
  total: number;
  completed: number;
  pending: number;
  byType: Record<string, number>;
}

export default function StatsPage() {
  const [months, setMonths] = useState<MonthStat[]>([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => {
        setMonths(data.months);
        setGrandTotal(data.grandTotal);
      })
      .finally(() => setLoading(false));
  }, []);

  const maxTotal = Math.max(...months.map((m) => m.total), 1);

  return (
    <div className="min-h-screen bg-gray-100">
      <NavBar />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <TrackerHeader />

        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <p className="text-sm text-gray-500">Total communications on record</p>
          <p className="text-4xl font-bold text-blue-800">{grandTotal}</p>
        </div>

        {loading ? (
          <p className="text-center text-gray-500">Loading stats...</p>
        ) : months.length === 0 ? (
          <p className="text-center text-gray-500">No data yet.</p>
        ) : (
          <div className="space-y-4">
            {months.map((m) => (
              <div key={m.monthYear} className="rounded-lg bg-white p-6 shadow">
                <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                  <h3 className="text-lg font-semibold">{m.label}</h3>
                  <span className="text-2xl font-bold">{m.total} letters</span>
                </div>
                <div className="mb-4 h-6 overflow-hidden rounded bg-gray-200">
                  <div
                    className="h-full rounded bg-orange-500 transition-all"
                    style={{ width: `${(m.total / maxTotal) * 100}%` }}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <StatBox label="Completed" value={m.completed} color="text-green-700" />
                  <StatBox label="Pending" value={m.pending} color="text-amber-600" />
                  <div>
                    <p className="mb-2 text-sm font-medium text-gray-500">By Type</p>
                    <ul className="space-y-1 text-sm">
                      {Object.entries(m.byType).map(([type, count]) => (
                        <li key={type} className="flex justify-between">
                          <span>{commoTypeLabel(type)}</span>
                          <span className="font-semibold">{count}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded bg-gray-50 p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
