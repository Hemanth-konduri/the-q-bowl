"use client";

import { useState, useEffect } from "react";
import { CustomerNavbar } from "@/components/dashboard/CustomerNavbar";
import { CustomerSidebar } from "@/components/dashboard/CustomerSidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("qbowl_customer_sidebar_open");
      if (saved !== null) {
        setSidebarOpen(saved === "true");
      }
    } catch (e) {
      console.error(e);
    }

    function handleToggle(e: any) {
      if (e.detail && typeof e.detail.isOpen === "boolean") {
        setSidebarOpen(e.detail.isOpen);
      }
    }

    window.addEventListener("qbowl-sidebar-toggled", handleToggle);
    return () => window.removeEventListener("qbowl-sidebar-toggled", handleToggle);
  }, []);

  return (
    <div className="min-h-screen bg-[#f5e3cd] text-black flex flex-col">
      <CustomerNavbar />
      <div className="flex flex-1 w-full px-4 sm:px-8 lg:px-12">
        {/* Left Side Icon Navigation (Fixed Stationary) */}
        <CustomerSidebar />

        {/* Main Dashboard Content with plenty of comfortable breathing room space */}
        <div
          className={`flex-1 min-w-0 pb-24 md:pb-12 transition-all duration-300 ${sidebarOpen
              ? "pl-0 md:pl-20 lg:pl-28"
              : "pl-0 md:pl-14 lg:pl-20"
            }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
