"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CustomerNavbar } from "@/components/dashboard/CustomerNavbar";
import {
  ShieldAlert,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  ChevronRight,
  ArrowLeft,
  Send,
  Loader2,
  Image as ImageIcon,
  X,
  FileText,
  User,
  ShoppingBag,
  Sparkles,
  HelpCircle,
} from "lucide-react";

interface ComplaintItem {
  id: string;
  orderId: string | null;
  userId: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  category: string;
  subject: string;
  description: string;
  imageUrl: string | null;
  status: string; // 'Open' | 'Reviewing' | 'In Progress' | 'Resolved' | 'Closed'
  priority: string; // 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  adminNotes: string | null;
  foodItemName?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

interface TicketMessage {
  id: string;
  complaintId: string;
  senderType: "ADMIN" | "CUSTOMER";
  senderName: string;
  message: string;
  statusUpdate: string | null;
  createdAt: string;
}

export default function MyComplaintsPage() {
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Selected Complaint for Ticket Details Drawer/Modal
  const [selectedTicket, setSelectedTicket] = useState<ComplaintItem | null>(null);
  const [ticketMessages, setTicketMessages] = useState<TicketMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  // Photo Viewer Modal
  const [photoViewerUrl, setPhotoViewerUrl] = useState<string | null>(null);

  // Fetch all user complaints
  async function fetchComplaints(isSilent = false) {
    if (!isSilent) setLoading(true);
    setRefreshing(true);
    try {
      const res = await fetch("/api/user/complaints");
      if (res.ok) {
        const data = await res.json();
        setComplaints(data.complaints || []);
      }
    } catch (err) {
      console.error("Error loading user complaints:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchComplaints();
  }, []);

  // Fetch ticket details & messages
  async function openTicketDetails(ticket: ComplaintItem) {
    setSelectedTicket(ticket);
    setLoadingMessages(true);
    setTicketMessages([]);
    try {
      const res = await fetch(`/api/user/complaints/${ticket.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.complaint) {
          setSelectedTicket(data.complaint);
        }
        setTicketMessages(data.messages || []);
      }
    } catch (err) {
      console.error("Error loading ticket detail:", err);
    } finally {
      setLoadingMessages(false);
    }
  }

  // Submit customer reply to ticket
  async function handleSendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;

    setSubmittingReply(true);
    try {
      const res = await fetch(`/api/user/complaints/${selectedTicket.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: replyText.trim() }),
      });

      if (res.ok) {
        setReplyText("");
        // Refresh ticket details
        openTicketDetails(selectedTicket);
        fetchComplaints(true);
      }
    } catch (err) {
      console.error("Error sending reply:", err);
    } finally {
      setSubmittingReply(false);
    }
  }

