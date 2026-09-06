import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  subscriptions,
  users,
  foodItems,
  addresses,
  subscriptionDeliveries,
} from "@/db/schema";
import { requireAdminApi } from "@/lib/auth-guard";
import { desc, eq, or } from "drizzle-orm";

export async function GET() {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const list = await db
      .select({
        id: subscriptions.id,
        userId: subscriptions.userId,
        userName: users.name,
        userEmail: users.email,
        userPhone: users.phone,
        mealName: foodItems.name,
        mealsRemaining: subscriptions.mealsRemaining,
        totalMeals: subscriptions.totalMeals,
        mealsUsed: subscriptions.mealsUsed,
        mealsPerDay: subscriptions.mealsPerDay,
        mealTiming: subscriptions.mealTiming,
        dietaryPreference: subscriptions.dietaryPreference,
        pricePaid: subscriptions.pricePaid,
        startDate: subscriptions.startDate,
        expectedEndDate: subscriptions.expectedEndDate,
        status: subscriptions.status,
        createdAt: subscriptions.createdAt,
        deliveryAddress: addresses.address,
      })
      .from(subscriptions)
      .leftJoin(users, eq(subscriptions.userId, users.id))
      .leftJoin(foodItems, eq(subscriptions.mealId, foodItems.id))
      .leftJoin(addresses, eq(subscriptions.addressId, addresses.id))
      .orderBy(desc(subscriptions.createdAt));

    return NextResponse.json(list);
  } catch (error) {
    console.error("Error fetching admin subscriptions list:", error);
    return NextResponse.json({ error: "Failed to fetch subscriptions." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const {
      fullName,
      phone,
      email,
      deliveryAddress,
      mealId,
      planName,
      startDate = new Date().toISOString().split("T")[0],
      totalMeals = 30,
      completedMeals = 0,
      mealTiming = "LUNCH",
      status = "ACTIVE",
      pricePaid = 0,
    } = body;

    if (!fullName || !phone || !deliveryAddress) {
      return NextResponse.json(
        { error: "Customer full name, phone number, and delivery address are required." },
        { status: 400 }
      );
    }

    const cleanPhone = phone.trim();
    const cleanEmail = email ? email.trim() : null;

    // 1. Find or create User record
    let targetUserId = "";
    const userConditions = [eq(users.phone, cleanPhone)];
    if (cleanEmail) userConditions.push(eq(users.email, cleanEmail));

    const existingUsers = await db
      .select()
      .from(users)
      .where(or(...userConditions))
      .limit(1);

    if (existingUsers.length > 0) {
      targetUserId = existingUsers[0].id;
    } else {
      targetUserId = `usr-off-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      await db.insert(users).values({
        id: targetUserId,
        name: fullName,
        phone: cleanPhone,
        email: cleanEmail,
        role: "CUSTOMER",
        verificationStatus: "APPROVED",
        emailVerified: true,
        rewardPoints: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // 2. Find or create Address record
    let targetAddressId = "";
    const existingAddresses = await db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, targetUserId))
      .limit(1);

    if (existingAddresses.length > 0) {
      targetAddressId = existingAddresses[0].id;
    } else {
      targetAddressId = `addr-off-${Date.now()}`;
      await db.insert(addresses).values({
        id: targetAddressId,
        userId: targetUserId,
        label: "Home",
        recipientName: fullName,
        recipientPhone: cleanPhone,
        address: deliveryAddress,
        area: "Central Zone",
        city: "Rajahmundry",
        state: "Andhra Pradesh",
        pincode: "533101",
        latitude: 17.0005,
        longitude: 81.7800,
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // 3. Find or link food item
    let targetMealId: string | null = mealId || null;
    if (!targetMealId) {
      const firstFood = await db.select().from(foodItems).limit(1);
      if (firstFood.length > 0) {
        targetMealId = firstFood[0].id;
      }
    }

    // 4. Calculate Pending / Remaining Meals & End Date
    const totMeals = Math.max(1, Number(totalMeals) || 30);
    const compMeals = Math.max(0, Number(completedMeals) || 0);
    const pendingMeals = Math.max(0, totMeals - compMeals);

    const timingUpper = (mealTiming || "LUNCH").toUpperCase();
    const mealsPerDay = timingUpper === "BOTH" ? 2 : 1;
    const daysRemaining = Math.ceil(pendingMeals / mealsPerDay);

    const startObj = new Date(startDate);
    const expectedEndObj = new Date(startObj.getTime() + daysRemaining * 24 * 60 * 60 * 1000);
    const expectedEndDateStr = expectedEndObj.toISOString().split("T")[0];

    const newSubId = `sub-off-${Date.now()}`;
    await db.insert(subscriptions).values({
      id: newSubId,
      userId: targetUserId,
      mealId: targetMealId,
      addressId: targetAddressId,
      mealCreditsPurchased: totMeals,
      totalMeals: totMeals,
      mealsUsed: compMeals,
      mealsRemaining: pendingMeals,
      mealsPerDay: mealsPerDay,
      mealTiming: timingUpper,
      pricePaid: Number(pricePaid) || 0,
      totalAmount: Number(pricePaid) || 0,
      startDate: startDate,
      expectedEndDate: expectedEndDateStr,
      status: status as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 5. Schedule Today's Delivery if Active
    if (status === "ACTIVE" && pendingMeals > 0) {
      try {
        const todayStr = new Date().toISOString().split("T")[0];
        await db.insert(subscriptionDeliveries).values({
          id: `del-off-${Date.now()}`,
          subscriptionId: newSubId,
          deliveryDate: todayStr,
          mealType: timingUpper === "BOTH" ? "LUNCH" : timingUpper,
          status: "MAKING",
          mealId: targetMealId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } catch (e) {
        console.warn("Delivery insertion warning:", e);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Offline subscriber onboarded successfully",
      subscriptionId: newSubId,
      userId: targetUserId,
      pendingMeals,
    });
  } catch (error: any) {
    console.error("POST /api/admin/subscriptions/list error:", error);
    return NextResponse.json({ error: error.message || "Failed to create subscriber." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const { subscriptionId, status, addCredits, completedMeals } = await req.json();

    if (!subscriptionId) {
      return NextResponse.json({ error: "Subscription ID is required." }, { status: 400 });
    }

    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, subscriptionId))
      .limit(1);

    if (!sub) {
      return NextResponse.json({ error: "Subscription not found." }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    if (status && ["ACTIVE", "PAUSED", "COMPLETED", "CANCELLED"].includes(status)) {
      updateData.status = status;
    }

    if (typeof completedMeals === "number") {
      const newComp = Math.max(0, completedMeals);
      updateData.mealsUsed = newComp;
      updateData.mealsRemaining = Math.max(0, sub.totalMeals - newComp);
    }

    if (typeof addCredits === "number" && addCredits !== 0) {
      const newRem = Math.max(0, sub.mealsRemaining + addCredits);
      const newTot = Math.max(0, sub.totalMeals + addCredits);
      updateData.mealsRemaining = newRem;
      updateData.totalMeals = newTot;
    }

    updateData.updatedAt = new Date();

    await db.update(subscriptions).set(updateData).where(eq(subscriptions.id, subscriptionId));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating subscription:", error);
    return NextResponse.json({ error: "Failed to update subscription." }, { status: 500 });
  }
}
