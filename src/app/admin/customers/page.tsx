"use client";

import { useState, useEffect, useMemo } from "react";
import { AdminSidebar } from "../components/AdminSidebar";
import { AdminNavbar } from "../components/AdminNavbar";
import {
  Users,
  UserCheck,
  Clock,
  UserX,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  Edit2,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Phone,
  Mail,
  FileText,
  AlertCircle,
  Check,
  X,
  Lock,
  Unlock,
  ShoppingBag,
  ExternalLink,
  ZoomIn,
  Wallet,
  Calendar,
  ChevronRight,
  User,
} from "lucide-react";
import { getDocumentViewUrl } from "@/lib/supabase-storage";
import { formatOrderId } from "@/lib/utils/orderIdFormatter";

interface CustomerRecord {
  id: string;
  customerIdDisplay: string;
  name: string;
  email: string;
  phone: string;
  accountType: "Subscriber" | "Daily Customer";
  accountStatus: "Active" | "Pending" | "Blocked" | "Rejected";
  verificationStatus: "PENDING" | "APPROVED" | "REJECTED";
  isActive: boolean;
  walletBalance: number;
  aadhaarUrl: string | null;
  idProofUrl: string | null;
  createdAt: string;
}

interface VerificationRequest {
  id: string;
  userId: string;
  customerName: string;
  email: string;
  phone: string;
  aadhaarDocument: string;
  idProofDocument: string;
  aadhaarUrl: string | null;
  idProofUrl: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewNotes: string;
  submissionDate: string;
}

interface CustomerProfileDetail extends CustomerRecord {
  addresses: any[];
  ordersHistory: any[];
  subscriptionHistory: any[];
}

