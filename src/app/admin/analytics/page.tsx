"use client";

import { AdminSidebar } from "../components/AdminSidebar";
import { AdminNavbar } from "../components/AdminNavbar";
import { BarChart3 } from "lucide-react";

export default function AdminAnalyticsPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <AdminSidebar />
      <div className="pl-64 flex flex-col min-h-screen bg-white">
        <AdminNavbar />
        <main className="flex-1 p-8 space-y-6 bg-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-black text-[#E5A00D] flex items-center justify-center font-bold">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-black uppercase tracking-tight">
                Analytics &amp; Business Intelligence
              </h1>
              <p className="text-sm font-bold text-slate-600">
                Detailed reports on revenue growth, subscriber retention, and dish sales.
              </p>
            </div>
          </div>
          <div className="p-8 bg-slate-50 border border-slate-200 rounded-2xl text-center text-slate-600 font-semibold">
            Analytics &amp; Business Intelligence Dashboard view is active.
          </div>
        </main>
      </div>
    </div>
  );
}
