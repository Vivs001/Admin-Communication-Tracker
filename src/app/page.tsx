"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { TrackerHeader } from "./NavBar";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("Invalid password. Try admin or user portal password.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-10">
      <div className="mx-auto max-w-lg">
        <TrackerHeader />
        <div className="rounded-lg bg-white p-8 shadow">
          <h2 className="mb-2 text-xl font-semibold">Portal Login</h2>
          <p className="mb-6 text-sm text-gray-600">
            Enter the administrator or user password to access the tracker.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                placeholder="Enter portal password"
                required
              />
            </div>
            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded bg-blue-700 px-4 py-2 font-medium text-white hover:bg-blue-800 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
          <div className="mt-6 rounded bg-gray-50 p-4 text-xs text-gray-500">
            <p>
              <strong>Admin:</strong> full access, lock/unlock records, review
              edit requests
            </p>
            <p className="mt-1">
              <strong>User:</strong> encode letters, update remarks, upload
              references (locked records require a request)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
