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
  AnyPgColumn,
} from "drizzle-orm/pg-core";

// -------------------------------------------------------
// ENUMS
// -------------------------------------------------------

export const roleEnum = pgEnum("role", ["CUSTOMER", "ADMIN", "DELIVERY_STAFF"]);

export const verificationStatusEnum = pgEnum("verification_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
]);

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
  username: text("username").unique(),
  phone: text("phone").unique(),
  passwordHash: text("password_hash"),
  googleId: text("google_id").unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  verificationStatus: verificationStatusEnum("verification_status").default("PENDING").notNull(),
  aadhaarDocument: text("aadhaar_document"),
  idProofDocument: text("id_proof_document"),
  verificationSubmittedAt: timestamp("verification_submitted_at"),
  verificationReviewedAt: timestamp("verification_reviewed_at"),
  rejectionReason: text("rejection_reason"),
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
  deliveryCharge: real("delivery_charge").default(0),
  calories: integer("calories").default(520).notNull(),
  protein: text("protein").default("32g").notNull(),
  rating: real("rating").default(4.9).notNull(),
  isVeg: boolean("is_veg").default(true).notNull(),
  mealType: mealTypeEnum("meal_type").default("LUNCH").notNull(),
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
// SUBSCRIPTION MEAL PRICING
// -------------------------------------------------------

