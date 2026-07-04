"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { NavBar, TrackerHeader } from "@/components/NavBar";
import { COMMO_TYPES, STATUSES } from "@/lib/constants";

export default function NewCommunicationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const today = new Date().toISOString().split("T")[0];

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const payload = {
      dateDrafted: form.get("dateDrafted"),
      commoType: form.get("commoType"),
      subject: form.get("subject"),
      recipient: form.get("recipient"),
      draftedBy: form.get("draftedBy"),
      receivedBy: form.get("receivedBy") || undefined,
      receivedDate: form.get("receivedDate") || undefined,
      status: form.get("status"),
      remarks: form.get("remarks") || undefined,
    };

    const res = await fetch("/api/communications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (!res.ok) {
      setError("Failed to create communication.");
      return;
    }

    const data = await res.json();
    router.push(`/communications/${data.id}`);
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <NavBar />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <TrackerHeader />
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-6 text-xl font-semibold">New Communication Letter</h2>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <Field label="Date Drafted" name="dateDrafted" type="date" defaultValue={today} required />
            <Field label="Commo Type" name="commoType" as="select" required>
              {COMMO_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Field>
            <div className="sm:col-span-2">
              <Field label="Subject" name="subject" required />
            </div>
            <Field label="To (Recipient)" name="recipient" required />
            <Field label="PIC / Drafted By" name="draftedBy" required />
            <Field label="Received By" name="receivedBy" />
            <Field label="Received Date" name="receivedDate" type="date" />
            <Field label="Status" name="status" as="select" required>
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Field>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Remarks</label>
              <textarea
                name="remarks"
                rows={3}
                className="w-full rounded border border-gray-300 px-3 py-2"
              />
            </div>
            {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}
            <div className="sm:col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="rounded bg-blue-700 px-6 py-2 text-white hover:bg-blue-800 disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Letter"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  as,
  required,
  defaultValue,
  children,
}: {
  label: string;
  name: string;
  type?: string;
  as?: "select";
  required?: boolean;
  defaultValue?: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      {as === "select" ? (
        <select
          name={name}
          required={required}
          defaultValue={defaultValue}
          className="w-full rounded border border-gray-300 px-3 py-2"
        >
          {children}
        </select>
      ) : (
        <input
          name={name}
          type={type}
          required={required}
          defaultValue={defaultValue}
          className="w-full rounded border border-gray-300 px-3 py-2"
        />
      )}
    </div>
  );
}
