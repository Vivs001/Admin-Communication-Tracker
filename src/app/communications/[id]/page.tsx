"use client";

import { useChat } from "ai/react";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { NavBar, TrackerHeader } from "@/components/NavBar";
import {
  COMMO_TYPES,
  STATUSES,
  commoTypeLabel,
  formatDateDrafted,
  statusColor,
} from "@/lib/constants";

interface ReferenceFile {
  id: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}

interface EditRequest {
  id: string;
  status: string;
  reason: string | null;
  adminNote: string | null;
  createdAt: string;
}

interface Communication {
  id: string;
  lineNumber: number;
  dateDrafted: string;
  commoType: string;
  subject: string;
  recipient: string;
  draftedBy: string;
  receivedBy: string | null;
  receivedDate: string | null;
  status: string;
  remarks: string | null;
  isLocked: boolean;
  referenceFiles: ReferenceFile[];
  editRequests: EditRequest[];
}

export default function CommunicationDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<Communication | null>(null);
  const [sessionRole, setSessionRole] = useState<"ADMIN" | "USER" | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [requestReason, setRequestReason] = useState("");
  const [requestRemarks, setRequestRemarks] = useState("");

  useEffect(() => {
    if (!id) return;
    loadData();
    fetch("/api/auth/session")
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => s && setSessionRole(s.role));
  }, [id]);

  function loadData() {
    fetch(`/api/communications/${id}`)
      .then((r) => r.json())
      .then(setData);
  }

  async function saveChanges(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!data) return;
    setSaving(true);
    setMessage("");

    const form = new FormData(e.currentTarget);
    const payload = {
      dateDrafted: form.get("dateDrafted"),
      commoType: form.get("commoType"),
      subject: form.get("subject"),
      recipient: form.get("recipient"),
      draftedBy: form.get("draftedBy"),
      receivedBy: form.get("receivedBy") || null,
      receivedDate: form.get("receivedDate") || null,
      status: form.get("status"),
      remarks: form.get("remarks") || null,
    };

    const res = await fetch(`/api/communications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);

    if (!res.ok) {
      const err = await res.json();
      setMessage(err.error ?? "Save failed");
      return;
    }

    setData(await res.json());
    setMessage("Saved successfully.");
  }

  async function toggleLock() {
    if (!data) return;
    const res = await fetch(`/api/communications/${id}/lock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lock: !data.isLocked }),
    });
    if (res.ok) {
      setData(await res.json());
      setMessage(data.isLocked ? "Record unlocked." : "Record locked.");
    }
  }

  async function uploadReference(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`/api/communications/${id}/references`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      setMessage(err.error ?? "Upload failed");
      return;
    }
    loadData();
    setMessage("Reference uploaded.");
  }

  async function submitEditRequest(e: FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/edit-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        communicationId: id,
        requestedFields: { remarks: requestRemarks },
        reason: requestReason,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      setMessage(err.error ?? "Request failed");
      return;
    }
    setMessage("Edit request submitted to admin.");
    loadData();
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-100">
        <NavBar />
        <p className="p-8 text-center text-gray-500">Loading...</p>
      </div>
    );
  }

  const isAdmin = sessionRole === "ADMIN";
  const readOnly = data.isLocked && !isAdmin;
  const dateStr = data.dateDrafted.split("T")[0];
  const receivedDateStr = data.receivedDate
    ? data.receivedDate.split("T")[0]
    : "";

  return (
    <div className="min-h-screen bg-gray-100">
      <NavBar />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <TrackerHeader />

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <span className="text-lg font-semibold">
            LN {data.lineNumber} — {data.subject}
          </span>
          <span
            className={`rounded px-2 py-0.5 text-xs font-semibold ${statusColor(data.status)}`}
          >
            {data.status}
          </span>
          {data.isLocked && (
            <span className="rounded bg-gray-800 px-2 py-0.5 text-xs text-white">
              LOCKED
            </span>
          )}
          {isAdmin && (
            <button
              onClick={toggleLock}
              className="rounded border border-gray-400 px-3 py-1 text-sm hover:bg-white"
            >
              {data.isLocked ? "Unlock Record" : "Lock Record"}
            </button>
          )}
        </div>

        {message && (
          <p className="mb-4 rounded bg-blue-50 px-4 py-2 text-sm text-blue-800">
            {message}
          </p>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 font-semibold">Letter Details</h3>
            {readOnly ? (
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <Detail label="Date Drafted" value={formatDateDrafted(new Date(data.dateDrafted))} />
                <Detail label="Commo Type" value={commoTypeLabel(data.commoType)} />
                <Detail label="Subject" value={data.subject} full />
                <Detail label="To" value={data.recipient} />
                <Detail label="PIC/Drafted By" value={data.draftedBy} />
                <Detail label="Received By" value={data.receivedBy ?? "—"} />
                <Detail
                  label="Received Date"
                  value={
                    data.receivedDate
                      ? formatDateDrafted(new Date(data.receivedDate))
                      : "—"
                  }
                />
                <Detail label="Remarks" value={data.remarks ?? "—"} full />
              </dl>
            ) : (
              <form onSubmit={saveChanges} className="grid gap-3 sm:grid-cols-2">
                <Input label="Date Drafted" name="dateDrafted" type="date" defaultValue={dateStr} />
                <Select label="Commo Type" name="commoType" defaultValue={data.commoType}>
                  {COMMO_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </Select>
                <div className="sm:col-span-2">
                  <Input label="Subject" name="subject" defaultValue={data.subject} />
                </div>
                <Input label="To" name="recipient" defaultValue={data.recipient} />
                <Input label="PIC/Drafted By" name="draftedBy" defaultValue={data.draftedBy} />
                <Input label="Received By" name="receivedBy" defaultValue={data.receivedBy ?? ""} />
                <Input label="Received Date" name="receivedDate" type="date" defaultValue={receivedDateStr} />
                <Select label="Status" name="status" defaultValue={data.status}>
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </Select>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium">Remarks</label>
                  <textarea
                    name="remarks"
                    defaultValue={data.remarks ?? ""}
                    rows={3}
                    className="w-full rounded border border-gray-300 px-3 py-2"
                  />
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded bg-blue-700 px-4 py-2 text-white hover:bg-blue-800 disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            )}

            {readOnly && (
              <form onSubmit={submitEditRequest} className="mt-6 border-t pt-4">
                <h4 className="mb-2 font-medium text-purple-800">
                  Request Edit (Admin approval required)
                </h4>
                <textarea
                  value={requestRemarks}
                  onChange={(e) => setRequestRemarks(e.target.value)}
                  placeholder="Proposed remarks update..."
                  rows={2}
                  className="mb-2 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  required
                />
                <input
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  placeholder="Reason for request"
                  className="mb-2 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  className="rounded bg-purple-700 px-4 py-2 text-sm text-white hover:bg-purple-800"
                >
                  Submit Edit Request
                </button>
              </form>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-4 font-semibold">Reference Letters</h3>
              {!readOnly && (
                <label className="mb-4 flex cursor-pointer flex-col items-center rounded border-2 border-dashed border-gray-300 p-4 hover:border-blue-400">
                  <span className="text-sm text-gray-600">
                    Upload reference (PDF, DOCX, TXT)
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt,application/pdf,text/plain"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadReference(file);
                    }}
                  />
                </label>
              )}
              <ul className="space-y-2 text-sm">
                {data.referenceFiles.length === 0 && (
                  <li className="text-gray-500">No reference files uploaded.</li>
                )}
                {data.referenceFiles.map((f) => (
                  <li key={f.id} className="flex justify-between rounded bg-gray-50 px-3 py-2">
                    <span>{f.fileName}</span>
                    {f.fileUrl.startsWith("http") && (
                      <a
                        href={f.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-700 hover:underline"
                      >
                        View
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <AiChatPanel communicationId={id} />

            {data.editRequests.length > 0 && (
              <div className="rounded-lg bg-white p-6 shadow">
                <h3 className="mb-3 font-semibold">Edit Request History</h3>
                <ul className="space-y-2 text-sm">
                  {data.editRequests.map((r) => (
                    <li key={r.id} className="rounded bg-gray-50 px-3 py-2">
                      <span className="font-medium">{r.status}</span> —{" "}
                      {r.reason ?? "No reason"} ({new Date(r.createdAt).toLocaleDateString()})
                      {r.adminNote && (
                        <p className="text-gray-600">Admin: {r.adminNote}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function AiChatPanel({ communicationId }: { communicationId: string }) {
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: "/api/chat",
      body: { communicationId },
    });

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h3 className="mb-2 font-semibold">AI Letter Assistant (Claude)</h3>
      <p className="mb-4 text-xs text-gray-500">
        Upload a reference letter above, then ask Claude to help draft or reply.
        {/* Locked records: drafts are for copy/paste until admin approves. */}
      </p>
      <div className="mb-4 max-h-64 space-y-3 overflow-y-auto rounded border bg-gray-50 p-3 text-sm">
        {messages.length === 0 && (
          <p className="text-gray-400">
            Try: &quot;Draft a NavLet reply based on the reference letter.&quot;
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`rounded px-3 py-2 ${
              m.role === "user" ? "bg-blue-100 ml-8" : "bg-white mr-8 border"
            }`}
          >
            <p className="mb-1 text-xs font-semibold uppercase text-gray-500">
              {m.role}
            </p>
            <p className="whitespace-pre-wrap">{m.content}</p>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask Claude to help draft your letter..."
          className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="rounded bg-green-700 px-4 py-2 text-sm text-white hover:bg-green-800 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}

function Detail({
  label,
  value,
  full,
}: {
  label: string;
  value: string;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function Input({
  label,
  name,
  type = "text",
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
      />
    </div>
  );
}

function Select({
  label,
  name,
  defaultValue,
  children,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <select
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
      >
        {children}
      </select>
    </div>
  );
}
