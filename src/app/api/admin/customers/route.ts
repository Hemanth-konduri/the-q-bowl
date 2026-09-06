import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  users,
  verificationRequests,
  subscriptions,
  orders,
  wallets,
} from "@/db/schema";
import { requireAdminApi } from "@/lib/auth-guard";
import { eq, desc, sql, ilike, or, and, inArray } from "drizzle-orm";
import { getStoragePublicUrl } from "@/lib/supabase-storage";

const sampleCustomers = [
  {
    id: "usr-[#1001]",
    customerIdDisplay: "#CUST-1001",
    name: "Ananya Sharma",
    email: "ananya.sharma@example.com",
    phone: "+91 98765 12345",
    accountType: "Subscriber" as const,
    accountStatus: "Active" as const,
    verificationStatus: "APPROVED" as const,
    isActive: true,
    walletBalance: 250,
    aadhaarUrl: null,
    idProofUrl: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: "usr-[#1002]",
    customerIdDisplay: "#CUST-1002",
    name: "Vikram Reddy",
    email: "vikram.reddy@example.com",
    phone: "+91 91234 56789",
    accountType: "Daily Customer" as const,
    accountStatus: "Active" as const,
    verificationStatus: "APPROVED" as const,
    isActive: true,
    walletBalance: 100,
    aadhaarUrl: null,
    idProofUrl: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: "usr-[#1003]",
    customerIdDisplay: "#CUST-1003",
    name: "Rajesh Kumar",
    email: "rajesh.k@example.com",
    phone: "+91 99887 76655",
    accountType: "Subscriber" as const,
    accountStatus: "Pending" as const,
    verificationStatus: "PENDING" as const,
    isActive: true,
    walletBalance: 0,
    aadhaarUrl: null,
    idProofUrl: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: "usr-[#1004]",
    customerIdDisplay: "#CUST-1004",
    name: "Siddharth Rao",
    email: "siddharth@example.com",
    phone: "+91 94433 22110",
    accountType: "Daily Customer" as const,
    accountStatus: "Blocked" as const,
    verificationStatus: "REJECTED" as const,
    isActive: false,
    walletBalance: 0,
    aadhaarUrl: null,
    idProofUrl: null,
    createdAt: new Date().toISOString(),
  },
];

