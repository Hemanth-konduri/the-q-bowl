import "dotenv/config";
import { db } from "./index";
import { users, deliveryPartners, subscriptionDeliveries, deliveryAssignments } from "./schema";
import { eq } from "drizzle-orm";

export async function seedDeliveryPartner() {
  console.log("🚚 Provisioning Delivery Partner tables and default partner 'Ravi'...");

  // Execute DDL statements to ensure postgres tables and missing columns exist
  await db.execute(`
    CREATE TABLE IF NOT EXISTS delivery_partners (
      id text PRIMARY KEY,
      user_id text REFERENCES users(id) ON DELETE CASCADE,
      full_name text NOT NULL,
      phone text NOT NULL,
      email text,
      is_active boolean DEFAULT true NOT NULL,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL
    );

    ALTER TABLE subscription_deliveries 
      ADD COLUMN IF NOT EXISTS delivery_partner_id text REFERENCES delivery_partners(id),
      ADD COLUMN IF NOT EXISTS delivered_at timestamp,
      ADD COLUMN IF NOT EXISTS notes text;

    CREATE TABLE IF NOT EXISTS normal_order_deliveries (
      id text PRIMARY KEY,
      order_id text NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      delivery_partner_id text REFERENCES delivery_partners(id),
      status text DEFAULT 'SCHEDULED' NOT NULL,
      delivered_at timestamp,
      notes text,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS delivery_assignments (
      id text PRIMARY KEY,
      delivery_partner_id text REFERENCES delivery_partners(id) ON DELETE CASCADE,
      subscription_delivery_id text REFERENCES subscription_deliveries(id) ON DELETE CASCADE,
      order_id text REFERENCES orders(id) ON DELETE CASCADE,
      status text DEFAULT 'ASSIGNED' NOT NULL,
      assigned_at timestamp DEFAULT now() NOT NULL,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL
    );

    ALTER TABLE delivery_assignments 
      ALTER COLUMN order_id DROP NOT NULL,
      ALTER COLUMN staff_id DROP NOT NULL,
      ADD COLUMN IF NOT EXISTS delivery_partner_id text REFERENCES delivery_partners(id) ON DELETE CASCADE,
      ADD COLUMN IF NOT EXISTS subscription_delivery_id text REFERENCES subscription_deliveries(id) ON DELETE CASCADE,
      ADD COLUMN IF NOT EXISTS assigned_at timestamp DEFAULT now();
  `);

  // Find or create Delivery Partner user account
  const existingUsers = await db.select().from(users).where(eq(users.email, "ravi.delivery@qbowl.in")).limit(1);

  let userId: string;
  if (existingUsers.length > 0) {
    userId = existingUsers[0].id;
    await db.update(users).set({ role: "DELIVERY_STAFF", phone: "+918328534576" }).where(eq(users.id, userId));
  } else {
    const [newUser] = await db.insert(users).values({
      id: `usr-del-ravi-${Date.now()}`,
      name: "Ravi",
      email: "ravi.delivery@qbowl.in",
      phone: "+918328534576",
      role: "DELIVERY_STAFF",
      isActive: true,
    }).returning();
    userId = newUser.id;
  }

  // Find or create delivery_partners record
  const partnerId = "dp-ravi-83285";
  const existingPartner = await db.select().from(deliveryPartners).where(eq(deliveryPartners.id, partnerId)).limit(1);

  if (existingPartner.length === 0) {
    await db.insert(deliveryPartners).values({
      id: partnerId,
      userId,
      fullName: "Ravi Kumar",
      phone: "+918328534576",
      email: "ravi.delivery@qbowl.in",
      isActive: true,
    });
  }

  // Assign any unassigned subscription_deliveries for today to Ravi
  const todayStr = new Date().toISOString().split("T")[0];
  const unassignedSubDeliveries = await db
    .select()
    .from(subscriptionDeliveries)
    .where(eq(subscriptionDeliveries.deliveryDate, todayStr));

  for (const sdel of unassignedSubDeliveries) {
    await db
      .update(subscriptionDeliveries)
      .set({ deliveryPartnerId: partnerId })
      .where(eq(subscriptionDeliveries.id, sdel.id));

    // Ensure assignment record exists
    const existingAssign = await db
      .select()
      .from(deliveryAssignments)
      .where(eq(deliveryAssignments.subscriptionDeliveryId, sdel.id))
      .limit(1);

    if (existingAssign.length === 0) {
      await db.insert(deliveryAssignments).values({
        id: `assign-${sdel.id}`,
        deliveryPartnerId: partnerId,
        subscriptionDeliveryId: sdel.id,
        status: sdel.status === "DELIVERED" ? "DELIVERED" : "ASSIGNED",
      });
    }
  }

  console.log("✅ Delivery partner 'Ravi' (dp-ravi-83285) provisioned & deliveries assigned.");
}

if (require.main === module) {
  seedDeliveryPartner()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