export default function AdminCustomersPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Data States
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [summary, setSummary] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    pendingRequests: 0,
    blockedCustomers: 0,
  });

  // Active View Tab (Directory vs Requests)
  const [activeTab, setActiveTab] = useState<"DIRECTORY" | "REQUESTS">("DIRECTORY");

  // Directory Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "SUBSCRIBER" | "DAILY">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "PENDING" | "BLOCKED">("ALL");

  // Profile Inspector Drawer Modal State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [inspectProfile, setInspectProfile] = useState<CustomerProfileDetail | null>(null);
  const [loadingInspect, setLoadingInspect] = useState(false);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "" });

  // Document Zoom Modal State
  const [zoomDocUrl, setZoomDocUrl] = useState<{ title: string; url: string } | null>(null);

  // Reject Reason Modal State
  const [rejectingUserId, setRejectingUserId] = useState<string | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");

  useEffect(() => {
    fetchCustomersData();
  }, []);

  const fetchCustomersData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      setLoading(true);
      const res = await fetch("/api/admin/customers");
      if (!res.ok) {
        console.warn("Customers API returned non-OK status:", res.status);
        return;
      }
      const text = await res.text();
      if (!text) return;
      const data = JSON.parse(text);
      if (data.success) {
        setCustomers(data.customers || []);
        setVerificationRequests(data.verificationRequests || []);
        if (data.summary) setSummary(data.summary);
      }
    } catch (err) {
      console.error("Failed to load customer data", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch Full Inspector Details for a specific customer
  const handleOpenInspector = async (userId: string) => {
    setSelectedCustomerId(userId);
    setLoadingInspect(true);
    setIsEditingInfo(false);
    try {
      const res = await fetch(`/api/admin/customers/${userId}`);
      const data = await res.json();
      if (data.success && data.profile) {
        setInspectProfile(data.profile);
        setEditForm({
          name: data.profile.name,
          email: data.profile.email,
          phone: data.profile.phone,
        });
      }
    } catch (err) {
      console.error("Failed to load customer profile details", err);
    } finally {
      setLoadingInspect(false);
    }
  };

  // Quick Action: Update Customer Account (Activate/Block, Status, or Edit Info)
  const handleUpdateCustomer = async (
    userId: string,
    updates: {
      isActive?: boolean;
      verificationStatus?: "APPROVED" | "REJECTED" | "PENDING";
      rejectionReason?: string;
      name?: string;
      email?: string;
      phone?: string;
    }
  ) => {
    try {
      const res = await fetch("/api/admin/customers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...updates }),
      });
      const data = await res.json();
      if (data.success) {
        setToastMessage("Customer account updated successfully!");
        setTimeout(() => setToastMessage(null), 3000);
        fetchCustomersData();
        if (selectedCustomerId === userId) {
          handleOpenInspector(userId);
        }
      }
    } catch (err) {
      console.error("Error updating customer account", err);
    }
  };

  // Verification Approve / Reject Actions
  const handleApproveVerification = async (userId: string) => {
    await handleUpdateCustomer(userId, {
      verificationStatus: "APPROVED",
      isActive: true,
    });
  };

  const handleConfirmRejectVerification = async () => {
    if (!rejectingUserId) return;
    await handleUpdateCustomer(rejectingUserId, {
      verificationStatus: "REJECTED",
      rejectionReason: rejectionReasonInput || "Document verification rejected by admin.",
    });
    setRejectingUserId(null);
    setRejectionReasonInput("");
  };

  // Filtered Customer Directory List
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mName = c.name.toLowerCase().includes(q);
        const mEmail = c.email.toLowerCase().includes(q);
        const mPhone = c.phone.includes(q);
        const mId = c.customerIdDisplay.toLowerCase().includes(q);
        if (!mName && !mEmail && !mPhone && !mId) return false;
      }

      if (typeFilter !== "ALL") {
        if (typeFilter === "SUBSCRIBER" && c.accountType !== "Subscriber") return false;
        if (typeFilter === "DAILY" && c.accountType !== "Daily Customer") return false;
      }

      if (statusFilter !== "ALL") {
        if (statusFilter === "ACTIVE" && c.accountStatus !== "Active") return false;
        if (statusFilter === "PENDING" && c.accountStatus !== "Pending") return false;
        if (statusFilter === "BLOCKED" && c.accountStatus !== "Blocked") return false;
      }

      return true;
    });
  }, [customers, searchQuery, typeFilter, statusFilter]);

  // Pending verification requests count
  const pendingRequestsList = useMemo(() => {
    return verificationRequests.filter((r) => r.status === "PENDING");
  }, [verificationRequests]);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans relative">
      <AdminSidebar />

      <div className="pl-64 flex flex-col min-h-screen bg-white">
        <AdminNavbar />

        <main className="flex-1 p-8 space-y-8 bg-white max-w-[1600px] mx-auto w-full">
          {/* Header Action Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-black text-[#E5A00D] flex items-center justify-center font-bold shadow-none border border-black shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black text-black uppercase tracking-tight">
                    Customers &amp; Verification Center
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-black text-[#E5A00D]">
                    Identity Manager
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  Manage registered customer accounts, review identity verification submissions, and inspect member profiles.
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3">
              {toastMessage && (
                <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold animate-fadeIn">
                  <Check className="w-4 h-4 text-emerald-600" />
                  {toastMessage}
                </div>
              )}

              <button
                onClick={() => fetchCustomersData(true)}
                disabled={refreshing}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                <RotateCcw className={`w-4 h-4 ${refreshing ? "animate-spin text-[#E5A00D]" : ""}`} />
                {refreshing ? "Syncing..." : "Sync Directory"}
              </button>
            </div>
          </div>

          {/* 1. TOP SUMMARY OVERVIEW CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Customers */}
            <div className="p-5 bg-white border-2 border-black rounded-2xl flex items-center justify-between shadow-none">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Customers</p>
                <h3 className="text-3xl font-black text-black mt-1">{summary.totalCustomers}</h3>
                <p className="text-[11px] text-slate-400 font-bold mt-2">Registered accounts in DB</p>
              </div>
              <div className="p-3 bg-black text-[#E5A00D] rounded-xl">
                <Users className="w-6 h-6" />
              </div>
            </div>

            {/* Active Customers */}
            <div className="p-5 bg-emerald-50/60 border border-emerald-300 rounded-2xl flex items-center justify-between shadow-none">
              <div>
                <p className="text-xs font-black text-emerald-950 uppercase tracking-wider">Active Customers</p>
                <h3 className="text-3xl font-black text-emerald-950 mt-1">{summary.activeCustomers}</h3>
                <p className="text-[11px] text-emerald-800 font-bold mt-2">Approved &amp; operational</p>
              </div>
              <div className="p-3 bg-emerald-200 text-emerald-950 rounded-xl">
                <UserCheck className="w-6 h-6" />
              </div>
            </div>

            {/* Pending Verification Requests */}
            <div className="p-5 bg-amber-50/60 border border-amber-300 rounded-2xl flex items-center justify-between shadow-none">
              <div>
                <p className="text-xs font-black text-amber-950 uppercase tracking-wider">Pending Verifications</p>
                <h3 className="text-3xl font-black text-amber-950 mt-1">{summary.pendingRequests}</h3>
                <p className="text-[11px] text-amber-800 font-bold mt-2">Document reviews queue</p>
              </div>
              <div className="p-3 bg-amber-200 text-amber-950 rounded-xl">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            {/* Blocked / Inactive Customers */}
            <div className="p-5 bg-rose-50/60 border border-rose-300 rounded-2xl flex items-center justify-between shadow-none">
              <div>
                <p className="text-xs font-black text-rose-950 uppercase tracking-wider">Blocked / Inactive</p>
                <h3 className="text-3xl font-black text-rose-950 mt-1">{summary.blockedCustomers}</h3>
                <p className="text-[11px] text-rose-800 font-bold mt-2">Restricted user accounts</p>
              </div>
              <div className="p-3 bg-rose-200 text-rose-950 rounded-xl">
                <UserX className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* TAB MODULE SWITCHER */}
          <div className="border-b border-slate-200 pb-0">
            <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 w-fit">
              <button
                type="button"
                onClick={() => setActiveTab("DIRECTORY")}
                className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                  activeTab === "DIRECTORY"
                    ? "bg-black text-white shadow-none"
                    : "text-slate-600 hover:text-black"
                }`}
              >
                <Users className="w-4 h-4 text-[#E5A00D]" />
                <span>All Customers Directory ({customers.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("REQUESTS")}
                className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                  activeTab === "REQUESTS"
                    ? "bg-black text-white shadow-none"
                    : "text-slate-600 hover:text-black"
                }`}
              >
                <Clock className="w-4 h-4 text-[#E5A00D]" />
                <span>Verification Requests Queue ({pendingRequestsList.length})</span>
                {pendingRequestsList.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#E5A00D] text-black">
                    {pendingRequestsList.length} Pending
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════ */}
          {/* TAB 1: ALL CUSTOMERS DIRECTORY                              */}
          {/* ════════════════════════════════════════════════════════════ */}
          {activeTab === "DIRECTORY" && (
            <div className="space-y-6">
              {/* Directory Filter Bar */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
                  {/* Search */}
                  <div className="lg:col-span-5 relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search customer name, Customer ID, phone, email..."
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-black focus:outline-none focus:border-black"
                    />
                  </div>

                  {/* Account Type Filter */}
                  <div className="lg:col-span-3">
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value as any)}
                      className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-black focus:outline-none focus:border-black"
                    >
                      <option value="ALL">All Account Types (Subscribers &amp; Daily)</option>
                      <option value="SUBSCRIBER">⭐ Subscribers Only</option>
                      <option value="DAILY">🛍️ Daily Customers Only</option>
                    </select>
                  </div>

                  {/* Account Status Filter */}
                  <div className="lg:col-span-4">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-black focus:outline-none focus:border-black"
                    >
                      <option value="ALL">All Account Statuses</option>
                      <option value="ACTIVE">🟢 Active Accounts</option>
                      <option value="PENDING">🟡 Pending Verification</option>
                      <option value="BLOCKED">🔴 Blocked / Restricted</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Customers Directory Table */}
              <div className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-none">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-black text-[#E5A00D] uppercase font-black tracking-wider text-[11px]">
                        <th className="p-4">Customer Name &amp; Contact</th>
                        <th className="p-4">Customer ID</th>
                        <th className="p-4">Account Type</th>
                        <th className="p-4">Account Status</th>
                        <th className="p-4">Registered Date</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-bold">
                      {loading ? (
                        <tr>
                          <td colSpan={6} className="text-center py-12 text-slate-500 font-bold">
                            <RotateCcw className="w-6 h-6 animate-spin text-[#E5A00D] mx-auto mb-2" />
                            Loading Customer Directory...
                          </td>
                        </tr>
                      ) : filteredCustomers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-10 text-slate-500 font-medium">
                            No customers match your search query or selected filter criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredCustomers.map((cust) => (
                          <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                            {/* Name & Contact */}
                            <td className="p-4 align-top space-y-0.5">
                              <div className="text-sm font-black text-black">{cust.name}</div>
                              <div className="text-[11px] text-slate-500 flex items-center gap-3">
                                <span>{cust.phone}</span>
                                {cust.email && <span>• {cust.email}</span>}
                              </div>
                            </td>

                            {/* Customer ID */}
                            <td className="p-4 align-top font-mono text-slate-700 font-extrabold text-xs">
                              {cust.customerIdDisplay}
                            </td>

                            {/* Account Type */}
                            <td className="p-4 align-top">
                              {cust.accountType === "Subscriber" ? (
                                <span className="inline-block px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-xs font-black">
                                  ⭐ Subscriber
                                </span>
                              ) : (
                                <span className="inline-block px-3 py-1 bg-slate-100 text-slate-800 border border-slate-300 rounded-full text-xs font-bold">
                                  🛍️ Daily Customer
                                </span>
                              )}
                            </td>

                            {/* Account Status */}
                            <td className="p-4 align-top">
                              <span
                                className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase ${
                                  cust.accountStatus === "Active"
                                    ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                                    : cust.accountStatus === "Pending"
                                    ? "bg-amber-100 text-amber-900 border border-amber-300"
                                    : "bg-rose-100 text-rose-900 border border-rose-300"
                                }`}
                              >
                                {cust.accountStatus}
                              </span>
                            </td>

                            {/* Registered Date */}
                            <td className="p-4 align-top text-slate-600">
                              {new Date(cust.createdAt).toLocaleDateString()}
                            </td>

                            {/* Actions */}
                            <td className="p-4 align-top text-center space-x-2">
                              <button
                                onClick={() => handleOpenInspector(cust.id)}
                                className="px-3 py-1.5 bg-black text-[#E5A00D] font-extrabold text-xs rounded-xl hover:bg-neutral-800 transition-colors shadow-none"
                              >
                                View Profile
                              </button>

                              {cust.isActive ? (
                                <button
                                  onClick={() => handleUpdateCustomer(cust.id, { isActive: false })}
                                  className="px-2.5 py-1.5 bg-rose-50 text-rose-800 hover:bg-rose-100 font-bold text-xs rounded-xl border border-rose-200 transition-colors"
                                  title="Block customer account"
                                >
                                  Block
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUpdateCustomer(cust.id, { isActive: true })}
                                  className="px-2.5 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold text-xs rounded-xl border border-emerald-200 transition-colors"
                                  title="Unblock customer account"
                                >
                                  Unblock
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════ */}
          {/* TAB 2: CUSTOMER VERIFICATION REQUESTS QUEUE                 */}
          {/* ════════════════════════════════════════════════════════════ */}
          {activeTab === "REQUESTS" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-black text-black uppercase tracking-tight">
                    Identity Verification Queue
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Review uploaded Aadhaar cards and College / Institution ID proof documents.
                  </p>
                </div>

                <span className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-xs font-black">
                  {pendingRequestsList.length} Pending Approvals
                </span>
              </div>

              {pendingRequestsList.length === 0 ? (
                <div className="p-12 text-center border border-slate-200 rounded-2xl bg-slate-50 space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h3 className="text-base font-black text-black uppercase">No Pending Requests</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    All customer identity verification requests have been reviewed and processed.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pendingRequestsList.map((req) => (
                    <div
                      key={req.id}
                      className="bg-white border-2 border-slate-200 rounded-2xl p-6 space-y-5 hover:border-slate-400 transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-4">
                        {/* Request Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <div>
                            <div className="text-base font-black text-black">{req.customerName}</div>
                            <div className="text-[11px] text-slate-500 font-bold">{req.phone} • {req.email}</div>
                          </div>
                          <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-[10px] font-black uppercase">
                            Pending Review
                          </span>
                        </div>

                        {/* Document Previews */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                            Submitted Documents:
                          </label>

                          <div className="grid grid-cols-2 gap-2">
                            {/* Aadhaar Doc */}
                            <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-center">
                              <span className="text-[10px] font-bold text-slate-600 block">Aadhaar Card</span>
                              {req.aadhaarUrl || req.aadhaarDocument ? (
                                <button
                                  type="button"
                                  onClick={() => setZoomDocUrl({ title: `Aadhaar Document - ${req.customerName}`, url: getDocumentViewUrl(req.aadhaarUrl || req.aadhaarDocument || "") })}
                                  className="w-full py-1.5 bg-black text-[#E5A00D] rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 hover:bg-neutral-800"
                                >
                                  <ZoomIn size={12} /> View Document
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400">No document</span>
                              )}
                            </div>

                            {/* ID Proof Doc */}
                            <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-center">
                              <span className="text-[10px] font-bold text-slate-600 block">College / ID Card</span>
                              {req.idProofUrl || req.idProofDocument ? (
                                <button
                                  type="button"
                                  onClick={() => setZoomDocUrl({ title: `Institution ID - ${req.customerName}`, url: getDocumentViewUrl(req.idProofUrl || req.idProofDocument || "") })}
                                  className="w-full py-1.5 bg-black text-[#E5A00D] rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 hover:bg-neutral-800"
                                >
                                  <ZoomIn size={12} /> View Document
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400">No document</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-400 font-bold">
                          Submitted: {new Date(req.submissionDate).toLocaleString()}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleApproveVerification(req.userId)}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1 shadow-none"
                        >
                          <CheckCircle2 size={14} /> Approve Account
                        </button>
                        <button
                          type="button"
                          onClick={() => setRejectingUserId(req.userId)}
                          className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1"
                        >
                          <XCircle size={14} /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* MODAL 1: CUSTOMER PROFILE INSPECTOR DRAWER                   */}
      {/* ════════════════════════════════════════════════════════════ */}
      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-end p-0 animate-in fade-in duration-150">
          <div className="bg-white border-l-2 border-black w-full max-w-2xl h-full shadow-none p-6 space-y-6 relative overflow-y-auto text-slate-900">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-black">
                    Customer Profile Inspector
                  </h3>
                  {inspectProfile && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase bg-[#E5A00D] text-black">
                      {inspectProfile.accountType}
                    </span>
                  )}
                </div>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  ID: {inspectProfile?.customerIdDisplay}
                </p>
              </div>
              <button
                onClick={() => setSelectedCustomerId(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-black transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {loadingInspect ? (
              <div className="py-20 text-center text-slate-500 font-bold">
                <RotateCcw className="w-8 h-8 animate-spin text-[#E5A00D] mx-auto mb-2" />
                Loading Customer Profile...
              </div>
            ) : inspectProfile ? (
              <div className="space-y-6 text-xs">
                {/* 1. Account Controls Card */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-black uppercase tracking-wider text-[11px]">
                      Account Security Controls
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-black uppercase text-[10px] ${
                        inspectProfile.isActive
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {inspectProfile.isActive ? "Active Account" : "Blocked Account"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    {/* Active Toggle Switch */}
                    <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                      <span className="font-bold text-slate-700">Account Access:</span>
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateCustomer(inspectProfile.id, { isActive: !inspectProfile.isActive })
                        }
                        className={`px-3 py-1 rounded-lg font-black text-xs transition-colors ${
                          inspectProfile.isActive
                            ? "bg-rose-100 text-rose-800 hover:bg-rose-200"
                            : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                        }`}
                      >
                        {inspectProfile.isActive ? "Block User" : "Activate User"}
                      </button>
                    </div>

                    {/* Reset Verification Status */}
                    <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                      <span className="font-bold text-slate-700 block">Verification Status:</span>
                      <select
                        value={inspectProfile.verificationStatus}
                        onChange={(e) =>
                          handleUpdateCustomer(inspectProfile.id, {
                            verificationStatus: e.target.value as any,
                            isActive: e.target.value === "APPROVED",
                          })
                        }
                        className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs font-black text-black"
                      >
                        <option value="APPROVED">APPROVED</option>
                        <option value="PENDING">PENDING</option>
                        <option value="REJECTED">REJECTED</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 2. Customer Info & Edit Section */}
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-black uppercase tracking-wider text-[11px]">
                      Personal Details
                    </span>
                    <button
                      onClick={() => setIsEditingInfo(!isEditingInfo)}
                      className="text-[#E5A00D] hover:underline font-black text-xs flex items-center gap-1"
                    >
                      <Edit2 size={12} /> {isEditingInfo ? "Cancel Edit" : "Edit Info"}
                    </button>
                  </div>

                  {isEditingInfo ? (
                    <div className="space-y-3 pt-2">
                      <div>
                        <label className="font-bold text-slate-600 block mb-1">Full Name</label>
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-bold text-black"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-600 block mb-1">Email Address</label>
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-bold text-black"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-600 block mb-1">Phone Number</label>
                        <input
                          type="text"
                          value={editForm.phone}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-bold text-black"
                        />
                      </div>

                      <button
                        onClick={() =>
                          handleUpdateCustomer(inspectProfile.id, {
                            name: editForm.name,
                            email: editForm.email,
                            phone: editForm.phone,
                          })
                        }
                        className="px-4 py-1.5 bg-[#E5A00D] text-black font-extrabold text-xs rounded-lg shadow-none"
                      >
                        Save Updated Information
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 font-bold text-xs pt-1">
                      <div>
                        <span className="text-slate-400 text-[10px] block uppercase">Full Name</span>
                        <span className="text-black text-sm font-black">{inspectProfile.name}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block uppercase">Phone Number</span>
                        <span className="text-slate-800">{inspectProfile.phone}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block uppercase">Email</span>
                        <span className="text-slate-800">{inspectProfile.email}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block uppercase">Wallet Balance</span>
                        <span className="text-black font-black">₹{inspectProfile.walletBalance}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Uploaded Verification Documents */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <span className="font-black text-black uppercase tracking-wider text-[11px] block">
                    Uploaded Verification Documents
                  </span>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-white border border-slate-200 rounded-lg text-center space-y-1.5">
                      <span className="font-extrabold text-slate-700 block">Aadhaar Card</span>
                      {inspectProfile.aadhaarUrl ? (
                        <button
                          type="button"
                          onClick={() => setZoomDocUrl({ title: `Aadhaar Document - ${inspectProfile.name}`, url: inspectProfile.aadhaarUrl! })}
                          className="w-full py-1.5 bg-black text-[#E5A00D] font-black text-xs rounded-lg flex items-center justify-center gap-1"
                        >
                          <ZoomIn size={12} /> View Document
                        </button>
                      ) : (
                        <span className="text-slate-400 italic">No file uploaded</span>
                      )}
                    </div>

                    <div className="p-3 bg-white border border-slate-200 rounded-lg text-center space-y-1.5">
                      <span className="font-extrabold text-slate-700 block">Institution ID Proof</span>
                      {inspectProfile.idProofUrl ? (
                        <button
                          type="button"
                          onClick={() => setZoomDocUrl({ title: `Institution ID - ${inspectProfile.name}`, url: inspectProfile.idProofUrl! })}
                          className="w-full py-1.5 bg-black text-[#E5A00D] font-black text-xs rounded-lg flex items-center justify-center gap-1"
                        >
                          <ZoomIn size={12} /> View Document
                        </button>
                      ) : (
                        <span className="text-slate-400 italic">No file uploaded</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 4. Active Subscription History */}
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                  <span className="font-black text-black uppercase tracking-wider text-[11px] block">
                    Subscription Plans History ({inspectProfile.subscriptionHistory.length})
                  </span>

                  {inspectProfile.subscriptionHistory.length === 0 ? (
                    <p className="text-slate-400 font-bold italic">No active or previous subscription plans found.</p>
                  ) : (
                    <div className="space-y-2">
                      {inspectProfile.subscriptionHistory.map((s) => (
                        <div key={s.id} className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg flex items-center justify-between">
                          <div>
                            <div className="font-black text-black">{s.mealName || "Subscription Meal"}</div>
                            <div className="text-[11px] text-slate-500 font-bold">
                              {s.mealsRemaining} / {s.totalMeals} Meals Remaining • {s.mealTiming}
                            </div>
                          </div>
                          <span className="px-2 py-0.5 bg-[#E5A00D] text-black font-black rounded text-[10px] uppercase">
                            {s.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 5. Orders History */}
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                  <span className="font-black text-black uppercase tracking-wider text-[11px] block">
                    Customer Orders History ({inspectProfile.ordersHistory.length})
                  </span>

                  {inspectProfile.ordersHistory.length === 0 ? (
                    <p className="text-slate-400 font-bold italic">No past orders placed yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {inspectProfile.ordersHistory.map((o) => (
                        <div key={o.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between font-bold">
                          <div>
                            <div className="text-black font-black">{formatOrderId(o.id)}</div>
                            <div className="text-[11px] text-slate-500">{new Date(o.createdAt).toLocaleDateString()}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-black font-black">₹{o.total}</div>
                            <span className="text-[10px] uppercase text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                              {o.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════ */}
      {/* MODAL 2: FULL-SCREEN DOCUMENT ZOOM MODAL                     */}
      {/* ════════════════════════════════════════════════════════════ */}
      {zoomDocUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border-2 border-black w-full max-w-3xl rounded-2xl p-6 space-y-4 relative text-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-black uppercase tracking-tight">{zoomDocUrl.title}</h3>
              <button
                onClick={() => setZoomDocUrl(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-black"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-2 bg-slate-900 rounded-xl overflow-hidden flex justify-center max-h-[70vh] min-h-[250px] relative items-center">
              {zoomDocUrl.url ? (
                zoomDocUrl.url.toLowerCase().includes(".pdf") ? (
                  <iframe
                    src={zoomDocUrl.url}
                    className="w-full h-[65vh] rounded-lg bg-white"
                    title={zoomDocUrl.title}
                  />
                ) : (
                  <img
                    src={zoomDocUrl.url}
                    alt={zoomDocUrl.title}
                    className="max-h-[65vh] object-contain rounded-lg"
                    onError={(e) => {
                      const target = e.target as HTMLElement;
                      target.style.display = "none";
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector(".zoom-fallback")) {
                        const div = document.createElement("div");
                        div.className = "zoom-fallback flex flex-col items-center justify-center p-8 text-center space-y-3";
                        div.innerHTML = `<div class="text-[#E5A00D] font-bold text-sm">Document File Preview</div><div class="text-xs text-slate-300 font-mono max-w-sm break-all">${zoomDocUrl.title}</div><a href="${zoomDocUrl.url}" target="_blank" class="px-4 py-2 bg-[#E5A00D] text-black font-extrabold text-xs rounded-xl">Open Full Document Page</a>`;
                        parent.appendChild(div);
                      }
                    }}
                  />
                )
              ) : (
                <div className="p-12 text-slate-400 font-bold text-center">
                  Document image file preview not available
                </div>
              )}
            </div>

            <div className="text-right">
              <button
                onClick={() => setZoomDocUrl(null)}
                className="px-5 py-2 bg-black text-[#E5A00D] font-bold text-xs rounded-xl"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════ */}
      {/* MODAL 3: REJECTION REASON MODAL                              */}
      {/* ════════════════════════════════════════════════════════════ */}
      {rejectingUserId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border-2 border-black w-full max-w-md rounded-2xl p-6 space-y-4 relative text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-rose-950 uppercase tracking-tight">Reject Verification</h3>
              <button onClick={() => setRejectingUserId(null)} className="p-1 text-slate-400 hover:text-black">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Rejection Note / Reason:</label>
              <textarea
                rows={3}
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                placeholder="e.g. Uploaded Aadhaar image is blurry or expired ID card."
                className="w-full p-3 border border-slate-300 rounded-xl text-xs font-bold text-black"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectingUserId(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRejectVerification}
                className="px-4 py-2 bg-rose-600 text-white font-extrabold text-xs rounded-xl"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
