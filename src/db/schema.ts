import {
  pgTable,
  pgEnum,
  text,
  boolean,
  real,
  integer,
  timestamp,
  date,
  unique,
} from "drizzle-orm/pg-core";

// -------------------------------------------------------
// ENUMS
// -------------------------------------------------------

export const roleEnum = pgEnum("role", ["CUSTOMER", "ADMIN", "DELIVERY_STAFF"]);

export const mealTypeEnum = pgEnum("meal_type", [
  "BREAKFAST",
  "LUNCH",
  "DINNER",
  "SNACK",
  "OTHER",
]);

export const orderTypeEnum = pgEnum("order_type", ["NORMAL", "SUBSCRIPTION"]);

export const orderStatusEnum = pgEnum("order_status", [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "FAILED",
]);

export const deliveryStatusEnum = pgEnum("delivery_status", [
  "ASSIGNED",
  "PICKED_UP",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "FAILED",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "ACTIVE",
  "PAUSED",
  "COMPLETED",
  "CANCELLED",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "PENDING",
  "SUCCESS",
  "FAILED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "UPI",
  "CREDIT_CARD",
  "DEBIT_CARD",
  "NET_BANKING",
  "WALLET",
  "CASH_ON_DELIVERY",
]);

export const discountTypeEnum = pgEnum("discount_type", [
  "PERCENTAGE",
  "FIXED",
]);