  const filteredComplaints = complaints.filter((c) => {
    if (statusFilter !== "ALL" && c.status.toUpperCase() !== statusFilter.toUpperCase()) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        c.id.toLowerCase().includes(q) ||
        c.subject.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        (c.orderId && c.orderId.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getStatusBadgeStyle = (status: string) => {
    const s = status.toUpperCase();
    if (s === "OPEN") return "bg-rose-100 text-rose-900 border-rose-400";
    if (s === "REVIEWING") return "bg-sky-100 text-sky-900 border-sky-400";
    if (s === "IN_PROGRESS" || s === "IN PROGRESS") return "bg-amber-100 text-amber-900 border-amber-400";
    if (s === "RESOLVED") return "bg-emerald-100 text-emerald-900 border-emerald-400";
    return "bg-slate-100 text-slate-800 border-slate-300";
  };

  return (
    <div className="min-h-screen bg-[#FFF8EE] text-slate-900 font-sans pb-16">
      <CustomerNavbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
        {/* Header Breadcrumb & Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border-3 border-black rounded-3xl p-6 shadow-[5px_5px_0_#000]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-500 text-white border-2 border-black flex items-center justify-center font-black shadow-[3px_3px_0_#000]">
              <ShieldAlert size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-black uppercase text-zinc-500 tracking-wider">
                <Link href="/dashboard" className="hover:text-black transition-colors">
                  Dashboard
                </Link>
                <ChevronRight size={12} />
                <span className="text-black">My Complaints</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-black uppercase tracking-tight font-outfit mt-0.5">
                Support Tickets &amp; Complaints
              </h1>
              <p className="text-xs font-bold text-zinc-600">
                Track status updates, review support history, and converse directly with Q1 Bowl Resolution Team.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchComplaints()}
              disabled={refreshing}
              className="px-4 py-2.5 bg-[#FFF8EE] hover:bg-amber-100 text-black border-2 border-black font-black text-xs rounded-xl flex items-center gap-2 transition-all shadow-[2px_2px_0_#000]"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-[#E5A00D]" : ""}`} />
              <span>Refresh History</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white border-3 border-black rounded-2xl p-4 shadow-[4px_4px_0_#000] grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search complaint ID, order #, subject..."
              className="w-full pl-9 pr-4 py-2.5 bg-[#FFF8EE] border-2 border-black rounded-xl text-xs font-bold text-black focus:outline-none"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#FFF8EE] border-2 border-black rounded-xl text-xs font-bold text-black focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">🔴 Open</option>
              <option value="REVIEWING">🔵 Reviewing</option>
              <option value="IN_PROGRESS">🟡 In Progress</option>
              <option value="RESOLVED">🟢 Resolved</option>
              <option value="CLOSED">⚪ Closed</option>
            </select>
          </div>

          <div className="flex items-center justify-end text-xs font-black text-zinc-500 uppercase tracking-wider">
            Total Tickets: <span className="ml-1 text-black font-extrabold text-sm">{complaints.length}</span>
          </div>
        </div>

        {/* Complaints Feed List */}
        {loading ? (
          <div className="p-16 text-center bg-white border-3 border-black rounded-2xl shadow-[4px_4px_0_#000] space-y-3">
            <Loader2 className="w-8 h-8 text-[#E5A00D] animate-spin mx-auto" />
            <p className="text-xs font-black text-black uppercase tracking-wider">
              Loading Your Support Tickets...
            </p>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="p-16 text-center bg-white border-3 border-black rounded-2xl shadow-[4px_4px_0_#000] space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#FFF8EE] border-2 border-black flex items-center justify-center mx-auto text-zinc-400">
              <ShieldAlert size={32} />
            </div>
            <h3 className="text-lg font-black text-black uppercase font-outfit">No Complaints Found</h3>
            <p className="text-xs text-zinc-500 font-bold max-w-md mx-auto">
              You haven&apos;t filed any support complaints matching your search criteria. If you have an issue with a delivered order, you can file a complaint from your Order History.
            </p>
            <Link
              href="/dashboard#orders"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E5A00D] text-black border-2 border-black rounded-xl text-xs font-black uppercase shadow-[3px_3px_0_#000] hover:bg-amber-400 transition-all"
            >
              <span>View Order History</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredComplaints.map((cmp) => (
              <div
                key={cmp.id}
                onClick={() => openTicketDetails(cmp)}
                className="bg-white border-3 border-black rounded-2xl p-6 shadow-[5px_5px_0_#000] hover:shadow-[7px_7px_0_#000] hover:-translate-y-0.5 cursor-pointer transition-all space-y-4"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-black/10">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-black text-[#E5A00D] font-mono font-black text-xs rounded-xl border border-black">
                      {cmp.id}
                    </span>
                    <div>
                      <div className="text-xs font-black text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                        <span>Category: <strong className="text-black">{cmp.category}</strong></span>
                        {cmp.orderId && <span>• Order #{cmp.orderId.slice(0, 8).toUpperCase()}</span>}
                      </div>
                      <h3 className="text-base font-black text-black font-outfit mt-0.5">
                        {cmp.subject}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Priority Badge */}
                    <span className="px-2.5 py-0.5 bg-zinc-100 text-zinc-800 font-extrabold text-[10px] rounded-full border border-black/20 uppercase">
                      Priority: {cmp.priority}
                    </span>

                    {/* Status Badge */}
                    <span
                      className={`px-3 py-1 font-black text-xs rounded-full border-2 uppercase tracking-wider ${getStatusBadgeStyle(
                        cmp.status
                      )}`}
                    >
                      {cmp.status}
                    </span>
                  </div>
                </div>

                {/* Body snippet */}
                <p className="text-xs text-zinc-700 font-medium line-clamp-2 leading-relaxed bg-[#FFF8EE] p-3 rounded-xl border border-black/10">
                  &ldquo;{cmp.description}&rdquo;
                </p>

                {/* Footer Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-xs">
                  <div className="text-[11px] font-mono text-zinc-500 font-bold">
                    Submitted: {new Date(cmp.createdAt).toLocaleString()}
                  </div>

                  <div className="flex items-center gap-2 font-black text-black text-xs hover:text-[#E5A00D] transition-colors">
                    <MessageSquare size={14} className="text-[#E5A00D]" />
                    <span>View Support Conversation &amp; Timeline</span>
                    <ChevronRight size={14} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* TICKET DETAILS & CONVERSATION MODAL                         */}
      {/* ════════════════════════════════════════════════════════════ */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border-3 border-black w-full max-w-2xl rounded-3xl p-6 space-y-5 relative text-slate-900 shadow-[8px_8px_0_#000] max-h-[90vh] flex flex-col">
            {/* Modal Top Header */}
            <div className="flex items-center justify-between border-b-2 border-black pb-3 shrink-0">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-black text-[#E5A00D] font-mono font-black text-xs rounded-xl">
                  {selectedTicket.id}
                </span>
                <div>
                  <h3 className="text-base font-black text-black uppercase tracking-tight font-outfit">
                    {selectedTicket.subject}
                  </h3>
                  <div className="text-[11px] font-bold text-zinc-500 flex items-center gap-2">
                    <span>Category: {selectedTicket.category}</span>
                    {selectedTicket.orderId && <span>• Order #{selectedTicket.orderId.slice(0, 8).toUpperCase()}</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 font-black text-xs rounded-full border-2 uppercase tracking-wider ${getStatusBadgeStyle(
                    selectedTicket.status
                  )}`}
                >
                  {selectedTicket.status}
                </span>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="p-1 text-zinc-400 hover:text-black rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Scrollable Modal Content */}
            <div className="flex-1 overflow-y-auto space-y-5 pr-1">
              {/* Ticket Meta Summary Card */}
              <div className="bg-[#FFF8EE] border-2 border-black rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between text-zinc-600 font-bold">
                  <span>Food Dish: <strong className="text-black">{selectedTicket.foodItemName || "Gourmet Dish"}</strong></span>
                  <span className="font-mono text-[11px]">Submitted: {new Date(selectedTicket.createdAt).toLocaleString()}</span>
                </div>
                <div>
                  <span className="font-black text-black block mb-1">Issue Description:</span>
                  <p className="text-zinc-800 font-medium leading-relaxed bg-white p-3 rounded-xl border border-black/10">
                    {selectedTicket.description}
                  </p>
                </div>

                {/* Attached Photo Proof if present */}
                {selectedTicket.imageUrl && (
                  <div className="pt-2">
                    <span className="font-black text-black text-[11px] block mb-1">Attached Photo Evidence:</span>
                    <button
                      type="button"
                      onClick={() => setPhotoViewerUrl(selectedTicket.imageUrl)}
                      className="px-3 py-2 bg-white hover:bg-amber-50 border-2 border-black rounded-xl text-xs font-bold text-black flex items-center gap-2 transition-colors shadow-[2px_2px_0_#000]"
                    >
                      <ImageIcon className="w-4 h-4 text-purple-600" />
                      <span>View Full Resolution Photo Proof</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Conversation Messages Timeline */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-black uppercase tracking-wider flex items-center gap-1.5 border-b-2 border-black/10 pb-2">
                  <MessageSquare size={14} className="text-[#E5A00D]" />
                  <span>Support Ticket Conversation &amp; Updates History</span>
                </h4>

                {loadingMessages ? (
                  <div className="py-8 text-center space-y-2">
                    <Loader2 className="w-6 h-6 text-[#E5A00D] animate-spin mx-auto" />
                    <span className="text-xs font-bold text-zinc-500">Loading conversation history...</span>
                  </div>
                ) : ticketMessages.length === 0 ? (
                  <div className="p-4 bg-zinc-50 border border-black/10 rounded-xl text-center text-xs text-zinc-500 font-bold">
                    No replies yet. Resolution team has been assigned to your ticket.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {ticketMessages.map((msg) => {
                      const isAdmin = msg.senderType === "ADMIN";
                      return (
                        <div
                          key={msg.id}
                          className={`p-4 rounded-2xl border-2 space-y-1.5 text-xs ${
                            isAdmin
                              ? "bg-amber-50/50 border-[#E5A00D] shadow-[2px_2px_0_#000]"
                              : "bg-white border-black/20"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                  isAdmin
                                    ? "bg-black text-[#E5A00D]"
                                    : "bg-zinc-200 text-zinc-800"
                                }`}
                              >
                                {isAdmin ? "Q1 Bowl Support" : "You (Customer)"}
                              </span>
                              <span className="font-bold text-black">{msg.senderName}</span>
                            </div>

                            <span className="text-[10px] font-mono text-zinc-400">
                              {new Date(msg.createdAt).toLocaleString()}
                            </span>
                          </div>

                          <p className="text-zinc-800 font-semibold leading-relaxed">
                            {msg.message}
                          </p>

                          {msg.statusUpdate && (
                            <div className="pt-1 text-[10px] font-black text-[#E5A00D] uppercase flex items-center gap-1">
                              <Sparkles size={10} /> Status Changed To: {msg.statusUpdate}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Customer Reply Input Box */}
            <form onSubmit={handleSendReply} className="pt-3 border-t-2 border-black shrink-0 space-y-2">
              <label className="text-[11px] font-black text-black uppercase tracking-wider block">
                Add a Follow-Up Reply:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your message or clarification..."
                  className="flex-1 p-3 bg-[#FFF8EE] border-2 border-black rounded-xl text-xs font-bold text-black focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={submittingReply || !replyText.trim()}
                  className="px-5 py-3 bg-black text-[#E5A00D] font-black text-xs rounded-xl flex items-center gap-1.5 shadow-[3px_3px_0_#E5A00D] hover:bg-zinc-800 disabled:opacity-50 transition-all"
                >
                  {submittingReply ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                  <span>Send</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Photo Proof Viewer Modal */}
      {photoViewerUrl && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border-3 border-black w-full max-w-2xl rounded-3xl p-6 space-y-4 relative shadow-[8px_8px_0_#000]">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <h3 className="text-base font-black text-black uppercase tracking-tight flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-purple-600" /> Attached Photo Evidence
              </h3>
              <button onClick={() => setPhotoViewerUrl(null)} className="p-1 text-zinc-400 hover:text-black">
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[65vh] overflow-auto flex items-center justify-center bg-zinc-100 rounded-2xl p-2 border-2 border-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoViewerUrl}
                alt="Complaint Proof"
                className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-sm"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setPhotoViewerUrl(null)}
                className="px-5 py-2.5 bg-black text-white font-extrabold text-xs rounded-xl shadow-[3px_3px_0_#000]"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