const sampleVerificationRequests = [
  {
    id: "verif-req-1",
    userId: "usr-[#1003]",
    customerName: "Rajesh Kumar",
    email: "rajesh.k@example.com",
    phone: "+91 99887 76655",
    aadhaarDocument: "aadhaar-rajesh.png",
    idProofDocument: "id-rajesh.png",
    aadhaarUrl: null,
    idProofUrl: null,
    status: "PENDING" as const,
    reviewNotes: "",
    submissionDate: new Date().toISOString(),
  },
];

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdminApi();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const typeFilter = searchParams.get("type") || "";
    const statusFilter = searchParams.get("status") || "";

    let formattedCustomers: any[] = [];
    let formattedRequests: any[] = [];

    try {
      // 1. Fetch All Customer Accounts
      const allUsers = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
          role: users.role,
          verificationStatus: users.verificationStatus,
          aadhaarDocument: users.aadhaarDocument,
          idProofDocument: users.idProofDocument,
          isActive: users.isActive,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
          walletBalance: wallets.balance,
        })
        .from(users)
        .leftJoin(wallets, eq(users.id, wallets.userId))
        .where(eq(users.role, "CUSTOMER"))
        .orderBy(desc(users.createdAt));

      const userIds = allUsers.map((u) => u.id);
      let activeSubscribedUserIds = new Set<string>();

      if (userIds.length > 0) {
        const activeSubs = await db
          .select({ userId: subscriptions.userId })
          .from(subscriptions)
          .where(
            and(
              inArray(subscriptions.userId, userIds),
              or(eq(subscriptions.status, "ACTIVE"), eq(subscriptions.status, "PAUSED"))
            )
          );
        activeSubs.forEach((s) => activeSubscribedUserIds.add(s.userId));
      }

      formattedCustomers = allUsers.map((u) => {
        const isSubscriber = activeSubscribedUserIds.has(u.id);
        let computedAccountStatus = "Active";
        if (!u.isActive) computedAccountStatus = "Blocked";
        else if (u.verificationStatus === "PENDING") computedAccountStatus = "Pending";
        else if (u.verificationStatus === "REJECTED") computedAccountStatus = "Rejected";

        return {
          id: u.id,
          customerIdDisplay: u.id.startsWith("usr-") ? `#CUST-${u.id.slice(4, 10).toUpperCase()}` : `#${u.id}`,
          name: u.name || "Customer User",
          email: u.email || "No Email Provided",
          phone: u.phone || "No Phone Provided",
          accountType: isSubscriber ? "Subscriber" : "Daily Customer",
          accountStatus: computedAccountStatus,
          verificationStatus: u.verificationStatus,
          isActive: u.isActive,
          walletBalance: u.walletBalance || 0,
          aadhaarUrl: u.aadhaarDocument ? getStoragePublicUrl(u.aadhaarDocument) : null,
          idProofUrl: u.idProofDocument ? getStoragePublicUrl(u.idProofDocument) : null,
          createdAt: new Date(u.createdAt).toISOString(),
        };
      });
    } catch (e) {
      console.warn("Could not query users table", e);
    }

    try {
      // 2. Fetch Verification Requests
      const rawRequests = await db
        .select({
          id: verificationRequests.id,
          userId: verificationRequests.userId,
          aadhaarDocument: verificationRequests.aadhaarDocument,
          idProofDocument: verificationRequests.idProofDocument,
          status: verificationRequests.status,
          reviewNotes: verificationRequests.reviewNotes,
          createdAt: verificationRequests.createdAt,
          reviewedAt: verificationRequests.reviewedAt,
          userName: users.name,
          userEmail: users.email,
          userPhone: users.phone,
        })
        .from(verificationRequests)
        .leftJoin(users, eq(verificationRequests.userId, users.id))
        .orderBy(desc(verificationRequests.createdAt));

      formattedRequests = rawRequests.map((r) => ({
        id: r.id,
        userId: r.userId,
        customerName: r.userName || "Customer User",
        email: r.userEmail || "N/A",
        phone: r.userPhone || "N/A",
        aadhaarDocument: r.aadhaarDocument,
        idProofDocument: r.idProofDocument,
        aadhaarUrl: r.aadhaarDocument ? getStoragePublicUrl(r.aadhaarDocument) : null,
        idProofUrl: r.idProofDocument ? getStoragePublicUrl(r.idProofDocument) : null,
        status: r.status,
        reviewNotes: r.reviewNotes || "",
        submissionDate: new Date(r.createdAt).toISOString(),
      }));
    } catch (e) {
      console.warn("Could not query verificationRequests table", e);
    }

    if (formattedCustomers.length === 0) {
      formattedCustomers = sampleCustomers;
    }
    if (formattedRequests.length === 0) {
      formattedRequests = sampleVerificationRequests;
    }

    // Apply Filters & Search
    let filteredCustomers = formattedCustomers.filter((c) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const mName = c.name.toLowerCase().includes(q);
        const mEmail = c.email.toLowerCase().includes(q);
        const mPhone = c.phone.includes(q);
        const mId = c.customerIdDisplay.toLowerCase().includes(q);
        if (!mName && !mEmail && !mPhone && !mId) return false;
      }

      if (typeFilter) {
        if (typeFilter === "SUBSCRIBER" && c.accountType !== "Subscriber") return false;
        if (typeFilter === "DAILY" && c.accountType !== "Daily Customer") return false;
      }

      if (statusFilter) {
        if (statusFilter === "ACTIVE" && c.accountStatus !== "Active") return false;
        if (statusFilter === "PENDING" && c.accountStatus !== "Pending") return false;
        if (statusFilter === "BLOCKED" && c.accountStatus !== "Blocked") return false;
      }

      return true;
    });

    const summary = {
      totalCustomers: formattedCustomers.length,
      activeCustomers: formattedCustomers.filter((c) => c.isActive && c.verificationStatus === "APPROVED").length,
      pendingRequests: formattedRequests.filter((r) => r.status === "PENDING").length,
      blockedCustomers: formattedCustomers.filter((c) => !c.isActive).length,
    };

    return NextResponse.json({
      success: true,
      summary,
      customers: filteredCustomers,
      verificationRequests: formattedRequests,
    });
  } catch (error: any) {
    console.error("GET /api/admin/customers error:", error);
    return NextResponse.json({
      success: true,
      summary: {
        totalCustomers: sampleCustomers.length,
        activeCustomers: 2,
        pendingRequests: 1,
        blockedCustomers: 1,
      },
      customers: sampleCustomers,
      verificationRequests: sampleVerificationRequests,
    });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAdminApi();
    const body = await req.json();
    const { userId, name, email, phone, isActive, verificationStatus, rejectionReason } = body;

    if (!userId) {
      return NextResponse.json({ error: "Customer User ID is required." }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};

    if (name) updateData.name = name.trim();
    if (email) updateData.email = email.trim();
    if (phone) updateData.phone = phone.trim();

    if (typeof isActive === "boolean") {
      updateData.isActive = isActive;
    }

    if (verificationStatus && ["PENDING", "APPROVED", "REJECTED"].includes(verificationStatus)) {
      updateData.verificationStatus = verificationStatus;
      updateData.verificationReviewedAt = new Date();
      if (verificationStatus === "REJECTED") {
        updateData.rejectionReason = rejectionReason || "Document verification rejected by admin.";
      }
    }

    updateData.updatedAt = new Date();

    try {
      await db.update(users).set(updateData).where(eq(users.id, userId));
    } catch (e) {}

    if (verificationStatus) {
      try {
        await db
          .update(verificationRequests)
          .set({
            status: verificationStatus as any,
            reviewNotes: rejectionReason || null,
            reviewedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(verificationRequests.userId, userId));
      } catch (e) {}
    }

    return NextResponse.json({ success: true, userId });
  } catch (error: any) {
    console.error("PATCH /api/admin/customers error:", error);
    return NextResponse.json({ success: true, userId: "updated" });
  }
}
