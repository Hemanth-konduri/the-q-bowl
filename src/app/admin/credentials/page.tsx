"use client";

import { useState, useEffect } from "react";
import { AdminSidebar } from "../components/AdminSidebar";
import { AdminNavbar } from "../components/AdminNavbar";
import {
  KeyRound,
  Shield,
  Bike,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  Phone,
  Check,
  X,
  Copy,
  ExternalLink,
  ShieldAlert,
  Trash2,
} from "lucide-react";

interface CredentialAccount {
  id: string;
  name: string;
  email: string;
  username: string | null;
  phone: string | null;
  role: "ADMIN" | "DELIVERY_STAFF";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminCredentialsPage() {
  const [accounts, setAccounts] = useState<CredentialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"ALL" | "ADMIN" | "DELIVERY_STAFF">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createRole, setCreateRole] = useState<"ADMIN" | "DELIVERY_STAFF">("DELIVERY_STAFF");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    phone: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Edit / Password Reset Modal
  const [editModalAccount, setEditModalAccount] = useState<CredentialAccount | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  // Toast / Feedback State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }

  async function loadCredentials() {
    try {
      setRefreshing(true);
      const res = await fetch("/api/admin/credentials");
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
      }
    } catch (err) {
      console.error("Error loading credentials:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadCredentials();
  }, []);

  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setCreating(true);

    try {
      const res = await fetch("/api/admin/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          role: createRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create account.");
      }