// -------------------------------------------------------
// USERS & ADDRESSES
// -------------------------------------------------------

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").unique(),
  phone: text("phone").unique(),
  passwordHash: text("password_hash"),
  googleId: text("google_id").unique(),
  avatarUrl: text("avatar_url"),
  dob: date("dob"),
  gender: text("gender"),
  preferredMealTime: text("preferred_meal_time").default("BOTH"),
  dietaryPreference: text("dietary_preference").default("ANY"),
  smsNotif: boolean("sms_notif").default(true).notNull(),
  emailNotif: boolean("email_notif").default(true).notNull(),
  whatsappNotif: boolean("whatsapp_notif").default(true).notNull(),
  referralCode: text("referral_code").unique(),
  rewardPoints: integer("reward_points").default(100).notNull(),
  role: roleEnum("role").default("CUSTOMER").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const addresses = pgTable("addresses", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  recipientName: text("recipient_name"),
  recipientPhone: text("recipient_phone"),
  address: text("address").notNull(),
  landmark: text("landmark"),
  area: text("area").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  pincode: text("pincode").notNull(),
  latitude: real("latitude"),
  longitude: real("longitude"),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// -------------------------------------------------------
// DELIVERY AREAS
// -------------------------------------------------------

export const deliveryAreas = pgTable("delivery_areas", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  kitchenLat: real("kitchen_lat").notNull(),
  kitchenLng: real("kitchen_lng").notNull(),
  radius: real("radius").notNull(),
  deliveryFee: real("delivery_fee").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// -------------------------------------------------------
// FOOD CATALOG
// -------------------------------------------------------

export const categories = pgTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").unique().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const foodItems = pgTable("food_items", {
  id: text("id").primaryKey(),
  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  price: real("price").notNull(),
  calories: integer("calories").default(520).notNull(),
  protein: text("protein").default("32g").notNull(),
  rating: real("rating").default(4.9).notNull(),
  isVeg: boolean("is_veg").default(true).notNull(),
  mealType: mealTypeEnum("meal_type").notNull(),
  isAvailable: boolean("is_available").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// -------------------------------------------------------
// DAILY MENU
// -------------------------------------------------------

export const menus = pgTable("menus", {
  id: text("id").primaryKey(),
  date: date("date").unique().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const menuItems = pgTable(
  "menu_items",
  {
    id: text("id").primaryKey(),
    menuId: text("menu_id")
      .notNull()
      .references(() => menus.id, { onDelete: "cascade" }),
    foodItemId: text("food_item_id")
      .notNull()
      .references(() => foodItems.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [unique().on(t.menuId, t.foodItemId)]
);

// -------------------------------------------------------
// KITCHEN SETTINGS
// -------------------------------------------------------

export const kitchenSettings = pgTable("kitchen_settings", {
  id: text("id").primaryKey(),
  kitchenName: text("kitchen_name").notNull(),
  kitchenLat: real("kitchen_lat").notNull(),
  kitchenLng: real("kitchen_lng").notNull(),
  deliveryRadiusKm: real("delivery_radius_km").default(7.5).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// -------------------------------------------------------
// WALLETS & REWARDS
// -------------------------------------------------------

export const wallets = pgTable("wallets", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  balance: real("balance").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const walletTransactions = pgTable("wallet_transactions", {
  id: text("id").primaryKey(),
  walletId: text("wallet_id")
    .notNull()
    .references(() => wallets.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // CREDIT | DEBIT
  amount: real("amount").notNull(),
  title: text("title").notNull(),
  status: text("status").default("Completed").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// -------------------------------------------------------
// SUBSCRIPTION PLANS
// -------------------------------------------------------

export const subscriptionPlans = pgTable("subscription_plans", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  totalMeals: integer("total_meals").notNull(),
  mealsPerDay: integer("meals_per_day").default(1).notNull(),
  price: real("price").notNull(),
  weeklyPrice: real("weekly_price"),
  monthlyPrice: real("monthly_price"),
  caloriesRange: text("calories_range").default("450 - 600 kcal"),
  deliveryFrequency: text("delivery_frequency").default("Daily Dispatch"),
  features: text("features").array().default([]).notNull(),
  isPopular: boolean("is_popular").default(false).notNull(),
  mealTypes: mealTypeEnum("meal_types").array().default([]).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// -------------------------------------------------------
// SUBSCRIPTIONS
// -------------------------------------------------------

export const subscriptions = pgTable("subscriptions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  planId: text("plan_id")
    .notNull()
    .references(() => subscriptionPlans.id),
  addressId: text("address_id").references(() => addresses.id),
  mealTypes: mealTypeEnum("meal_types").array().notNull(),
  pricePaid: real("price_paid").notNull(),
  totalMeals: integer("total_meals").notNull(),
  mealsUsed: integer("meals_used").default(0).notNull(),
  mealsRemaining: integer("meals_remaining").notNull(),
  startDate: date("start_date").notNull(),
  expectedEndDate: date("expected_end_date").notNull(),
  dietaryPreference: text("dietary_preference").default("VEG").notNull(),
  spicePreference: text("spice_preference").default("MEDIUM").notNull(),
  allergies: text("allergies").array().default([]).notNull(),
  excludeIngredients: text("exclude_ingredients").array().default([]).notNull(),
  deliveryDays: text("delivery_days").array().default([]).notNull(),
  preferredDeliveryTime: text("preferred_delivery_time").default("12:00 PM - 1:00 PM").notNull(),
  pauseRules: text("pause_rules"),
  status: subscriptionStatusEnum("status").default("ACTIVE").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// -------------------------------------------------------
// CARTS & CART ITEMS
// -------------------------------------------------------

export const carts = pgTable("carts", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  sessionKey: text("session_key"),
  offerId: text("offer_id").references(() => offers.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const cartItems = pgTable(
  "cart_items",
  {
    id: text("id").primaryKey(),
    cartId: text("cart_id")
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),
    foodItemId: text("food_item_id")
      .notNull()
      .references(() => foodItems.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(1),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [unique().on(t.cartId, t.foodItemId)]
);

// -------------------------------------------------------
// SUBSCRIPTION DAYS
// -------------------------------------------------------

export const subscriptionDays = pgTable(
  "subscription_days",
  {
    id: text("id").primaryKey(),
    subscriptionId: text("subscription_id")
      .notNull()
      .references(() => subscriptions.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    isSkipped: boolean("is_skipped").default(false).notNull(),
    isConsumed: boolean("is_consumed").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [unique().on(t.subscriptionId, t.date)]
);

export const subscriptionDayItems = pgTable("subscription_day_items", {
  id: text("id").primaryKey(),
  subscriptionDayId: text("subscription_day_id")
    .notNull()
    .references(() => subscriptionDays.id, { onDelete: "cascade" }),
  foodItemId: text("food_item_id")
    .notNull()
    .references(() => foodItems.id),
  mealType: mealTypeEnum("meal_type").notNull(),
  isSkipped: boolean("is_skipped").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// -------------------------------------------------------
// OFFERS
// -------------------------------------------------------

export const offers = pgTable("offers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  discountType: discountTypeEnum("discount_type").notNull(),
  discountValue: real("discount_value").notNull(),
  minOrderAmount: real("min_order_amount"),
  maxDiscount: real("max_discount"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// -------------------------------------------------------
// ORDERS
// -------------------------------------------------------

export const orders = pgTable("orders", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  addressId: text("address_id")
    .notNull()
    .references(() => addresses.id),
  subscriptionDayId: text("subscription_day_id").references(
    () => subscriptionDays.id
  ),
  offerId: text("offer_id").references(() => offers.id),
  type: orderTypeEnum("type").notNull(),
  status: orderStatusEnum("status").default("PENDING").notNull(),
  subtotal: real("subtotal").notNull(),
  deliveryFee: real("delivery_fee").default(0).notNull(),
  discount: real("discount").default(0).notNull(),
  total: real("total").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const orderItems = pgTable("order_items", {
  id: text("id").primaryKey(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  foodItemId: text("food_item_id").notNull(),
  name: text("name").notNull(),
  unitPrice: real("unit_price").notNull(),
  quantity: integer("quantity").notNull(),
  totalPrice: real("total_price").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// -------------------------------------------------------
// PAYMENTS
// -------------------------------------------------------

export const payments = pgTable("payments", {
  id: text("id").primaryKey(),
  orderId: text("order_id").references(() => orders.id),
  subscriptionId: text("subscription_id").references(() => subscriptions.id),
  amount: real("amount").notNull(),
  method: paymentMethodEnum("method").notNull(),
  transactionId: text("transaction_id").unique(),
  status: paymentStatusEnum("status").default("PENDING").notNull(),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// -------------------------------------------------------
// DELIVERY ASSIGNMENTS
// -------------------------------------------------------

export const deliveryAssignments = pgTable("delivery_assignments", {
  id: text("id").primaryKey(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id),
  staffId: text("staff_id")
    .notNull()
    .references(() => users.id),
  status: deliveryStatusEnum("status").default("ASSIGNED").notNull(),
  scheduledAt: timestamp("scheduled_at"),
  pickedUpAt: timestamp("picked_up_at"),
  deliveredAt: timestamp("delivered_at"),
  failureReason: text("failure_reason"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// -------------------------------------------------------
// EMAIL OTP
// -------------------------------------------------------

export const emailOtps = pgTable("email_otps", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  otp: text("otp").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// -------------------------------------------------------
// NOTIFICATIONS
// -------------------------------------------------------

export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  body: text("body").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
