"use client";

import { useState, useEffect, useMemo } from "react";
import { AdminSidebar } from "../components/AdminSidebar";
import { AdminNavbar } from "../components/AdminNavbar";
import {
  MessageSquare,
  Star,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Utensils,
  Award,
  Sparkles,
  Heart,
  MessageCircle,
  ThumbsUp,
  X,
  Loader2,
  ChevronRight,
  User,
  ShoppingBag,
  Send,
  Eye,
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
  comment: string;
  isResolved: boolean;
  isFeatured: boolean;
  adminReply: string | null;
  repliedAt: string | null;
  createdAt: string;
  foodItemName?: string;
  userEmail?: string;
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

export default function AdminFeedbackPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<SummaryData>({
    totalFeedback: 0,
    averageRating: "0.0",
    fiveStarCount: 0,
    negativeCount: 0,
    feedbackTodayCount: 0,
  });
  const [dishInsights, setDishInsights] = useState<DishInsight[]>([]);
  const [feedbackList, setFeedbackList] = useState<FeedbackEntry[]>([]);

  // Filters & Tabs
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [selectedDishId, setSelectedDishId] = useState<string>("ALL");
  const [ratingFilter, setRatingFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Reply Modal State
  const [replyEntry, setReplyEntry] = useState<FeedbackEntry | null>(null);
  const [replyInput, setReplyInput] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  // Inspect Modal State
  const [inspectEntry, setInspectEntry] = useState<FeedbackEntry | null>(null);

  async function fetchFeedbackData(isSilent = false) {
    if (!isSilent) setLoading(true);
    setRefreshing(true);
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
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchFeedbackData();
  }, [activeCategory, selectedDishId, ratingFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFeedbackData(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Toggle Resolved status
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

  // Submit Admin Reply
  async function handleSubmitReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyEntry || !replyInput.trim()) return;
    setSubmittingAction(true);
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
      setSubmittingAction(false);
    }
  }

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
                  Feedback &amp; Customer Reviews
                </h1>
                <p className="text-xs font-bold text-slate-500">
                  Analyze meal ratings, review dish feedback, respond to customers, and curate featured testimonials.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchFeedbackData()}
                disabled={refreshing}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-2 transition-colors"
                title="Refresh Feedback"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-[#E5A00D]" : ""}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════ */}
          {/* OVERVIEW METRIC CARDS (5 CARDS)                              */}
          {/* ════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Card 1: Total Feedback */}
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

            {/* Card 2: Average Rating */}
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

            {/* Card 3: 5 Star Reviews */}
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

            {/* Card 4: Negative Feedback */}
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

            {/* Card 5: Feedback Received Today */}
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

          {/* ════════════════════════════════════════════════════════════ */}
          {/* FOOD ITEM INSIGHTS (GROUPED BY MEAL)                        */}
          {/* ════════════════════════════════════════════════════════════ */}
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
                      <span className={`text-xs font-black line-clamp-1 ${isSelected ? "text-white" : "text-black"}`}>
                        {dish.name}
                      </span>
                      <span className="flex items-center gap-1 font-mono font-black text-xs text-[#E5A00D]">
                        <Star size={12} fill="#E5A00D" /> {dish.avgRating}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 font-medium mt-1">
                      {dish.totalReviews} customer reviews
                    </div>

                    <p className={`text-[11px] line-clamp-2 italic mt-2 ${isSelected ? "text-slate-300" : "text-slate-600"}`}>
                      &ldquo;{dish.recentReview}&rdquo;
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════ */}
          {/* CATEGORY TABS & FILTER TOOLBAR                               */}
          {/* ════════════════════════════════════════════════════════════ */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pb-2">
              {/* Category Segmented Tabs */}
              <div className="flex items-center gap-1 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 overflow-x-auto">
                {[
                  { label: "All Feedback", value: "ALL" },
                  { label: "Meal Reviews", value: "MEAL_REVIEW" },
                  { label: "Food Items", value: "FOOD_ITEM" },
                  { label: "Delivery", value: "DELIVERY" },
                  { label: "Service", value: "SERVICE" },
                  { label: "Subscriptions", value: "SUBSCRIPTION" },
                ].map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setActiveCategory(tab.value)}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                      activeCategory === tab.value
                        ? "bg-black text-[#E5A00D] shadow-sm"
                        : "text-slate-600 hover:text-black hover:bg-slate-200/60"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Toolbar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search review comment or customer..."
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-black focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <select
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-black focus:outline-none focus:border-black"
                >
                  <option value="ALL">All Ratings (1 to 5 Stars)</option>
                  <option value="5">5 Stars Only (Excellent)</option>
                  <option value="4">4 Stars Only (Good)</option>
                  <option value="3">3 Stars Only (Average)</option>
                  <option value="2">2 Stars Only (Poor)</option>
                  <option value="1">1 Star Only (Critical)</option>
                </select>
              </div>

              <div className="flex items-center justify-end text-xs font-bold text-slate-500">
                Showing {feedbackList.length} reviews
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════ */}
          {/* REVIEWS FEED LIST                                            */}
          {/* ════════════════════════════════════════════════════════════ */}
          {loading ? (
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
                  {/* Top Bar: Customer, Category, Rating & Status Badges */}
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

                    <div className="flex items-center gap-3">
                      {/* Star Rating */}
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={16}
                            fill={star <= entry.rating ? "#E5A00D" : "#E2E8F0"}
                            className={star <= entry.rating ? "text-[#E5A00D]" : "text-slate-300"}
                          />
                        ))}
                      </div>

                      {/* Category Badge */}
                      <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-full text-[10px] font-black uppercase text-slate-800">
                        {entry.category.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>

                  {/* Comment Body */}
                  <p className="text-xs text-slate-800 font-semibold leading-relaxed">
                    &ldquo;{entry.comment}&rdquo;
                  </p>

                  {/* Admin Reply Box if present */}
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

                  {/* Bottom Controls */}
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
        </main>
      </div>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* ADMIN REPLY MODAL                                            */}
      {/* ════════════════════════════════════════════════════════════ */}
      {replyEntry && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border-2 border-black w-full max-w-md rounded-2xl p-6 space-y-4 relative text-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-black uppercase tracking-tight">
                Reply to Customer Review
              </h3>
              <button onClick={() => setReplyEntry(null)} className="p-1 text-slate-400 hover:text-black">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="font-extrabold text-black block">{replyEntry.customerName}&apos;s Review:</span>
                <p className="text-slate-600 italic">&ldquo;{replyEntry.comment}&rdquo;</p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Your Response / Message *:</label>
                <textarea
                  rows={4}
                  required
                  value={replyInput}
                  onChange={(e) => setReplyInput(e.target.value)}
                  placeholder="e.g. Thank you for your feedback! We are thrilled you enjoyed the bowl."
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs font-bold text-black focus:outline-none focus:border-black"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setReplyEntry(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitReply}
                disabled={submittingAction}
                className="px-4 py-2 bg-black text-[#E5A00D] font-extrabold text-xs rounded-xl flex items-center gap-1 hover:bg-neutral-800"
              >
                {submittingAction && <Loader2 size={14} className="animate-spin" />}
                Publish Reply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
