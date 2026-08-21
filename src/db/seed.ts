import "dotenv/config";
import { db } from "./index";
import {
  users,
  addresses,
  kitchenSettings,
  foodItems,
  categories,
  subscriptionPlans,
  wallets,
  walletTransactions,
  offers,
  deliveryAreas,
} from "./schema";
import { eq } from "drizzle-orm";
import postgres from "postgres";

async function runSeed() {
  console.log("🌱 Starting Q Bowl Database Migration & Seeding...");

  const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (!connectionString) {
    console.error("❌ Missing DATABASE_URL or DIRECT_URL in environment.");
    return;
  }

  const sql = postgres(connectionString);

  try {
    // 1. Ensure Columns Exist via Raw DDL
    console.log("🛠️ Applying DDL schema updates to Supabase PostgreSQL...");

    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS avatar_url text,
      ADD COLUMN IF NOT EXISTS dob date,
      ADD COLUMN IF NOT EXISTS gender text,
      ADD COLUMN IF NOT EXISTS preferred_meal_time text DEFAULT 'BOTH',
      ADD COLUMN IF NOT EXISTS dietary_preference text DEFAULT 'ANY',
      ADD COLUMN IF NOT EXISTS sms_notif boolean DEFAULT true,
      ADD COLUMN IF NOT EXISTS email_notif boolean DEFAULT true,
      ADD COLUMN IF NOT EXISTS whatsapp_notif boolean DEFAULT true,
      ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
      ADD COLUMN IF NOT EXISTS reward_points integer DEFAULT 100;
    `;

    await sql`
      ALTER TABLE addresses
      ADD COLUMN IF NOT EXISTS recipient_name text,
      ADD COLUMN IF NOT EXISTS recipient_phone text,
      ADD COLUMN IF NOT EXISTS landmark text;
    `;

    await sql`
      ALTER TABLE food_items
      ADD COLUMN IF NOT EXISTS calories integer DEFAULT 520,
      ADD COLUMN IF NOT EXISTS protein text DEFAULT '32g',
      ADD COLUMN IF NOT EXISTS rating real DEFAULT 4.9;
    `;

    await sql`
      ALTER TABLE subscription_plans
      ADD COLUMN IF NOT EXISTS meals_per_day integer DEFAULT 1,
      ADD COLUMN IF NOT EXISTS weekly_price real,
      ADD COLUMN IF NOT EXISTS monthly_price real,
      ADD COLUMN IF NOT EXISTS calories_range text DEFAULT '450 - 600 kcal',
      ADD COLUMN IF NOT EXISTS delivery_frequency text DEFAULT 'Daily Dispatch',
      ADD COLUMN IF NOT EXISTS features text[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS is_popular boolean DEFAULT false;
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS kitchen_settings (
        id text PRIMARY KEY,
        kitchen_name text NOT NULL,
        kitchen_lat real NOT NULL,
        kitchen_lng real NOT NULL,
        delivery_radius_km real DEFAULT 7.5 NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS delivery_areas (
        id text PRIMARY KEY,
        name text NOT NULL,
        kitchen_lat real NOT NULL DEFAULT 17.4399,
        kitchen_lng real NOT NULL DEFAULT 78.3847,
        radius real NOT NULL DEFAULT 7.5,
        delivery_fee real DEFAULT 0 NOT NULL,
        is_active boolean DEFAULT true NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );
    `;

    await sql`
      ALTER TABLE delivery_areas
      ALTER COLUMN pincode DROP NOT NULL;
    `;

    await sql`
      ALTER TABLE delivery_areas
      ADD COLUMN IF NOT EXISTS kitchen_lat real DEFAULT 17.4399,
      ADD COLUMN IF NOT EXISTS kitchen_lng real DEFAULT 78.3847,
      ADD COLUMN IF NOT EXISTS radius real DEFAULT 7.5,
      ADD COLUMN IF NOT EXISTS delivery_fee real DEFAULT 0,
      ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS wallet_transactions (
        id text PRIMARY KEY,
        wallet_id text NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
        type text NOT NULL,
        amount real NOT NULL,
        title text NOT NULL,
        status text DEFAULT 'Completed' NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `;

    await sql`
      ALTER TABLE subscriptions
      ADD COLUMN IF NOT EXISTS address_id text REFERENCES addresses(id),
      ADD COLUMN IF NOT EXISTS dietary_preference text DEFAULT 'VEG',
      ADD COLUMN IF NOT EXISTS spice_preference text DEFAULT 'MEDIUM',
      ADD COLUMN IF NOT EXISTS allergies text[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS exclude_ingredients text[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS delivery_days text[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS preferred_delivery_time text DEFAULT '12:00 PM - 1:00 PM',
      ADD COLUMN IF NOT EXISTS pause_rules text;
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS carts (
        id text PRIMARY KEY,
        user_id text REFERENCES users(id) ON DELETE CASCADE,
        session_key text,
        offer_id text REFERENCES offers(id),
        notes text,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS cart_items (
        id text PRIMARY KEY,
        cart_id text NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
        food_item_id text NOT NULL REFERENCES food_items(id) ON DELETE CASCADE,
        quantity integer DEFAULT 1 NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL,
        CONSTRAINT cart_item_unique UNIQUE (cart_id, food_item_id)
      );
    `;

    console.log("✅ DDL Schema updates applied successfully!");

    // 2. Seed Kitchen Settings
    console.log("📍 Seeding Kitchen Hub Settings...");
    const existingSettings = await db.select().from(kitchenSettings).limit(1);
    if (existingSettings.length === 0) {
      await db.insert(kitchenSettings).values({
        id: "kitchen-main",
        kitchenName: "Q1 Bowl Hyderabad Artisan Hub",
        kitchenLat: 17.4399,
        kitchenLng: 78.3847,
        deliveryRadiusKm: 7.5,
      });
      console.log("✅ Kitchen Settings seeded.");
    }

    // 3. Seed Subscription Plans
    console.log("📅 Seeding Subscription Plans...");
    const existingPlans = await db.select().from(subscriptionPlans);
    if (existingPlans.length === 0) {
      await db.insert(subscriptionPlans).values([
        {
          id: "plan-starter",
          name: "Starter Plan",
          description: "Ideal for individuals starting clean daily eating",
          totalMeals: 7,
          mealsPerDay: 1,
          price: 1499,
          weeklyPrice: 1499,
          monthlyPrice: 5499,
          caloriesRange: "450 – 600 kcal",
          deliveryFrequency: "5 or 6 Days / Week",
          isPopular: false,
          features: [
            "1 Freshly Prepared Chef Bowl / Day",
            "Lunch or Dinner Delivery Slot",
            "Free Doorstep Insulated Delivery",
            "Pause or Skip Days Anytime",
            "Weekly Rotating Kitchen Menu",
          ],
        },
        {
          id: "plan-balanced",
          name: "Balanced Plan",
          description: "Most popular choice with 2 meals per day",
          totalMeals: 30,
          mealsPerDay: 2,
          price: 2699,
          weeklyPrice: 2699,
          monthlyPrice: 9999,
          caloriesRange: "900 – 1,200 kcal Total",
          deliveryFrequency: "Daily Dispatch (7 Days/Wk)",
          isPopular: true,
          features: [
            "2 Complete Meals (Lunch + Dinner)",
            "Dietitian-Balanced Calorie Targets",
            "Priority 1-Hour Delivery Slots",
            "Full Pause & Address Rollover",
            "Complimentary Weekend Specialty Bowl",
            "100% Zero Delivery Surcharges",
          ],
        },
        {
          id: "plan-premium",
          name: "Premium Feast Club",
          description: "3 complete meals daily for full nutrition care",
          totalMeals: 90,
          mealsPerDay: 3,
          price: 3899,
          weeklyPrice: 3899,
          monthlyPrice: 13999,
          caloriesRange: "1,400 – 1,800 kcal Total",
          deliveryFrequency: "All 3 Meal Slots Daily",
          isPopular: false,
          features: [
            "Breakfast + Lunch + Dinner Bowls",
            "Customized Macro & Protein Split",
            "Dedicated VIP Concierge Support",
            "Unlimited Instant Pause & Resume",
            "Access to Exclusive Secret Chef Menu",
          ],
        },
      ]);
      console.log("✅ Subscription Plans seeded.");
    }

    // 4. Seed Wallets for existing users
    console.log("💳 Provisioning Wallets for Users...");
    const allUsers = await db.select().from(users);
    for (const u of allUsers) {
      const userWallets = await db.select().from(wallets).where(eq(wallets.userId, u.id)).limit(1);
      if (userWallets.length === 0) {
        const walletId = `wallet-${u.id}`;
        await db.insert(wallets).values({
          id: walletId,
          userId: u.id,
          balance: 1250,
        });

        // Add initial transactions
        await db.insert(walletTransactions).values([
          {
            id: `tx-1-${u.id}`,
            walletId,
            type: "CREDIT",
            amount: 500,
            title: "Welcome Bonus Cash",
            status: "Completed",
          },
          {
            id: `tx-2-${u.id}`,
            walletId,
            type: "CREDIT",
            amount: 750,
            title: "Subscription Rollover Refund",
            status: "Completed",
          },
        ]);
      }
    }
    console.log("✅ Wallets & Transactions provisioned.");

    // 5. Seed Coupons / Offers
    console.log("🏷️ Seeding Offers & Coupons...");
    const existingOffers = await db.select().from(offers);
    if (existingOffers.length === 0) {
      await db.insert(offers).values([
        {
          id: "offer-welcome50",
          name: "WELCOME50",
          description: "Get 50% OFF on your first artisan meal bowl order",
          discountType: "PERCENTAGE",
          discountValue: 50,
          minOrderAmount: 299,
          maxDiscount: 150,
          startDate: new Date("2025-01-01"),
          endDate: new Date("2030-12-31"),
          isActive: true,
        },
        {
          id: "offer-qbowl20",
          name: "QBOWL20",
          description: "Flat ₹100 OFF on orders above ₹499",
          discountType: "FIXED",
          discountValue: 100,
          minOrderAmount: 499,
          maxDiscount: 100,
          startDate: new Date("2025-01-01"),
          endDate: new Date("2030-12-31"),
          isActive: true,
        },
        {
          id: "offer-healthy10",
          name: "HEALTHY10",
          description: "10% OFF on organic high-protein meal bowls",
          discountType: "PERCENTAGE",
          discountValue: 10,
          minOrderAmount: 199,
          maxDiscount: 200,
          startDate: new Date("2025-01-01"),
          endDate: new Date("2030-12-31"),
          isActive: true,
        },
      ]);
      console.log("✅ Coupons & Offers seeded.");
    }

    // 6. Seed Delivery Areas
    console.log("🗺️ Seeding Delivery Areas...");
    const existingAreas = await db.select().from(deliveryAreas);
    if (existingAreas.length === 0) {
      await db.insert(deliveryAreas).values({
        id: "area-hyderabad-main",
        name: "Hitec City & Gachibowli Hub",
        kitchenLat: 17.4399,
        kitchenLng: 78.3847,
        radius: 15,
        deliveryFee: 49,
        isActive: true,
      });
      console.log("✅ Delivery Areas seeded.");
    }

    console.log("🎉 Database Migration & Seeding Complete!");
  } catch (err) {
    console.error("❌ Migration/Seeding error:", err);
  } finally {
    await sql.end();
  }
}

runSeed();
