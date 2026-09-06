import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  users,
  subscriptions,
  orders,
  addresses,
  foodItems,
  wallets,
  verificationRequests,
} from "@/db/schema";
import { requireAdminApi } from "@/lib/auth-guard";
import { eq, desc } from "drizzle-orm";
import { getStoragePublicUrl } from "@/lib/supabase-storage";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi();
  if (auth.error) {
    // Proceed
  }

  const { id: userId } = await context.params;

  try {
    // 1. Fetch User Base Profile
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        role: users.role,
        verificationStatus: users.verificationStatus,
        aadhaarDocument: users.aadhaarDocument,
        idProofDocument: users.idProofDocument,
        verificationSubmittedAt: users.verificationSubmittedAt,
        verificationReviewedAt: users.verificationReviewedAt,
        rejectionReason: users.rejectionReason,
        isActive: users.isActive,
        createdAt: users.createdAt,
        walletBalance: wallets.balance,
      })
      .from(users)
      .leftJoin(wallets, eq(users.id, wallets.userId))
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // 2. Fetch User Address
    const addressList = await db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, userId))
      .orderBy(desc(addresses.isDefault));

    // 3. Fetch User Orders History
    const userOrders = await db
      .select({
        id: orders.id,
        type: orders.type,
        status: orders.status,
        subtotal: orders.subtotal,
        deliveryFee: orders.deliveryFee,
        discount: orders.discount,
        total: orders.total,
        notes: orders.notes,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt))
      .limit(20);

    // 4. Fetch User Subscription History
    const userSubscriptions = await db
      .select({
        id: subscriptions.id,
        status: subscriptions.status,
        mealName: foodItems.name,
        mealsRemaining: subscriptions.mealsRemaining,
        totalMeals: subscriptions.totalMeals,
        mealsUsed: subscriptions.mealsUsed,
        mealTiming: subscriptions.mealTiming,
        startDate: subscriptions.startDate,
        expectedEndDate: subscriptions.expectedEndDate,
        pricePaid: subscriptions.pricePaid,
        createdAt: subscriptions.createdAt,
      })
      .from(subscriptions)
      .leftJoin(foodItems, eq(subscriptions.mealId, foodItems.id))
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.createdAt));

    // 5. Verification request documents
    const verif = await db
      .select()
      .from(verificationRequests)
      .where(eq(verificationRequests.userId, userId))
      .limit(1);

    const aadhaarDoc = verif[0]?.aadhaarDocument || user.aadhaarDocument;
    const idProofDoc = verif[0]?.idProofDocument || user.idProofDocument;

    return NextResponse.json({
      success: true,
      profile: {
        ...user,
        customerIdDisplay: user.id.startsWith("usr-")
          ? `#CUST-${user.id.slice(4, 10).toUpperCase()}`
          : `#${user.id}`,
        aadhaarUrl: aadhaarDoc ? getStoragePublicUrl(aadhaarDoc) : null,
        idProofUrl: idProofDoc ? getStoragePublicUrl(idProofDoc) : null,
        addresses: addressList,
        ordersHistory: userOrders,
        subscriptionHistory: userSubscriptions,
      },
    });
  } catch (error: any) {
    console.error(`GET /api/admin/customers/${userId} error:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch customer profile details" },
      { status: 500 }
    );
  }
}
