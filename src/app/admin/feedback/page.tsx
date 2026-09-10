"use client";

import { useState, useEffect } from "react";
import { AdminSidebar } from "../components/AdminSidebar";
import { AdminNavbar } from "../components/AdminNavbar";
import {
  MessageSquare,
  Star,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  RefreshCw,
  Sparkles,
  MessageCircle,
  ThumbsUp,
  X,
  Loader2,
  Send,
  Eye,
  FileText,
  Image as ImageIcon,
  ShieldAlert,
  Save,
  PackageCheck,
  Headphones,
  User,
  ShoppingBag,
  Truck,
  MapPin,
  Phone,
  Mail,
  ChevronRight,
  Check,
} from "lucide-react";

interface FeedbackEntry {
  id: string;
  userId: string | null;
  orderId: string | null;
  subscriptionId: string | null;
  foodItemId: string | null;
  customerName: string;
  category: string;
  rating: number;
  foodRating?: number | null;
  deliveryRating?: number | null;
  comment: string;
  isResolved: boolean;
  isFeatured: boolean;
  adminReply: string | null;
  repliedAt: string | null;
  createdAt: string;
  foodItemName?: string;
  userEmail?: string;
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

interface ComplaintEntry {
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
  createdAt: string;
  resolvedAt: string | null;
  customerInfo?: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  orderInfo?: {
    orderId: string;
    items: Array<{ name: string; quantity: number; price: number }>;
    itemsSummary: string;
    totalAmount: number;
    type: string;
    status: string;
    createdAt: string;
  };
  deliveryInfo?: {
    partnerName: string;
    partnerPhone: string;
    kitchenName: string;
    assignedAt?: string;
    pickedUpAt?: string;
    deliveredAt?: string;
    durationMinutes: number;
  };
  previousFeedback?: {
    rating: number;
    comment: string;
  } | null;
  messages?: TicketMessage[];
}

interface DishInsight {
  id: string;
  name: string;
  totalReviews: number;
  avgRating: string;
  recentReview: string;
}

interface SummaryData {
  totalFeedback: number;
  averageRating: string;
  fiveStarCount: number;
  negativeCount: number;
  feedbackTodayCount: number;
}

const PREDEFINED_TEMPLATES = [
  "We're reviewing your issue",
  "Our team is investigating",
  "We've identified the issue",
  "Your issue has been resolved",
  "We'll get back to you shortly",
];

export default function AdminFeedbackPage() {
  const [activeMainTab, setActiveMainTab] = useState<"REVIEWS" | "COMPLAINTS">("REVIEWS");

  // Reviews State
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [refreshingReviews, setRefreshingReviews] = useState(false);
  const [summary, setSummary] = useState<SummaryData>({
    totalFeedback: 0,
    averageRating: "0.0",
    fiveStarCount: 0,
    negativeCount: 0,
    feedbackTodayCount: 0,
  });
  const [dishInsights, setDishInsights] = useState<DishInsight[]>([]);
  const [feedbackList, setFeedbackList] = useState<FeedbackEntry[]>([]);

  // Reviews Filters
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [selectedDishId, setSelectedDishId] = useState<string>("ALL");
  const [ratingFilter, setRatingFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Review Reply Modal State
  const [replyEntry, setReplyEntry] = useState<FeedbackEntry | null>(null);
  const [replyInput, setReplyInput] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  // Complaints State
  const [loadingComplaints, setLoadingComplaints] = useState(true);
  const [refreshingComplaints, setRefreshingComplaints] = useState(false);
  const [complaintsList, setComplaintsList] = useState<ComplaintEntry[]>([]);
  const [complaintCounts, setComplaintCounts] = useState({
    total: 0,
    open: 0,
    reviewing: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
  });
  const [complaintStatusFilter, setComplaintStatusFilter] = useState<string>("ALL");
  const [complaintCategoryFilter, setComplaintCategoryFilter] = useState<string>("ALL");
  const [complaintSearch, setComplaintSearch] = useState<string>("");

  // 360° Complaint Detail View Modal State
  const [selected360Complaint, setSelected360Complaint] = useState<ComplaintEntry | null>(null);
  const [supportTemplate, setSupportTemplate] = useState<string>("");
  const [supportResponseText, setSupportResponseText] = useState<string>("");
  const [sendEmailCheck, setSendEmailCheck] = useState<boolean>(true);
  const [updateStatus, setUpdateStatus] = useState<string>("Open");
  const [updatePriority, setUpdatePriority] = useState<string>("MEDIUM");
  const [internalNoteText, setInternalNoteText] = useState<string>("");
  const [submittingAdminAction, setSubmittingAdminAction] = useState(false);

  // Image Proof Modal State
  const [viewImageModal, setViewImageModal] = useState<string | null>(null);

  // Fetch Reviews Data
  async function fetchFeedbackData(isSilent = false) {
    if (!isSilent) setLoadingReviews(true);
    setRefreshingReviews(true);
    try {
      const params = new URLSearchParams();
      if (activeCategory !== "ALL") params.set("category", activeCategory);
      if (ratingFilter !== "ALL") params.set("rating", ratingFilter);
      if (selectedDishId !== "ALL") params.set("dishId", selectedDishId);
      if (searchQuery) params.set("search", searchQuery);

      const res = await fetch(`/api/admin/feedback?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary || {});
        setDishInsights(data.dishInsights || []);
        setFeedbackList(data.feedback || []);
      }
    } catch (err) {
      console.error("Failed to fetch feedback data:", err);
    } finally {
      setLoadingReviews(false);
      setRefreshingReviews(false);
    }
  }

  // Fetch Complaints Data
  async function fetchComplaintsData(isSilent = false) {
    if (!isSilent) setLoadingComplaints(true);
    setRefreshingComplaints(true);
    try {
      const params = new URLSearchParams();
      if (complaintStatusFilter !== "ALL") params.set("status", complaintStatusFilter);
      if (complaintCategoryFilter !== "ALL") params.set("category", complaintCategoryFilter);

      const res = await fetch(`/api/admin/complaints?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setComplaintsList(data.complaints || []);
        setComplaintCounts(
          data.counts || { total: 0, open: 0, reviewing: 0, inProgress: 0, resolved: 0, closed: 0 }
        );
      }
    } catch (err) {
      console.error("Failed to fetch complaints data:", err);
    } finally {
      setLoadingComplaints(false);
      setRefreshingComplaints(false);
    }
  }

  useEffect(() => {
    if (activeMainTab === "REVIEWS") {
      fetchFeedbackData();
    } else {
      fetchComplaintsData();
    }
  }, [activeMainTab, activeCategory, selectedDishId, ratingFilter, complaintStatusFilter, complaintCategoryFilter]);

  useEffect(() => {
    if (activeMainTab === "REVIEWS") {
      const timer = setTimeout(() => fetchFeedbackData(true), 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery]);

  // Open 360° Complaint Detail Modal
  function open360Modal(complaint: ComplaintEntry) {
    setSelected360Complaint(complaint);
    setUpdateStatus(complaint.status || "Open");
    setUpdatePriority(complaint.priority || "MEDIUM");
    setInternalNoteText(complaint.adminNotes || "");
    setSupportResponseText("");
    setSupportTemplate("");
  }

  // Toggle Resolved status for review
  async function handleToggleResolved(entry: FeedbackEntry) {
    const nextState = !entry.isResolved;
    setFeedbackList((prev) =>
      prev.map((item) => (item.id === entry.id ? { ...item, isResolved: nextState } : item))
    );
    try {
      await fetch(`/api/admin/feedback/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isResolved: nextState }),
      });
    } catch (err) {
      console.error("Error toggling resolved state:", err);
    }
  }

  // Toggle Featured Testimonial status
  async function handleToggleFeatured(entry: FeedbackEntry) {
    const nextState = !entry.isFeatured;
    setFeedbackList((prev) =>
      prev.map((item) => (item.id === entry.id ? { ...item, isFeatured: nextState } : item))
    );
    try {
      await fetch(`/api/admin/feedback/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: nextState }),
      });
    } catch (err) {
      console.error("Error toggling featured state:", err);
    }
  }

  // Submit Admin Reply for review
  async function handleSubmitReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyEntry || !replyInput.trim()) return;
    setSubmittingReply(true);
    try {
      const res = await fetch(`/api/admin/feedback/${replyEntry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminReply: replyInput.trim() }),
      });
      if (res.ok) {
        setReplyEntry(null);
        setReplyInput("");
        fetchFeedbackData(true);
      }
    } catch (err) {
      console.error("Error submitting admin reply:", err);
    } finally {
      setSubmittingReply(false);
    }
  }

  // Submit 360° Complaint Admin Action (Status change, Support response & Email)
  async function handleSave360ComplaintAction(e: React.FormEvent) {
    e.preventDefault();
    if (!selected360Complaint) return;

    setSubmittingAdminAction(true);
    try {
      const res = await fetch("/api/admin/complaints", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complaintId: selected360Complaint.id,
          status: updateStatus,
          priority: updatePriority,
          adminNotes: internalNoteText,
          adminResponse: supportResponseText,
          sendEmail: sendEmailCheck,
          adminName: "Q1 Bowl Resolution Team",
        }),
      });

      if (res.ok) {
        setSelected360Complaint(null);
        fetchComplaintsData(true);
      }
    } catch (err) {
      console.error("Error saving complaint admin action:", err);
    } finally {
      setSubmittingAdminAction(false);
    }
  }

  // Template select change handler
  const handleTemplateSelect = (tmpl: string) => {
    setSupportTemplate(tmpl);
    if (tmpl) {
      setSupportResponseText((prev) => (prev ? `${prev}\n${tmpl}` : tmpl));
    }
  };

  // Filter complaints by local search query
  const filteredComplaints = complaintsList.filter((c) => {
    if (!complaintSearch) return true;
    const q = complaintSearch.toLowerCase();
    return (
      c.id.toLowerCase().includes(q) ||
      c.customerName.toLowerCase().includes(q) ||
      (c.customerEmail && c.customerEmail.toLowerCase().includes(q)) ||
      c.subject.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      (c.orderId && c.orderId.toLowerCase().includes(q))
    );
  });

  const getPriorityStyle = (p: string) => {
    const priority = p ? p.toUpperCase() : "MEDIUM";
    if (priority === "URGENT") return "bg-red-600 text-white font-black";
    if (priority === "HIGH") return "bg-rose-500 text-white font-bold";
    if (priority === "LOW") return "bg-slate-200 text-slate-800 font-bold";
    return "bg-amber-500 text-black font-bold";
  };

  const getStatusStyle = (s: string) => {
    const status = s ? s.toUpperCase() : "OPEN";
    if (["OPEN"].includes(status)) return "bg-rose-100 text-rose-900 border-rose-300 font-black";
    if (["REVIEWING"].includes(status)) return "bg-sky-100 text-sky-900 border-sky-300 font-black";
    if (["IN_PROGRESS", "IN PROGRESS"].includes(status))
      return "bg-amber-100 text-amber-900 border-amber-300 font-black";
    if (["RESOLVED"].includes(status))
      return "bg-emerald-100 text-emerald-900 border-emerald-300 font-black";
    return "bg-slate-100 text-slate-800 border-slate-300 font-bold";
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <AdminSidebar />
      <div className="pl-64 flex flex-col min-h-screen bg-white">
        <AdminNavbar />

        <main className="flex-1 p-8 space-y-8 bg-white">
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-[#E5A00D] text-black flex items-center justify-center font-extrabold shadow-sm border border-amber-400">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-black uppercase tracking-tight font-sans">
                  Feedback &amp; Support Management
                </h1>
                <p className="text-xs font-bold text-slate-500">
                  360° Order insights, support ticket workflow, email notifications, and customer review curation.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  activeMainTab === "REVIEWS" ? fetchFeedbackData() : fetchComplaintsData()
                }
                disabled={refreshingReviews || refreshingComplaints}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-2 transition-colors"
                title="Refresh"
              >
                <RefreshCw
                  className={`w-4 h-4 ${
                    refreshingReviews || refreshingComplaints ? "animate-spin text-[#E5A00D]" : ""
                  }`}
                />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* MAIN TOP TAB SWITCHER (REVIEWS vs COMPLAINTS) */}
          <div className="flex items-center gap-3 border-b-2 border-slate-200 pb-2">
            <button
              onClick={() => setActiveMainTab("REVIEWS")}
              className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeMainTab === "REVIEWS"
                  ? "bg-black text-[#E5A00D] shadow-md scale-[1.02]"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Star className="w-4 h-4 fill-[#E5A00D] text-[#E5A00D]" />
              <span>Customer Feedback &amp; Reviews</span>
              <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-[#E5A00D] text-black font-extrabold">
                {summary.totalFeedback}
              </span>
            </button>

            <button
              onClick={() => setActiveMainTab("COMPLAINTS")}
              className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 relative ${
                activeMainTab === "COMPLAINTS"
                  ? "bg-black text-[#E5A00D] shadow-md scale-[1.02]"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <span>Customer Complaints &amp; Support Tickets</span>
              {complaintCounts.open > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-600 text-white font-extrabold animate-pulse">
                  {complaintCounts.open} OPEN
                </span>
              )}
            </button>
          </div>

          {/* ════════════════════════════════════════════════════════════ */}
          {/* TAB 1: CUSTOMER REVIEWS & RATINGS                            */}
          {/* ════════════════════════════════════════════════════════════ */}
          {activeMainTab === "REVIEWS" && (
            <div className="space-y-8">
              {/* OVERVIEW METRIC CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Total Reviews
                    </span>
                    <div className="p-1.5 bg-slate-200 text-slate-800 rounded-lg">
                      <MessageSquare size={14} />
                    </div>
                  </div>
                  <div className="text-xl font-black text-black">{summary.totalFeedback}</div>
                  <div className="text-[10px] font-bold text-slate-500">Submitted by customers</div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Average Rating
                    </span>
                    <div className="p-1.5 bg-amber-100 text-amber-900 rounded-lg">
                      <Star size={14} fill="#E5A00D" className="text-[#E5A00D]" />
                    </div>
                  </div>
                  <div className="text-xl font-black text-black flex items-center gap-1">
                    {summary.averageRating} <span className="text-[#E5A00D] text-lg">★</span>
                  </div>
                  <div className="text-[10px] font-bold text-slate-500">Out of 5.0 stars</div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      5-Star Reviews
                    </span>
                    <div className="p-1.5 bg-emerald-100 text-emerald-900 rounded-lg">
                      <ThumbsUp size={14} />
                    </div>
                  </div>
                  <div className="text-xl font-black text-emerald-700">{summary.fiveStarCount}</div>
                  <div className="text-[10px] font-bold text-slate-500">Top rating entries</div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Negative (1★–2★)
                    </span>
                    <div className="p-1.5 bg-rose-100 text-rose-800 rounded-lg">
                      <AlertTriangle size={14} />
                    </div>
                  </div>
                  <div className="text-xl font-black text-rose-700">{summary.negativeCount}</div>
                  <div className="text-[10px] font-bold text-slate-500">Requires follow-up</div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Received Today
                    </span>
                    <div className="p-1.5 bg-purple-100 text-purple-800 rounded-lg">
                      <Clock size={14} />
                    </div>
                  </div>
                  <div className="text-xl font-black text-black">{summary.feedbackTodayCount}</div>
                  <div className="text-[10px] font-bold text-slate-500">New today</div>
                </div>
              </div>

              {/* FOOD ITEM INSIGHTS */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black text-black uppercase tracking-tight">
                      Food Item &amp; Bowl Ratings
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Click on any meal card to filter reviews specifically for that bowl.
                    </p>
                  </div>

                  {selectedDishId !== "ALL" && (
                    <button
                      onClick={() => setSelectedDishId("ALL")}
                      className="px-3 py-1 bg-black text-[#E5A00D] font-extrabold text-xs rounded-xl flex items-center gap-1"
                    >
                      <X size={12} /> Clear Dish Filter
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {dishInsights.map((dish) => {
                    const isSelected = selectedDishId === dish.id || selectedDishId === dish.name;
                    return (
                      <div
                        key={dish.id}
                        onClick={() => setSelectedDishId(isSelected ? "ALL" : dish.id)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? "bg-black text-[#E5A00D] border-black shadow-md scale-[1.02]"
                            : "bg-slate-50 text-slate-900 border-slate-200 hover:border-slate-400"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-black line-clamp-1 ${
                              isSelected ? "text-white" : "text-black"
                            }`}
                          >
                            {dish.name}
                          </span>
                          <span className="flex items-center gap-1 font-mono font-black text-xs text-[#E5A00D]">
                            <Star size={12} fill="#E5A00D" /> {dish.avgRating}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-400 font-medium mt-1">
                          {dish.totalReviews} customer reviews
                        </div>

                        <p
                          className={`text-[11px] line-clamp-2 italic mt-2 ${
                            isSelected ? "text-slate-300" : "text-slate-600"
                          }`}
                        >
                          &ldquo;{dish.recentReview}&rdquo;
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* REVIEWS FEED LIST */}
              {loadingReviews ? (
                <div className="p-16 text-center bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <Loader2 className="w-8 h-8 text-[#E5A00D] animate-spin mx-auto" />
                  <p className="text-xs font-black text-black uppercase">Loading Customer Reviews...</p>
                </div>
              ) : feedbackList.length === 0 ? (
                <div className="p-16 text-center bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <MessageSquare className="w-10 h-10 text-slate-400 mx-auto" />
                  <h3 className="text-base font-black text-black uppercase">No Reviews Found</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    No customer feedback entries matched your current search or category filters.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {feedbackList.map((entry) => (
                    <div
                      key={entry.id}
                      className={`bg-white border-2 rounded-2xl p-6 space-y-4 transition-all ${
                        entry.isFeatured
                          ? "border-[#E5A00D] shadow-sm bg-amber-50/10"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-black text-[#E5A00D] font-black text-sm flex items-center justify-center">
                            {entry.customerName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-black text-sm text-black flex items-center gap-2">
                              {entry.customerName}
                              {entry.isFeatured && (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-[10px] font-black flex items-center gap-1">
                                  <Sparkles size={10} /> Featured Review
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium flex items-center gap-2">
                              <span>{entry.foodItemName || "Artisan Bowl"}</span>
                              {entry.orderId && <span>• Order #{entry.orderId.slice(0, 8).toUpperCase()}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {/* Rating Breakdown */}
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] font-extrabold uppercase text-slate-400">Overall:</span>
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    size={14}
                                    fill={star <= entry.rating ? "#E5A00D" : "#E2E8F0"}
                                    className={star <= entry.rating ? "text-[#E5A00D]" : "text-slate-300"}
                                  />
                                ))}
                              </div>
                            </div>

                            {(entry.foodRating || entry.deliveryRating) && (
                              <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500">
                                {entry.foodRating && (
                                  <span>Food: <strong className="text-slate-800">{entry.foodRating}★</strong></span>
                                )}
                                {entry.deliveryRating && (
                                  <span>Delivery: <strong className="text-slate-800">{entry.deliveryRating}★</strong></span>
                                )}
                              </div>
                            )}
                          </div>

                          <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-full text-[10px] font-black uppercase text-slate-800">
                            {entry.category.replace(/_/g, " ")}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-800 font-semibold leading-relaxed">
                        &ldquo;{entry.comment}&rdquo;
                      </p>

                      {entry.adminReply && (
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                          <div className="font-black text-black flex items-center gap-1 text-[11px]">
                            <MessageCircle size={12} className="text-[#E5A00D]" /> Q1 Bowl Team Reply:
                          </div>
                          <p className="text-slate-700 font-medium">{entry.adminReply}</p>
                          {entry.repliedAt && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              Replied: {new Date(entry.repliedAt).toLocaleString()}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                        <div className="text-[11px] text-slate-400 font-mono">
                          Submitted: {new Date(entry.createdAt).toLocaleString()}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleFeatured(entry)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 border transition-colors ${
                              entry.isFeatured
                                ? "bg-amber-100 text-amber-900 border-amber-300 font-black"
                                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            <Sparkles size={12} /> {entry.isFeatured ? "Featured" : "Feature Testimonial"}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleResolved(entry)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 border transition-colors ${
                              entry.isResolved
                                ? "bg-emerald-100 text-emerald-900 border-emerald-300 font-black"
                                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            <CheckCircle2 size={12} /> {entry.isResolved ? "Resolved" : "Mark Resolved"}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setReplyEntry(entry);
                              setReplyInput(entry.adminReply || "");
                            }}
                            className="px-3 py-1.5 bg-black text-[#E5A00D] font-extrabold text-xs rounded-xl flex items-center gap-1 hover:bg-neutral-800"
                          >
                            <Send size={12} /> {entry.adminReply ? "Edit Reply" : "Reply to Review"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════ */}
          {/* TAB 2: COMPLAINTS & SUPPORT TICKETS                         */}
          {/* ════════════════════════════════════════════════════════════ */}
          {activeMainTab === "COMPLAINTS" && (
            <div className="space-y-8">
              {/* COMPLAINT METRICS (5 STAT CARDS) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Total Complaints
                    </span>
                    <div className="p-1.5 bg-slate-200 text-slate-800 rounded-lg">
                      <FileText size={14} />
                    </div>
                  </div>
                  <div className="text-xl font-black text-black">{complaintCounts.total}</div>
                  <div className="text-[10px] font-bold text-slate-500">All customer tickets</div>
                </div>

                <div className="bg-rose-50 border border-rose-200 p-5 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-rose-700">
                      Open Tickets
                    </span>
                    <div className="p-1.5 bg-rose-200 text-rose-900 rounded-lg">
                      <ShieldAlert size={14} />
                    </div>
                  </div>
                  <div className="text-xl font-black text-rose-700">{complaintCounts.open}</div>
                  <div className="text-[10px] font-bold text-rose-600">Action required</div>
                </div>

                <div className="bg-sky-50 border border-sky-200 p-5 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-sky-800">
                      Reviewing
                    </span>
                    <div className="p-1.5 bg-sky-200 text-sky-900 rounded-lg">
                      <Search size={14} />
                    </div>
                  </div>
                  <div className="text-xl font-black text-sky-900">{complaintCounts.reviewing}</div>
                  <div className="text-[10px] font-bold text-sky-700">Under investigation</div>
                </div>

                <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">
                      In Progress
                    </span>
                    <div className="p-1.5 bg-amber-200 text-amber-900 rounded-lg">
                      <Headphones size={14} />
                    </div>
                  </div>
                  <div className="text-xl font-black text-amber-900">{complaintCounts.inProgress}</div>
                  <div className="text-[10px] font-bold text-amber-700">Active support</div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                      Resolved
                    </span>
                    <div className="p-1.5 bg-emerald-200 text-emerald-900 rounded-lg">
                      <PackageCheck size={14} />
                    </div>
                  </div>
                  <div className="text-xl font-black text-emerald-800">{complaintCounts.resolved}</div>
                  <div className="text-[10px] font-bold text-emerald-600">Successfully closed</div>
                </div>
              </div>

              {/* COMPLAINT FILTERS & SEARCH TOOLBAR */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    value={complaintSearch}
                    onChange={(e) => setComplaintSearch(e.target.value)}
                    placeholder="Search complaint ID, order #, customer, description..."
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-black focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <select
                    value={complaintStatusFilter}
                    onChange={(e) => setComplaintStatusFilter(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-black focus:outline-none focus:border-black"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="OPEN">Open Only</option>
                    <option value="REVIEWING">Reviewing Only</option>
                    <option value="IN_PROGRESS">In Progress Only</option>
                    <option value="RESOLVED">Resolved Only</option>
                    <option value="CLOSED">Closed Only</option>
                  </select>
                </div>

                <div>
                  <select
                    value={complaintCategoryFilter}
                    onChange={(e) => setComplaintCategoryFilter(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-black focus:outline-none focus:border-black"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="Food Quality">Food Quality</option>
                    <option value="Delivery Issue">Delivery Issue</option>
                    <option value="Missing Item">Missing Item</option>
                    <option value="Packaging">Packaging</option>
                    <option value="Wrong Order">Wrong Order</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* COMPLAINTS LIST TABLE / CARDS */}
              {loadingComplaints ? (
                <div className="p-16 text-center bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <Loader2 className="w-8 h-8 text-[#E5A00D] animate-spin mx-auto" />
                  <p className="text-xs font-black text-black uppercase">Loading Customer Complaints...</p>
                </div>
              ) : filteredComplaints.length === 0 ? (
                <div className="p-16 text-center bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <ShieldAlert className="w-10 h-10 text-slate-400 mx-auto" />
                  <h3 className="text-base font-black text-black uppercase">No Customer Complaints Found</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    No customer complaints match your current filter criteria.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredComplaints.map((complaint) => (
                    <div
                      key={complaint.id}
                      className="bg-white border-2 border-slate-200 hover:border-slate-400 rounded-2xl p-6 space-y-4 transition-all"
                    >
                      {/* Top Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 bg-black text-[#E5A00D] font-mono font-black text-xs rounded-xl">
                            {complaint.id}
                          </span>
                          <div>
                            <div className="font-black text-sm text-black flex items-center gap-2">
                              {complaint.customerName}
                              <span className="text-xs font-normal text-slate-500">
                                ({complaint.customerEmail || "No Email"})
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium flex items-center gap-2">
                              <span>Submitted: {new Date(complaint.createdAt).toLocaleString()}</span>
                              {complaint.orderId && (
                                <span>• Order #{complaint.orderId.slice(0, 8).toUpperCase()}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Priority Badge */}
                          <span
                            className={`px-2.5 py-0.5 text-[10px] rounded-full uppercase tracking-wider ${getPriorityStyle(
                              complaint.priority
                            )}`}
                          >
                            {complaint.priority || "MEDIUM"} Priority
                          </span>

                          {/* Status Badge */}
                          <span
                            className={`px-3 py-1 text-xs rounded-full border uppercase tracking-wider ${getStatusStyle(
                              complaint.status
                            )}`}
                          >
                            {complaint.status}
                          </span>
                        </div>
                      </div>

                      {/* Subject & Description snippet */}
                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-black">{complaint.subject}</h4>
                        <p className="text-xs text-slate-700 font-medium leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                          &ldquo;{complaint.description}&rdquo;
                        </p>
                      </div>

                      {/* Actions Footer */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                        <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                          {complaint.imageUrl && (
                            <span className="flex items-center gap-1 font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200">
                              <ImageIcon size={12} /> Photo Attached
                            </span>
                          )}
                          <span>Category: <strong className="text-slate-800">{complaint.category}</strong></span>
                        </div>

                        <button
                          type="button"
                          onClick={() => open360Modal(complaint)}
                          className="px-4 py-2 bg-black text-[#E5A00D] font-extrabold text-xs rounded-xl flex items-center gap-2 hover:bg-neutral-800 transition-colors shadow-sm"
                        >
                          <Eye size={14} />
                          <span>View 360° Order &amp; Support Ticket</span>
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
      {/* 360° COMPLAINT & ORDER DETAILS MODAL                         */}
      {/* ════════════════════════════════════════════════════════════ */}
      {selected360Complaint && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border-2 border-black w-full max-w-4xl rounded-3xl p-6 space-y-6 relative text-slate-900 shadow-2xl max-h-[90vh] flex flex-col">
            {/* Top Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-black text-[#E5A00D] font-mono font-black text-sm rounded-xl">
                  {selected360Complaint.id}
                </span>
                <div>
                  <h3 className="text-lg font-black text-black uppercase tracking-tight font-sans">
                    360° Order &amp; Complaint Ticket View
                  </h3>
                  <div className="text-xs font-bold text-slate-500">
                    Subject: {selected360Complaint.subject}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelected360Complaint(null)}
                className="p-1 text-slate-400 hover:text-black rounded-lg"
              >
                <X size={22} />
              </button>
            </div>

            {/* Scrollable 360° Grid Content */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-1">
              {/* 1. 360° Info Cards (Customer, Order, Delivery) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Customer Info Card */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-black text-black uppercase tracking-wider text-[11px] border-b pb-1.5 border-slate-200">
                    <User size={14} className="text-[#E5A00D]" /> Customer Details
                  </div>
                  <div className="space-y-1 text-slate-700 font-medium">
                    <p className="font-bold text-black text-sm">{selected360Complaint.customerInfo?.name || selected360Complaint.customerName}</p>
                    <p className="flex items-center gap-1.5 text-slate-600">
                      <Mail size={12} className="text-slate-400" /> {selected360Complaint.customerInfo?.email || selected360Complaint.customerEmail || "N/A"}
                    </p>
                    <p className="flex items-center gap-1.5 text-slate-600">
                      <Phone size={12} className="text-slate-400" /> {selected360Complaint.customerInfo?.phone || selected360Complaint.customerPhone || "N/A"}
                    </p>
                    <p className="flex items-start gap-1.5 text-slate-600 pt-1">
                      <MapPin size={12} className="text-slate-400 shrink-0 mt-0.5" />
                      <span>{selected360Complaint.customerInfo?.address || "Delivery Location"}</span>
                    </p>
                  </div>
                </div>

                {/* Order Info Card */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-black text-black uppercase tracking-wider text-[11px] border-b pb-1.5 border-slate-200">
                    <ShoppingBag size={14} className="text-[#E5A00D]" /> Order Details
                  </div>
                  <div className="space-y-1 text-slate-700 font-medium">
                    <p className="font-mono font-bold text-black">Order #{selected360Complaint.orderInfo?.orderId ? selected360Complaint.orderInfo.orderId.slice(0, 8).toUpperCase() : "DISPATCH"}</p>
                    <p className="font-bold text-slate-900">{selected360Complaint.orderInfo?.itemsSummary || "Gourmet Dish Bowl"}</p>
                    <div className="flex justify-between pt-1 border-t border-slate-200 font-black text-black text-xs">
                      <span>Order Value:</span>
                      <span className="text-[#E5A00D]">₹{selected360Complaint.orderInfo?.totalAmount || "349"}</span>
                    </div>
                  </div>
                </div>

                {/* Delivery Info Card */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-black text-black uppercase tracking-wider text-[11px] border-b pb-1.5 border-slate-200">
                    <Truck size={14} className="text-[#E5A00D]" /> Delivery &amp; Kitchen Info
                  </div>
                  <div className="space-y-1 text-slate-700 font-medium">
                    <p className="font-bold text-black">{selected360Complaint.deliveryInfo?.partnerName || "Courier Rider"}</p>
                    <p className="text-slate-600 flex items-center gap-1"><Phone size={12} /> {selected360Complaint.deliveryInfo?.partnerPhone || "+91 98765 43210"}</p>
                    <p className="text-slate-600">Kitchen: {selected360Complaint.deliveryInfo?.kitchenName || "Central Hub"}</p>
                    <p className="text-[#E5A00D] font-mono font-bold pt-1">Fulfillment Duration: ~{selected360Complaint.deliveryInfo?.durationMinutes || 25} mins</p>
                  </div>
                </div>
              </div>

              {/* 2. Issue Description & Photo Proof */}
              <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-2xl space-y-2 text-xs">
                <div className="flex items-center justify-between font-black text-black uppercase text-[11px]">
                  <span>Customer Issue Statement ({selected360Complaint.category}):</span>
                  {selected360Complaint.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setViewImageModal(selected360Complaint.imageUrl)}
                      className="px-3 py-1 bg-black text-[#E5A00D] font-extrabold rounded-lg flex items-center gap-1"
                    >
                      <ImageIcon size={12} /> View Attached Photo Evidence
                    </button>
                  )}
                </div>
                <p className="text-slate-800 font-medium bg-white p-3 rounded-xl border border-amber-200 leading-relaxed">
                  &ldquo;{selected360Complaint.description}&rdquo;
                </p>
              </div>

              {/* 3. Conversation & Timeline Feed */}
              {selected360Complaint.messages && selected360Complaint.messages.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-black uppercase tracking-wider flex items-center gap-1.5 border-b pb-2 border-slate-200">
                    <MessageSquare size={14} className="text-[#E5A00D]" /> Conversation History &amp; Updates Timeline
                  </h4>

                  <div className="space-y-2.5">
                    {selected360Complaint.messages.map((msg) => {
                      const isAdmin = msg.senderType === "ADMIN";
                      return (
                        <div
                          key={msg.id}
                          className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                            isAdmin
                              ? "bg-black text-white border-black"
                              : "bg-slate-50 text-slate-900 border-slate-200"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#E5A00D]">
                              {isAdmin ? `🛡️ ${msg.senderName}` : `👤 ${msg.senderName}`}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {new Date(msg.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="font-medium leading-relaxed">{msg.message}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 4. Support Response & Workflow Controls Panel */}
              <form onSubmit={handleSave360ComplaintAction} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                <h4 className="text-xs font-black text-black uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-2">
                  <Headphones size={16} className="text-[#E5A00D]" /> Resolution &amp; Admin Support Action Panel
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Status Selector */}
                  <div className="space-y-1 text-xs">
                    <label className="font-bold text-slate-700 block">Ticket Status Workflow *:</label>
                    <select
                      value={updateStatus}
                      onChange={(e) => setUpdateStatus(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-black text-black focus:outline-none focus:border-black"
                    >
                      <option value="Open">🔴 Open (Newly Received)</option>
                      <option value="Reviewing">🔵 Reviewing (Under Investigation)</option>
                      <option value="In Progress">🟡 In Progress (Action Taken)</option>
                      <option value="Resolved">🟢 Resolved (Issue Solved)</option>
                      <option value="Closed">⚪ Closed (Case Closed)</option>
                    </select>
                  </div>

                  {/* Priority Selector */}
                  <div className="space-y-1 text-xs">
                    <label className="font-bold text-slate-700 block">Ticket Priority Level *:</label>
                    <select
                      value={updatePriority}
                      onChange={(e) => setUpdatePriority(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-black text-black focus:outline-none focus:border-black"
                    >
                      <option value="LOW">Low Priority</option>
                      <option value="MEDIUM">Medium Priority</option>
                      <option value="HIGH">High Priority</option>
                      <option value="URGENT">Urgent Priority</option>
                    </select>
                  </div>
                </div>

                {/* Predefined Template Selector */}
                <div className="space-y-1 text-xs">
                  <label className="font-bold text-slate-700 block">Predefined Support Response Templates:</label>
                  <select
                    value={supportTemplate}
                    onChange={(e) => handleTemplateSelect(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-black focus:outline-none focus:border-black"
                  >
                    <option value="">Select a quick response template...</option>
                    {PREDEFINED_TEMPLATES.map((tmpl, idx) => (
                      <option key={idx} value={tmpl}>
                        {tmpl}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Custom Response Textarea */}
                <div className="space-y-1 text-xs">
                  <label className="font-bold text-slate-700 block">Customer Response / Support Reply Message:</label>
                  <textarea
                    rows={3}
                    value={supportResponseText}
                    onChange={(e) => setSupportResponseText(e.target.value)}
                    placeholder="Write a custom response to the customer..."
                    className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-black focus:outline-none focus:border-black"
                  />
                </div>

                {/* Email Checkbox */}
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    id="sendEmailCheck"
                    checked={sendEmailCheck}
                    onChange={(e) => setSendEmailCheck(e.target.checked)}
                    className="h-4 w-4 rounded text-[#E5A00D] focus:ring-black border-slate-300"
                  />
                  <label htmlFor="sendEmailCheck" className="cursor-pointer">
                    Send email notification to customer ({selected360Complaint.customerEmail || "No Email"})
                  </label>
                </div>

                {/* Submit Action Controls */}
                <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setSelected360Complaint(null)}
                    className="px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-700"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submittingAdminAction}
                    className="px-6 py-2.5 bg-black text-[#E5A00D] font-extrabold text-xs rounded-xl flex items-center gap-2 hover:bg-neutral-800 shadow-md"
                  >
                    {submittingAdminAction ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Send size={14} />
                    )}
                    <span>Update Ticket &amp; Dispatch Response</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* PHOTO PROOF VIEWER MODAL */}
      {viewImageModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border-2 border-black w-full max-w-2xl rounded-2xl p-6 space-y-4 relative text-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-black uppercase tracking-tight flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-purple-600" /> Attached Photo Evidence
              </h3>
              <button onClick={() => setViewImageModal(null)} className="p-1 text-slate-400 hover:text-black">
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-slate-100 rounded-xl p-2 border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={viewImageModal}
                alt="Complaint Photo Proof"
                className="max-w-full max-h-[65vh] object-contain rounded-lg shadow-sm"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setViewImageModal(null)}
                className="px-5 py-2 bg-black text-white font-extrabold text-xs rounded-xl"
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
