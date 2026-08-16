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
  address: text("address").notNull(),
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
  pincode: text("pincode").unique().notNull(),
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
// SUBSCRIPTION PLANS
// -------------------------------------------------------

export const subscriptionPlans = pgTable("subscription_plans", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  totalMeals: integer("total_meals").notNull(),
  price: real("price").notNull(),
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
  mealTypes: mealTypeEnum("meal_types").array().notNull(),
  pricePaid: real("price_paid").notNull(),
  totalMeals: integer("total_meals").notNull(),
  mealsUsed: integer("meals_used").default(0).notNull(),
  mealsRemaining: integer("meals_remaining").notNull(),
  startDate: date("start_date").notNull(),
  expectedEndDate: date("expected_end_date").notNull(),
  status: subscriptionStatusEnum("status").default("ACTIVE").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

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
