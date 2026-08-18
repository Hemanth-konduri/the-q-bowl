"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, ChevronDown, LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";

type Props = { adminName: string };

export default function AdminHeader({ adminName }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin");
  }

  return (
    <header
      className="fixed top-0 left-0 lg:left-56 right-0 h-14 flex items-center justify-between px-3 sm:px-4 lg:px-6 border-b z-20"
      style={{ background: "#fff", borderColor: "#E8E4D9" }}
    >
      {/* Left — page title slot (empty, pages can use their own headings) */}
      <div />

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <button
          className="relative w-8 h-8 flex items-center justify-center rounded-lg transition hover:bg-gray-100"
          style={{ color: "#4B5563" }}
        >
          <Bell size={17} />
          {/* Unread dot */}
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: "#D86F45" }} />
        </button>

        {/* Admin dropdown */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition hover:bg-gray-100"
            style={{ color: "#24332B" }}
          >
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "#496A5A" }}>
              {adminName.charAt(0).toUpperCase()}
            </div>
            <span className="hidden sm:inline max-w-36 truncate">{adminName}</span>
            <ChevronDown size={14} style={{ color: "#7C817A" }} />
          </button>

          {open && (
            <div
              className="absolute right-0 top-full mt-1 w-44 rounded-xl border shadow-lg py-1 z-50"
              style={{ background: "#fff", borderColor: "#E8E4D9" }}
            >
              <button
                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm transition hover:bg-gray-50"
                style={{ color: "#24332B" }}
                onClick={() => { setOpen(false); router.push("/admin/settings"); }}
              >
                <User size={14} /> Profile
              </button>
              <div className="my-1 border-t" style={{ borderColor: "#E8E4D9" }} />
              <button
                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm transition hover:bg-gray-50"
                style={{ color: "#D86F45" }}
                onClick={logout}
              >
                <LogOut size={14} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