export const subscriptionMealPricing = pgTable("subscription_meal_pricing", {
  id: text("id").primaryKey(),
  mealId: text("meal_id")
    .notNull()
    .references(() => foodItems.id, { onDelete: "cascade" }),
  pricePerMeal: real("price_per_meal").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// -------------------------------------------------------
// SUBSCRIPTION PACKAGES
// -------------------------------------------------------

export const subscriptionPackages = pgTable("subscription_packages", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  mealCredits: integer("meal_credits").notNull(),
  discount: real("discount").default(0).notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// -------------------------------------------------------
// SUBSCRIPTION PLANS (Legacy Support)
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
// SUBSCRIPTIONS (MEAL CREDIT DRIVEN)
// -------------------------------------------------------

export const subscriptions = pgTable("subscriptions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  mealId: text("meal_id").references(() => foodItems.id),
  packageId: text("package_id").references(() => subscriptionPackages.id),
  planId: text("plan_id").references(() => subscriptionPlans.id),
  paymentId: text("payment_id").references((): AnyPgColumn => payments.id).unique(),
  addressId: text("address_id").references(() => addresses.id),
  mealCreditsPurchased: integer("meal_credits_purchased").notNull().default(0),
  mealsRemaining: integer("meals_remaining").notNull(),
  totalMeals: integer("total_meals").notNull().default(0),
  mealsUsed: integer("meals_used").default(0).notNull(),
  mealsPerDay: integer("meals_per_day").default(1).notNull(),
  mealTiming: text("meal_timing").default("LUNCH").notNull(), // 'LUNCH', 'DINNER', 'BOTH'
  mealTypes: mealTypeEnum("meal_types").array().default([]).notNull(),
  pricePerMeal: real("price_per_meal").default(0).notNull(),
  discount: real("discount").default(0).notNull(),
  totalAmount: real("total_amount").default(0).notNull(),
  pricePaid: real("price_paid").default(0).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  expectedEndDate: date("expected_end_date").notNull(),
  nextDeliveryDate: date("next_delivery_date"),
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
// DELIVERY PARTNERS & ASSIGNMENTS
// -------------------------------------------------------

export const deliveryPartners = pgTable("delivery_partners", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  currentLat: real("current_lat"),
  currentLng: real("current_lng"),
  lastLocationAt: timestamp("last_location_at"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const subscriptionDeliveries = pgTable("subscription_deliveries", {
  id: text("id").primaryKey(),
  subscriptionId: text("subscription_id")
    .notNull()
    .references(() => subscriptions.id, { onDelete: "cascade" }),
  deliveryPartnerId: text("delivery_partner_id").references(() => deliveryPartners.id),
  deliveryDate: date("delivery_date").notNull(),
  mealType: text("meal_type").notNull(), // 'LUNCH', 'DINNER', 'BREAKFAST'
  status: text("status").default("SCHEDULED").notNull(), // 'SCHEDULED', 'DELIVERED', 'CANCELLED', 'SKIPPED'
  mealId: text("meal_id").references(() => foodItems.id),
  deliveredAt: timestamp("delivered_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const normalOrderDeliveries = pgTable("normal_order_deliveries", {
  id: text("id").primaryKey(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  deliveryPartnerId: text("delivery_partner_id").references(() => deliveryPartners.id),
  status: text("status").default("SCHEDULED").notNull(),
  deliveredAt: timestamp("delivered_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const deliveryAssignments = pgTable("delivery_assignments", {
  id: text("id").primaryKey(),
  deliveryPartnerId: text("delivery_partner_id").references(() => deliveryPartners.id, { onDelete: "cascade" }),
  subscriptionDeliveryId: text("subscription_delivery_id").references(() => subscriptionDeliveries.id, { onDelete: "cascade" }),
  orderId: text("order_id").references(() => orders.id, { onDelete: "cascade" }),
  staffId: text("staff_id").references(() => users.id),
  status: text("status").default("ASSIGNED").notNull(),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  scheduledAt: timestamp("scheduled_at"),
  pickedUpAt: timestamp("picked_up_at"),
  deliveredAt: timestamp("delivered_at"),
  failureReason: text("failure_reason"),
  notes: text("notes"),
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
  code: text("code").unique(),
  name: text("name").notNull(),
  description: text("description"),
  discountType: discountTypeEnum("discount_type").notNull(),
  discountValue: real("discount_value").notNull(),
  minOrderAmount: real("min_order_amount"),
  maxDiscount: real("max_discount"),
  startDate: timestamp("start_date").defaultNow().notNull(),
  endDate: timestamp("end_date"),
  usageLimit: integer("usage_limit"),
  usageCount: integer("usage_count").default(0).notNull(),
  perUserLimit: integer("per_user_limit").default(1).notNull(),
  campaignType: text("campaign_type").default("COUPON").notNull(), // 'COUPON' | 'FIRST_ORDER' | 'FESTIVAL' | 'SUBSCRIPTION' | 'MEAL_SPECIFIC' | 'BUY_X_GET_Y'
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
// PAYMENTS & PAYMENT EVENTS
// -------------------------------------------------------

export const payments = pgTable("payments", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  orderId: text("order_id").references(() => orders.id),
  subscriptionId: text("subscription_id").references(() => subscriptions.id),
  razorpayOrderId: text("razorpay_order_id"),
  razorpayPaymentId: text("razorpay_payment_id"),
  razorpaySignature: text("razorpay_signature"),
  amount: real("amount").notNull(),
  currency: text("currency").default("INR").notNull(),
  method: paymentMethodEnum("method").notNull(),
  purpose: text("purpose").default("ORDER").notNull(), // 'ORDER' | 'SUBSCRIPTION' | 'WALLET'
  receipt: text("receipt"),
  transactionId: text("transaction_id").unique(),
  status: paymentStatusEnum("status").default("PENDING").notNull(),
  refundAmount: real("refund_amount").default(0),
  refundReason: text("refund_reason"),
  refundRefId: text("refund_ref_id"),
  refundedAt: timestamp("refunded_at"),
  notes: text("notes"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const paymentEvents = pgTable("payment_events", {
  id: text("id").primaryKey(),
  eventId: text("event_id").unique().notNull(),
  eventType: text("event_type").notNull(),
  payload: text("payload"),
  processed: boolean("processed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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

export const verificationRequests = pgTable("verification_requests", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  aadhaarDocument: text("aadhaar_document").notNull(),
  idProofDocument: text("id_proof_document").notNull(),
  status: verificationStatusEnum("status").default("PENDING").notNull(),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
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

// -------------------------------------------------------
// SUBSCRIPTION DRAFTS (PERSISTENT & RESUMABLE FLOW)
// -------------------------------------------------------

export const subscriptionDrafts = pgTable("subscription_drafts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  currentStep: integer("current_step").default(1).notNull(),
  mealId: text("meal_id").references(() => foodItems.id),
  packageId: text("package_id").references(() => subscriptionPackages.id),
  isCustomCredits: boolean("is_custom_credits").default(false).notNull(),
  customCredits: integer("custom_credits"),
  mealCredits: integer("meal_credits").default(10).notNull(),
  mealsPerDay: integer("meals_per_day").default(1).notNull(),
  mealTiming: text("meal_timing").default("LUNCH").notNull(),
  startDate: date("start_date"),
  deliveryDays: text("delivery_days").array().default([]).notNull(),
  preferredTime: text("preferred_time"),
  addressId: text("address_id").references(() => addresses.id),
  latitude: real("latitude"),
  longitude: real("longitude"),
  subtotal: real("subtotal").default(0).notNull(),
  discount: real("discount").default(0).notNull(),
  totalAmount: real("total_amount").default(0).notNull(),
  status: text("status").default("DRAFT").notNull(), // 'DRAFT' | 'COMPLETED' | 'EXPIRED'
  lastSavedAt: timestamp("last_saved_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(), // 24-hour expiration window
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// -------------------------------------------------------
// APPLICATION & RESTAURANT SETTINGS
// -------------------------------------------------------

export const appSettings = pgTable("app_settings", {
  id: text("id").primaryKey(),
  kitchenName: text("kitchen_name").default("Q1 Bowl - Artisan Cloud Kitchen").notNull(),
  phone: text("phone").default("+91 98765 43210"),
  email: text("email").default("admin@q1bowl.com"),
  address: text("address").default("Gachibowli, Hyderabad, Telangana 500032"),
  gstNumber: text("gst_number").default("36AAAAA0000A1Z5"),
  logoUrl: text("logo_url").default("/the_q_bowl_logo.png"),
  openingTime: text("opening_time").default("07:00 AM"),
  closingTime: text("closing_time").default("10:30 PM"),
  autoAcceptOrders: boolean("auto_accept_orders").default(true).notNull(),
  sameDayOrdering: boolean("same_day_ordering").default(true).notNull(),
  deliveryRadiusKm: real("delivery_radius_km").default(7.5).notNull(),
  enable2fa: boolean("enable_2fa").default(false).notNull(),
  emailNotifications: boolean("email_notifications").default(true).notNull(),
  newOrderAlerts: boolean("new_order_alerts").default(true).notNull(),
  newSubscriptionAlerts: boolean("new_subscription_alerts").default(true).notNull(),
  paymentAlerts: boolean("payment_alerts").default(true).notNull(),
  timeZone: text("time_zone").default("Asia/Kolkata (GMT+5:30)"),
  currency: text("currency").default("INR (₹)"),
  dateFormat: text("date_format").default("DD/MM/YYYY"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// -------------------------------------------------------
// CUSTOMER FEEDBACK & REVIEWS
// -------------------------------------------------------

export const customerFeedback = pgTable("customer_feedback", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  orderId: text("order_id").references(() => orders.id),
  subscriptionId: text("subscription_id").references(() => subscriptions.id),
  foodItemId: text("food_item_id").references(() => foodItems.id),
  customerName: text("customer_name").notNull(),
  category: text("category").default("MEAL_REVIEW").notNull(), // 'MEAL_REVIEW' | 'FOOD_ITEM' | 'DELIVERY' | 'SERVICE' | 'SUBSCRIPTION'
  rating: integer("rating").default(5).notNull(), // 1 to 5
  comment: text("comment").notNull(),
  isResolved: boolean("is_resolved").default(false).notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(),
  adminReply: text("admin_reply"),
  repliedAt: timestamp("replied_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});