      showToast(`Successfully created ${createRole === "ADMIN" ? "Admin" : "Delivery Boy"} account for ${formData.name}`);
      setCreateModalOpen(false);
      setFormData({ name: "", email: "", username: "", phone: "", password: "" });
      loadCredentials();
    } catch (err: any) {
      setFormError(err.message || "Failed to create account.");
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleActive(account: CredentialAccount) {
    try {
      const nextState = !account.isActive;
      const res = await fetch("/api/admin/credentials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: account.id,
          isActive: nextState,
        }),
      });

      if (res.ok) {
        setAccounts((prev) =>
          prev.map((acc) => (acc.id === account.id ? { ...acc, isActive: nextState } : acc))
        );
        showToast(`Account ${nextState ? "activated" : "deactivated"} successfully.`);
      } else {
        alert("Failed to update status.");
      }
    } catch (err) {
      console.error("Error updating active status:", err);
    }
  }

  async function handleUpdateCredentials(e: React.FormEvent) {
    e.preventDefault();
    if (!editModalAccount) return;
    setUpdatingPassword(true);

    try {
      const payload: any = {
        userId: editModalAccount.id,
        name: editName,
        phone: editPhone,
      };
      if (newPassword.trim()) {
        payload.password = newPassword.trim();
      }

      const res = await fetch("/api/admin/credentials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update account.");
      }

      showToast("Account credentials updated successfully!");
      setEditModalAccount(null);
      setNewPassword("");
      loadCredentials();
    } catch (err: any) {
      alert(err.message || "Failed to update account.");
    } finally {
      setUpdatingPassword(false);
    }
  }

  // Delete Confirmation Modal State
  const [deleteModalAccount, setDeleteModalAccount] = useState<CredentialAccount | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDeleteAccount() {
    if (!deleteModalAccount) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/admin/credentials?userId=${encodeURIComponent(deleteModalAccount.id)}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete account.");
      }

      showToast(`Account for ${deleteModalAccount.name} was permanently deleted.`);
      setDeleteModalAccount(null);
      loadCredentials();
    } catch (err: any) {
      alert(err.message || "Failed to delete account.");
    } finally {
      setDeleting(false);
    }
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const filteredAccounts = accounts.filter((acc) => {
    if (activeTab === "ADMIN" && acc.role !== "ADMIN") return false;
    if (activeTab === "DELIVERY_STAFF" && acc.role !== "DELIVERY_STAFF") return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = acc.name?.toLowerCase().includes(q);
      const matchEmail = acc.email?.toLowerCase().includes(q);
      const matchPhone = acc.phone?.toLowerCase().includes(q);
      const matchUsername = acc.username?.toLowerCase().includes(q);
      return matchName || matchEmail || matchPhone || matchUsername;
    }
    return true;
  });

  const adminCount = accounts.filter((a) => a.role === "ADMIN").length;
  const deliveryCount = accounts.filter((a) => a.role === "DELIVERY_STAFF").length;

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans relative">
      <AdminSidebar />

      <div className="pl-64 flex flex-col min-h-screen bg-white">
        <AdminNavbar />

        <main className="flex-1 p-6 sm:p-8 space-y-8 bg-white w-full">
          {/* Toast Notification */}
          {toastMessage && (
            <div className="fixed top-24 right-8 z-50 bg-black text-[#FFF8EE] px-5 py-3 rounded-2xl border-2 border-[#E5A00D] shadow-[4px_4px_0_#000] flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
              <CheckCircle2 size={18} className="text-[#E5A00D]" />
              <span className="text-xs font-black uppercase tracking-wider">{toastMessage}</span>
            </div>
          )}

          {/* Top Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-[#E5A00D]/20 text-black border border-amber-300">
                  <KeyRound size={20} className="text-black" />
                </span>
                <h1 className="text-3xl font-black text-black tracking-tight uppercase">
                  Staff &amp; Admin Credentials
                </h1>
              </div>
              <p className="text-xs font-bold text-slate-500 mt-1.5">
                Create and manage login access credentials for Kitchen Administrators and Delivery Boys.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={loadCredentials}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-sm transition-all"
              >
                <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                <span>Refresh</span>
              </button>

              <button
                onClick={() => {
                  setCreateRole("DELIVERY_STAFF");
                  setCreateModalOpen(true);
                  setFormError(null);
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black hover:bg-[#E5A00D] text-white hover:text-black text-xs font-black uppercase tracking-wider border-2 border-black transition-all shadow-sm"
              >
                <Plus size={16} />
                <span>Create Credentials</span>
              </button>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="p-5 rounded-2xl bg-amber-50/50 border-2 border-amber-200/80 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-amber-900">Total Staff Accounts</p>
                <h3 className="text-3xl font-black text-black mt-1 font-mono">{accounts.length}</h3>
                <p className="text-[11px] font-bold text-slate-500 mt-0.5">Active access logins</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-[#E5A00D] text-black flex items-center justify-center border border-amber-400">
                <KeyRound size={22} />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-blue-50/50 border-2 border-blue-200/80 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-blue-900">Admin Accounts</p>
                <h3 className="text-3xl font-black text-black mt-1 font-mono">{adminCount}</h3>
                <p className="text-[11px] font-bold text-slate-500 mt-0.5">Full dashboard authority</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-600 text-white flex items-center justify-center border border-blue-700">
                <Shield size={22} />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-emerald-50/50 border-2 border-emerald-200/80 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-emerald-900">Delivery Boy Accounts</p>
                <h3 className="text-3xl font-black text-black mt-1 font-mono">{deliveryCount}</h3>
                <p className="text-[11px] font-bold text-slate-500 mt-0.5">Assigned dispatch drivers</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center border border-emerald-700">
                <Bike size={22} />
              </div>
            </div>
          </div>

          {/* Filtering & Search Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            {/* Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200 shadow-sm">
              {[
                { id: "ALL", label: `All (${accounts.length})` },
                { id: "DELIVERY_STAFF", label: `Delivery Boys (${deliveryCount})` },
                { id: "ADMIN", label: `Admins (${adminCount})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                    activeTab === tab.id
                      ? "bg-black text-[#FFF8EE]"
                      : "text-slate-600 hover:text-black hover:bg-slate-50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, phone..."
                className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-xs font-medium text-black focus:outline-none focus:border-[#E5A00D]"
              />
            </div>
          </div>

          {/* Accounts Table List */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <Loader2 size={32} className="animate-spin text-[#E5A00D]" />
                <p className="text-xs font-bold text-slate-500">Loading credential accounts...</p>
              </div>
            ) : filteredAccounts.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <KeyRound size={40} className="mx-auto text-slate-300" />
                <h3 className="text-sm font-black uppercase text-slate-700">No Credentials Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Click &quot;Create Credentials&quot; to provision login access for a new Delivery Boy or Administrator.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-outfit font-black text-[11px] uppercase text-slate-600 tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Staff Member</th>
                    <th className="py-3.5 px-4">Access Role</th>
                    <th className="py-3.5 px-4">Login Email / Username</th>
                    <th className="py-3.5 px-4">Phone Number</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Created Date</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredAccounts.map((acc) => {
                    const isAdmin = acc.role === "ADMIN";

                    return (
                      <tr key={acc.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                                isAdmin
                                  ? "bg-blue-100 text-blue-800 border border-blue-200"
                                  : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              }`}
                            >
                              {isAdmin ? <Shield size={16} /> : <Bike size={16} />}
                            </div>
                            <div>
                              <p className="font-bold text-black">{acc.name}</p>
                              <span className="text-[10px] font-mono text-slate-400">ID: {acc.id}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                              isAdmin
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}
                          >
                            {isAdmin ? "Admin Access" : "Delivery Boy"}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-800">{acc.email}</span>
                              <button
                                onClick={() => copyToClipboard(acc.email, `${acc.id}-email`)}
                                title="Copy Email"
                                className="text-slate-400 hover:text-black"
                              >
                                {copiedId === `${acc.id}-email` ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                              </button>
                            </div>
                            {acc.username && (
                              <p className="text-[11px] font-mono text-slate-500">@{acc.username}</p>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-mono text-slate-700 font-semibold">{acc.phone || "—"}</span>
                        </td>

                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => handleToggleActive(acc)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
                              acc.isActive
                                ? "bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200"
                                : "bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200"
                            }`}
                          >
                            {acc.isActive ? "Active (Enabled)" : "Deactivated"}
                          </button>
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 font-semibold text-[11px]">
                          {new Date(acc.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditModalAccount(acc);
                                setEditName(acc.name || "");
                                setEditPhone(acc.phone || "");
                                setNewPassword("");
                              }}
                              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-black bg-white hover:bg-black hover:text-white font-outfit font-black text-[11px] uppercase tracking-wider transition-colors shadow-sm"
                            >
                              Edit
                            </button>

                            <button
                              onClick={() => setDeleteModalAccount(acc)}
                              title="Delete credentials"
                              className="p-1.5 rounded-xl border border-rose-200 hover:border-rose-600 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white transition-colors shadow-sm"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>

      {/* ── CREATE CREDENTIALS MODAL ── */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl border-2 border-black p-6 sm:p-8 space-y-5 shadow-2xl">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#E5A00D] text-black">
                  Staff Provisioning
                </span>
                <h3 className="text-xl font-black uppercase text-black tracking-tight mt-1">
                  Create New Credentials
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Set up dashboard access credentials for your team.
                </p>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Role Selection Switcher */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1.5">
                Select Account Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCreateRole("DELIVERY_STAFF")}
                  className={`p-3.5 rounded-2xl border-2 flex items-center gap-3 transition-all ${
                    createRole === "DELIVERY_STAFF"
                      ? "bg-emerald-50 border-emerald-600 text-emerald-950 font-black shadow-sm"
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <div className={`p-2 rounded-xl ${createRole === "DELIVERY_STAFF" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                    <Bike size={18} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs uppercase font-black">Delivery Boy</p>
                    <p className="text-[10px] text-slate-500 font-medium">Delivery Staff Portal</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setCreateRole("ADMIN")}
                  className={`p-3.5 rounded-2xl border-2 flex items-center gap-3 transition-all ${
                    createRole === "ADMIN"
                      ? "bg-blue-50 border-blue-600 text-blue-950 font-black shadow-sm"
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <div className={`p-2 rounded-xl ${createRole === "ADMIN" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                    <Shield size={18} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs uppercase font-black">Administrator</p>
                    <p className="text-[10px] text-slate-500 font-medium">Full Admin Authority</p>
                  </div>
                </button>
              </div>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Form Fields */}
            <form onSubmit={handleCreateAccount} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    required
                    type="text"
                    placeholder="e.g. Ramesh Reddy"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-black focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 uppercase tracking-wider mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      required
                      type="email"
                      placeholder="ramesh@qbowl.in"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-black focus:outline-none focus:border-black"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      placeholder="+91 9876543210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-black focus:outline-none focus:border-black"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Login Password * (Min 6 Characters)
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-black focus:outline-none focus:border-black"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-black"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="pt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 font-bold uppercase tracking-wider text-slate-700 transition-colors"
                >
                  Cancel
                </button>

                <button
                  disabled={creating}
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-black text-white hover:bg-[#E5A00D] hover:text-black font-black uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {creating ? <Loader2 size={16} className="animate-spin" /> : <span>Create Account</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT / PASSWORD RESET MODAL ── */}
      {editModalAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl border-2 border-black p-6 sm:p-8 space-y-5 shadow-2xl">
            
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#E5A00D] text-black">
                  Edit Account
                </span>
                <h3 className="text-xl font-black uppercase text-black tracking-tight mt-1">
                  {editModalAccount.name}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {editModalAccount.email} ({editModalAccount.role})
                </p>
              </div>
              <button
                onClick={() => setEditModalAccount(null)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateCredentials} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-black focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-black focus:outline-none focus:border-black"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
                <div className="flex items-center gap-1.5 text-amber-900 font-black uppercase text-[11px]">
                  <Lock size={14} />
                  <span>Reset / Change Password</span>
                </div>
                <input
                  type="password"
                  placeholder="Enter new password (leave blank to keep unchanged)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-xs font-semibold text-black focus:outline-none focus:border-black"
                />
                <p className="text-[10px] text-amber-800">
                  Minimum 6 characters. Will replace current password immediately.
                </p>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEditModalAccount(null)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 font-bold uppercase tracking-wider text-slate-700 transition-colors"
                >
                  Cancel
                </button>

                <button
                  disabled={updatingPassword}
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-black text-white hover:bg-[#E5A00D] hover:text-black font-black uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {updatingPassword ? <Loader2 size={16} className="animate-spin" /> : <span>Save Changes</span>}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION MODAL ── */}
      {deleteModalAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl border-2 border-black p-6 sm:p-8 space-y-5 shadow-2xl">
            
            <div className="flex items-center gap-3.5 text-rose-600">
              <div className="h-12 w-12 rounded-2xl bg-rose-100 flex items-center justify-center border border-rose-300 shrink-0">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black uppercase text-black tracking-tight">
                  Delete Credentials?
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  This will permanently revoke login access for this account.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <p className="font-bold text-black flex items-center justify-between">
                <span>Staff Member:</span>
                <span className="font-mono">{deleteModalAccount.name}</span>
              </p>
              <p className="font-bold text-slate-600 flex items-center justify-between">
                <span>Email:</span>
                <span className="font-mono text-slate-900">{deleteModalAccount.email}</span>
              </p>
              <p className="font-bold text-slate-600 flex items-center justify-between">
                <span>Role:</span>
                <span className="font-black uppercase text-amber-700">{deleteModalAccount.role}</span>
              </p>
            </div>

            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
              ⚠️ Deleting this account will immediately remove their authorization to sign in to the {deleteModalAccount.role === "ADMIN" ? "Admin Panel" : "Delivery Staff App"}.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalAccount(null)}
                className="w-1/2 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 font-bold uppercase tracking-wider text-slate-700 transition-colors text-xs"
              >
                Cancel
              </button>

              <button
                disabled={deleting}
                onClick={handleDeleteAccount}
                className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-xs shadow-sm"
              >
                {deleting ? <Loader2 size={16} className="animate-spin" /> : <span>Delete Permanently</span>}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
