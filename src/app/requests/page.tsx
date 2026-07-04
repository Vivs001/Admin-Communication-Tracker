"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NavBar, TrackerHeader } from "@/components/NavBar";
import { formatDisplayMonth } from "@/lib/constants";

interface EditRequestItem {
  id: string;
  requestedBy: string;
  requestedFields: Record<string, unknown>;
  reason: string | null;
  status: string;
  createdAt: string;
  communication: {
    id: string;
    lineNumber: number;
    subject: string;
    monthYear: string;
  };
}

export default function RequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<EditRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => {
        if (!s || s.role !== "ADMIN") router.replace("/dashboard");
      });
  }, [router]);

  function load() {
    setLoading(true);
    fetch("/api/edit-requests")
      .then((r) => r.json())
      .then(setRequests)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function review(
    id: string,
    action: "approve" | "deny" | "approve_and_apply",
    adminNote?: string
  ) {
    const res = await fetch(`/api/edit-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, adminNote }),
    });
    if (!res.ok) {
      setMessage("Action failed.");
      return;
    }
    setMessage(`Request ${action.replace("_", " ")}.`);
    load();
  }

  const pending = requests.filter((r) => r.status === "Pending");

  return (
    <div className="min-h-screen bg-gray-100">
      <NavBar />
      <main className="mx-auto max-w-4xl px-4 py-6">
        <TrackerHeader />

        <h2 className="mb-4 text-xl font-semibold">Edit Requests</h2>
        {message && (
          <p className="mb-4 rounded bg-blue-50 px-4 py-2 text-sm text-blue-800">
            {message}
          </p>
        )}

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : pending.length === 0 ? (
          <div className="rounded-lg bg-white p-8 text-center shadow">
            <p className="text-gray-600">No pending edit requests.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map((req) => (
              <div key={req.id} className="rounded-lg bg-white p-6 shadow">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">
                      LN {req.communication.lineNumber} —{" "}
                      {req.communication.subject}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDisplayMonth(req.communication.monthYear)} · Requested
                      by {req.requestedBy} ·{" "}
                      {new Date(req.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Link
                    href={`/communications/${req.communication.id}`}
                    className="text-sm text-blue-700 hover:underline"
                  >
                    View record
                  </Link>
                </div>
                {req.reason && (
                  <p className="mb-2 text-sm">
                    <strong>Reason:</strong> {req.reason}
                  </p>
                )}
                <pre className="mb-4 overflow-x-auto rounded bg-gray-50 p-3 text-xs">
                  {JSON.stringify(req.requestedFields, null, 2)}
                </pre>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => review(req.id, "approve_and_apply")}
                    className="rounded bg-green-700 px-3 py-1.5 text-sm text-white hover:bg-green-800"
                  >
                    Approve & Apply
                  </button>
                  <button
                    onClick={() => review(req.id, "approve")}
                    className="rounded bg-blue-700 px-3 py-1.5 text-sm text-white hover:bg-blue-800"
                  >
                    Approve & Unlock
                  </button>
                  <button
                    onClick={() =>
                      review(req.id, "deny", "Changes not approved at this time.")
                    }
                    className="rounded border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
                  >
                    Deny
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {requests.filter((r) => r.status !== "Pending").length > 0 && (
          <div className="mt-8">
            <h3 className="mb-3 font-semibold text-gray-600">Past Requests</h3>
            <ul className="space-y-2 text-sm">
              {requests
                .filter((r) => r.status !== "Pending")
                .map((r) => (
                  <li key={r.id} className="rounded bg-white px-4 py-2 shadow-sm">
                    {r.communication.subject} — {r.status} ({r.requestedBy})
                  </li>
                ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
