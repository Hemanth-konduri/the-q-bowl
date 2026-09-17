import { db } from "@/db";
import {
  deliveryBatches,
  deliveryAreas,
  deliveryManifest,
  subscriptionDeliverySchedule,
  subscriptions,
  orders,
  addresses,
  foodItems,
  users,
  deliveryPartners,
} from "@/db/schema";
import { eq, and, sql, gte, lte } from "drizzle-orm";

export class BatchService {
  /**
   * Resolves the delivery batch ID for a given address ID and meal slot.
   */
  public static async resolveBatchForAddress(addressId: string, mealSlot: string = "LUNCH"): Promise<string> {
    if (!addressId) return "batch-1";

    const addrRows = await db
      .select({
        area: addresses.area,
        city: addresses.city,
        address: addresses.address,
      })
      .from(addresses)
      .where(eq(addresses.id, addressId))
      .limit(1);

    if (addrRows.length === 0) return "batch-1";

    const addr = addrRows[0];
    const searchText = `${addr.area} ${addr.city} ${addr.address}`.toLowerCase();

    // Check delivery areas mapped to batches
    const areas = await db
      .select({
        id: deliveryAreas.id,
        name: deliveryAreas.name,
        batchId: deliveryAreas.batchId,
      })
      .from(deliveryAreas)
      .where(eq(deliveryAreas.isActive, true));

    for (const a of areas) {
      if (a.batchId && searchText.includes(a.name.toLowerCase())) {
        return a.batchId;
      }
    }

    // Default heuristics based on keywords
    if (searchText.includes("gsl") || searchText.includes("medical")) {
      return "batch-2";
    }
    if (searchText.includes("aditya") || searchText.includes("surampalem")) {
      return "batch-3";
    }
    if (mealSlot === "DINNER") {
      return "batch-4";
    }

    // Fallback default batch
    return "batch-1";
  }

  /**
   * Generates full initial delivery schedule records & populates the delivery manifest
   * strictly upon payment activation.
   */
  public static async generateSubscriptionScheduleAndManifest(subRecord: any) {
    const totalCredits = subRecord.mealCreditsPurchased || subRecord.totalMeals || 20;

    // Resolve Batch for subscription address
    const resolvedBatchId = subRecord.addressId
      ? await this.resolveBatchForAddress(subRecord.addressId, subRecord.mealTiming)
      : "batch-1";

    let curr = new Date(subRecord.startDate || Date.now());
    let scheduledCount = 0;

    const scheduleRows: any[] = [];
    const manifestRows: any[] = [];

    const timings = subRecord.mealTiming || "LUNCH";
    const rawDeliveryDays: string[] = Array.isArray(subRecord.deliveryDays)
      ? subRecord.deliveryDays.map((d: string) => String(d).toUpperCase())
      : [];

    const dayNameMap: Record<number, string[]> = {
      0: ["SUN", "SUNDAY"],
      1: ["MON", "MONDAY"],
      2: ["TUE", "TUESDAY"],
      3: ["WED", "WEDNESDAY"],
      4: ["THU", "THURSDAY"],
      5: ["FRI", "FRIDAY"],
      6: ["SAT", "SATURDAY"],
    };

    let lastScheduledDateStr = curr.toISOString().split("T")[0];

    // Loop until all meal credits are scheduled into dates
    while (scheduledCount < totalCredits) {
      const dateStr = curr.toISOString().split("T")[0];
      const dayOfWeek = curr.getDay(); // 0..6
      const validNames = dayNameMap[dayOfWeek] || [];

      // Check if day is active
      const isDayActive =
        rawDeliveryDays.length === 0 ||
        rawDeliveryDays.some((d) => validNames.includes(d));

      if (isDayActive) {
        const slotsToSchedule: string[] = [];

        if (timings === "BOTH") {
          slotsToSchedule.push("LUNCH");
          if (scheduledCount + 1 < totalCredits) {
            slotsToSchedule.push("DINNER");
          }
        } else if (timings.includes(",")) {
          const parts = timings.split(",").map((s: string) => s.trim());
          for (const p of parts) {
            if (scheduledCount < totalCredits) slotsToSchedule.push(p);
          }
        } else {
          slotsToSchedule.push(timings);
        }

        for (const slot of slotsToSchedule) {
          if (scheduledCount >= totalCredits) break;

          const schedId = `sdel-${subRecord.id}-${dateStr}-${slot.toLowerCase()}`;
          const manifestId = `mnf-sub-${schedId}`;

          // Specific batch for dinner if dinner slot
          const slotBatchId = slot === "DINNER" ? "batch-4" : resolvedBatchId;

          scheduleRows.push({
            id: schedId,
            subscriptionId: subRecord.id,
            batchId: slotBatchId,
            addressId: subRecord.addressId || null,
            deliveryDate: dateStr,
            mealType: slot,
            status: "SCHEDULED",
            mealId: subRecord.mealId || null,
          });

          manifestRows.push({
            id: manifestId,
            orderType: "SUBSCRIPTION",
            referenceId: schedId,
            batchId: slotBatchId,
            customerId: subRecord.userId,
            mealId: subRecord.mealId || null,
            addressId: subRecord.addressId || null,
            deliveryDate: dateStr,
            mealSlot: slot,
            status: "SCHEDULED",
          });

          scheduledCount++;
          lastScheduledDateStr = dateStr;
        }
      }

      // Move to next calendar day
      curr.setDate(curr.getDate() + 1);
    }

    // Ensure creditsRemaining & expectedEndDate are initialized
    await db
      .update(subscriptions)
      .set({
        batchId: resolvedBatchId,
        creditsRemaining: totalCredits,
        expectedEndDate: lastScheduledDateStr,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, subRecord.id));

    if (scheduleRows.length > 0) {
      await db.insert(subscriptionDeliverySchedule).values(scheduleRows).onConflictDoNothing();
      await db.insert(deliveryManifest).values(manifestRows).onConflictDoNothing();
    }
  }

