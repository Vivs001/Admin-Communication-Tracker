"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Session {
  role: "ADMIN" | "USER";
  name: string;
}

const links = [
  { href: "/dashboard", label: "Tracker" },
  { href: "/communications/new", label: "New Outgoing" },
  { href: "/stats", label: "Monthly Stats" },
  { href: "/export", label: "Export" },
  { href: "/requests", label: "Edit Requests", adminOnly: true },
];

export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setSession(data))
      .catch(() => setSession(null));
  }, [pathname]);

  async function logout() {
    await fetch("/api/auth/login", { method: "DELETE" });
    router.push("/");
    router.refresh();
  }

  return (
    <nav className="border-b border-gray-300 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex flex-wrap items-center gap-1">
          {links
            .filter((l) => !l.adminOnly || session?.role === "ADMIN")
            .map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded px-3 py-1.5 text-sm font-medium transition ${
                  pathname.startsWith(link.href)
                    ? "bg-blue-700 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {link.label}
              </Link>
            ))}
        </div>
        <div className="flex items-center gap-3 text-sm">
          {session && (
            <>
              <span className="rounded bg-gray-200 px-2 py-1">
                {session.name}{" "}
                <span className="text-gray-500">({session.role})</span>
              </span>
              <button
                onClick={logout}
                className="rounded border border-gray-300 px-3 py-1 hover:bg-gray-50"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export function TrackerHeader() {
  return (
    <header className="mb-6 overflow-hidden rounded-lg shadow">
      <div className="tracker-title-bar px-6 py-4 text-center">
        <h1 className="text-2xl font-bold tracking-wide text-black">
          NBRRMD COMMO TRACKER
        </h1>
      </div>
      <div className="tracker-instruction-bar px-6 py-2 text-center text-sm italic">
        Monitor all outgoing communication letters from the dispensary — track
        status, references, and follow-ups.
      </div>
    </header>
  );
}
