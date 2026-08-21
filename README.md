# 🥗 Q Bowl — Artisan Chef Bowls & Meal Subscriptions

A modern, full-stack web application for ordering dietitian-balanced artisan meal bowls and customizable daily meal subscriptions. Designed with a premium aesthetic featuring dark forest green (`#0F3329`) and warm gold (`#E5A00D`) accents, small rounded corners (10–12px), elegant Outfit typography, and smooth GSAP micro-interactions.

---

## 🌟 Key Features

### 🍲 1. Artisan Food Catalog & Menu
- **Dietitian-Balanced Bowls**: Complete macro information (Calories, Protein, Carbs, Fat), ingredients list, and chef prep notes.
- **Interactive Menu**: Category filter pills, instant live search, and Pure Veg / Non-Veg diet toggles.
- **In-Place Stepper**: Add or adjust meal quantities directly on meal cards without leaving the catalog page.
- **Sticky Cart Bar**: Displays live item count and subtotal for quick checkout transition.

### 🛒 2. Cart & Promo Coupon System
- **Database-Backed Cart**: Cart state persists seamlessly across browser refreshes and user sessions.
- **Dynamic Coupon Verification**: Validate discount promo codes (Percentage & Fixed discounts) against the live database.
- **Item Stepper & Removal**: Easily update portion counts or remove items with 1-click.
- **Detailed Bill Breakdown**: Item subtotal, delivery fee calculation (free over ₹500), applied discount, and total.

### 📍 3. Interactive Location & Delivery Zone Verification
- **Leaflet Map Pinning**: Customers drop exact GPS location pins on an interactive Leaflet map.
- **15 km Kitchen Radius Check**: Validates delivery distance against the central cloud kitchen hub (`17.4399, 78.3847`).
- **Mandatory Pin Guard**: Displays blocking modal alerts if a delivery address lacks pinned map coordinates before proceeding to payment.

### 💳 4. Seamless Checkout & Payment Flow
- **Multi-Channel Payments**: Supports UPI (QR Code & VPA), Credit/Debit Cards, Net Banking, and Cash on Delivery.
- **Idempotent Payment Protection**: Form buttons enter loading states and use unique transaction tokens (`TXN-ORD-...`) to prevent accidental duplicate charges.
- **Order Confirmation & Live Tracking**: Generates real order IDs, estimated delivery time windows, and links to live order delivery tracking.

### 📅 5. Subscription Purchase Flow
- **Flexible Billing Cycles**: Segmented Weekly (7-Day) and Monthly (30-Day) plan passes with 20% savings badges.
- **5-Step Guided Customiser**:
  1. *Plan Selection*: Choose Starter, Balanced, or Premium tiers.
  2. *Meal Preferences*: Customize Veg/Non-Veg, Breakfast/Lunch/Dinner slot multi-select, spice intensity, allergy tags, and excluded ingredients.
  3. *Delivery Schedule*: Select start date, Mon–Sun delivery days, preferred time window, and pause policy.
  4. *Address Pinning*: Reuse saved delivery locations with mandatory map pin validation.
  5. *Subscription Payment*: Review billing recap and activate subscription.
- **Active Subscription Manager**: View remaining meal credits, expected expiry date, usage progress bar, and 1-click pause/resume toggle.

### 🖼️ 6. Supabase Storage & Drag-and-Drop Image Uploader
- **Single Bucket Storage (`qbowl-assets`)**: Organized folder architecture for clean asset management:
  - `meals/` → Food item photos
  - `categories/` → Menu category icons
  - `offers/` → Promotional banners
  - `subscriptions/` → Plan graphics
  - `users/avatars/` → Customer profile photos
  - `branding/` → App logo, favicon, and hero assets
- **Reusable `<ImageUploader />` Component**: Features drag-and-drop file dropzone, file browser, image preview, progress indicator, file format validation (JPG, PNG, WEBP), and 5MB size guard.

### 🛡️ 7. Comprehensive Admin Management Panel
- **Food Catalog Management**: Add, edit, toggle availability, or delete food items with image uploads to Supabase.
- **Categories & Offers**: Manage category groupings and promotional discount vouchers.
- **Subscription Plans**: Configure plan pricing, meal allowances, features, and graphics.
- **Branding Settings**: Update app logo, favicon, and landing page hero banners directly from the admin dashboard.
- **User Profile Photo Upload**: Customers can change their profile photos with automatic Supabase Storage uploads and database updates.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Server Actions, API Routes) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/), Custom Vanilla Utility Tokens |
| **Animations** | [GSAP (GreenSock)](https://greensock.com/gsap/), Tailwind Animate |
| **Database** | PostgreSQL via [Supabase](https://supabase.com/) |
| **ORM** | [Drizzle ORM](https://orm.drizzle.team/) & Drizzle Kit |
| **Storage** | [Supabase Storage](https://supabase.com/storage) (`qbowl-assets` bucket) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Mapping** | [Leaflet.js](https://leafletjs.com/) & OpenRouteService API |
| **Authentication** | JWT HTTP-Only Cookies & Bcrypt Password Hashing |

---

## 📁 Project Architecture

```
q1_bowl/
├── src/
│   ├── app/
│   │   ├── (landing)/           # Marketing Landing Page
│   │   ├── (auth)/              # Login, Signup, OTP Auth
│   │   ├── admin/               # Admin Management Dashboard (Food, Categories, Offers, Plans, Settings)
│   │   ├── user/                # Customer Experience (Menu, Details, Cart, Checkout, Payment, Subscriptions, Profile)
│   │   └── api/                 # Serverless API Routes (Cart, Orders, Subscriptions, Payments, Upload, Auth)
│   ├── components/
│   │   ├── admin/               # Admin Dashboard UI Components
│   │   ├── landing/             # Landing Page Sections (Hero, Features, Pricing, Menu Preview)
│   │   ├── shared/              # Reusable Shared Components (ImageUploader, AddressSelector, PaymentMethodSelector, PriceSummary, QuantityStepper, etc.)
│   │   └── user/                # User Navigation & Header
│   ├── db/
│   │   ├── schema.ts            # Drizzle Database Schemas & Enums
│   │   └── seed.ts              # Catalog & Initial Seed Data Script
│   └── lib/
│       ├── auth-guard.ts        # Admin & User Session Guards
│       ├── session.ts           # JWT Cookie Management
│       └── supabase-storage.ts  # Supabase Storage Client & Public URL Helper
└── public/                      # Static Brand Assets & Media
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** / **yarn** / **pnpm**

### 2. Clone Repository
```bash
git clone https://github.com/Hemanth-konduri/the-q-bowl.git
cd the-q-bowl
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Database Migration & Seed
```bash
# Push schema to PostgreSQL database
npx drizzle-kit push

# Seed initial catalog & subscription plans
npx tsx src/db/seed.ts
```

### 5. Start Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