  /**
   * Synchronizes a daily order into the unified delivery_manifest table.
   */
  public static async addDailyOrderToManifest(order: any, foodItemId?: string) {
    const dateStr = new Date(order.createdAt || Date.now()).toISOString().split("T")[0];
    const resolvedBatchId = await this.resolveBatchForAddress(order.addressId, "LUNCH");

    const manifestId = `mnf-ord-${order.id}`;

    await db
      .insert(deliveryManifest)
      .values({
        id: manifestId,
        orderType: "DAILY_ORDER",
        referenceId: order.id,
        batchId: resolvedBatchId,
        customerId: order.userId,
        mealId: foodItemId || null,
        addressId: order.addressId,
        deliveryDate: dateStr,
        mealSlot: "LUNCH",
        status: order.status === "DELIVERED" ? "DELIVERED" : "SCHEDULED",
      })
      .onConflictDoNothing();
  }

  /**
   * Retrieves live kitchen prep counters & batch cards for Admin Dashboard.
   */
  public static async getKitchenPrepData(dateStr?: string) {
    const targetDate = dateStr || new Date().toISOString().split("T")[0];

    // Fetch all manifest entries for the given date
    const manifestItems = await db
      .select({
        id: deliveryManifest.id,
        orderType: deliveryManifest.orderType,
        batchId: deliveryManifest.batchId,
        mealSlot: deliveryManifest.mealSlot,
        status: deliveryManifest.status,
      })
      .from(deliveryManifest)
      .where(eq(deliveryManifest.deliveryDate, targetDate));

    let breakfastCount = 0;
    let lunchCount = 0;
    let dinnerCount = 0;
    let dailyOrdersCount = 0;

    for (const item of manifestItems) {
      if (item.orderType === "DAILY_ORDER") {
        dailyOrdersCount++;
      } else {
        if (item.mealSlot === "BREAKFAST") breakfastCount++;
        else if (item.mealSlot === "DINNER") dinnerCount++;
        else lunchCount++;
      }
    }

    // Fetch active batches with partner info
    const batches = await db
      .select({
        id: deliveryBatches.id,
        name: deliveryBatches.name,
        mealSlot: deliveryBatches.mealSlot,
        deliveryTime: deliveryBatches.deliveryTime,
        status: deliveryBatches.status,
        assignedPartnerId: deliveryBatches.assignedPartnerId,
        partnerName: deliveryPartners.fullName,
        partnerPhone: deliveryPartners.phone,
      })
      .from(deliveryBatches)
      .leftJoin(deliveryPartners, eq(deliveryBatches.assignedPartnerId, deliveryPartners.id))
      .where(eq(deliveryBatches.isActive, true));

    // Calculate per-batch counts
    const batchCards = batches.map((b) => {
      const bItems = manifestItems.filter((i) => i.batchId === b.id);
      const subCount = bItems.filter((i) => i.orderType === "SUBSCRIPTION").length;
      const dailyCount = bItems.filter((i) => i.orderType === "DAILY_ORDER").length;

      return {
        ...b,
        totalMeals: bItems.length,
        subscriptionCount: subCount,
        dailyOrderCount: dailyCount,
      };
    });

    return {
      date: targetDate,
      prepCounts: {
        breakfast: breakfastCount,
        lunch: lunchCount,
        dinner: dinnerCount,
        dailyOrders: dailyOrdersCount,
        total: manifestItems.length,
      },
      batches: batchCards,
    };
  }

  /**
   * Marks a manifest item as DELIVERED, sets deliveredAt, and decrements subscription credits by 1.
   */
  public static async markDeliveryCompleted(manifestId: string, deliveryPartnerId?: string) {
    const manifestRows = await db
      .select()
      .from(deliveryManifest)
      .where(eq(deliveryManifest.id, manifestId))
      .limit(1);

    if (manifestRows.length === 0) {
      throw new Error(`Manifest record ${manifestId} not found`);
    }

    const item = manifestRows[0];
    const now = new Date();

    // 1. Update manifest status
    await db
      .update(deliveryManifest)
      .set({
        status: "DELIVERED",
        deliveredAt: now,
        deliveryPartnerId: deliveryPartnerId || item.deliveryPartnerId,
        updatedAt: now,
      })
      .where(eq(deliveryManifest.id, manifestId));

    // 2. If Subscription, update subscription_delivery_schedule & decrement creditsRemaining
    if (item.orderType === "SUBSCRIPTION") {
      await db
        .update(subscriptionDeliverySchedule)
        .set({
          status: "DELIVERED",
          deliveredAt: now,
          deliveryPartnerId: deliveryPartnerId || item.deliveryPartnerId,
          updatedAt: now,
        })
        .where(eq(subscriptionDeliverySchedule.id, item.referenceId));

      // Find subscription row
      const schedRows = await db
        .select({ subscriptionId: subscriptionDeliverySchedule.subscriptionId })
        .from(subscriptionDeliverySchedule)
        .where(eq(subscriptionDeliverySchedule.id, item.referenceId))
        .limit(1);

      if (schedRows.length > 0) {
        const subId = schedRows[0].subscriptionId;
        const subRows = await db
          .select({
            creditsRemaining: subscriptions.creditsRemaining,
            mealsRemaining: subscriptions.mealsRemaining,
            mealsUsed: subscriptions.mealsUsed,
          })
          .from(subscriptions)
          .where(eq(subscriptions.id, subId))
          .limit(1);

        if (subRows.length > 0) {
          const s = subRows[0];
          const currCredits = s.creditsRemaining ?? s.mealsRemaining ?? 0;
          const newCredits = Math.max(0, currCredits - 1);
          const newUsed = (s.mealsUsed || 0) + 1;

          await db
            .update(subscriptions)
            .set({
              creditsRemaining: newCredits,
              mealsRemaining: newCredits,
              mealsUsed: newUsed,
              status: newCredits === 0 ? "COMPLETED" : "ACTIVE",
              updatedAt: now,
            })
            .where(eq(subscriptions.id, subId));
        }
      }
    } else if (item.orderType === "DAILY_ORDER") {
      await db
        .update(orders)
        .set({
          status: "DELIVERED",
          updatedAt: now,
        })
        .where(eq(orders.id, item.referenceId));
    }

    return { success: true, manifestId, status: "DELIVERED" };
  }
}
