import { NextResponse } from "next/server";
import { db } from "@/db";
import { carts, cartItems, foodItems, offers, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "q1-bowl-artisan-super-secret-key-2026"
);

async function getUserIdFromToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return null;
    const verified = await jwtVerify(token, JWT_SECRET);
    return (verified.payload.id as string) || null;
  } catch {
    return null;
  }
}

async function getOrCreateCartId(userId: string | null, sessionKey: string): Promise<string> {
  if (userId) {
    const existing = await db.select().from(carts).where(eq(carts.userId, userId)).limit(1);
    if (existing.length > 0) return existing[0].id;
    const newId = `cart-usr-${userId}`;
    await db.insert(carts).values({
      id: newId,
      userId,
      sessionKey,
    });
    return newId;
  }

  const existing = await db.select().from(carts).where(eq(carts.sessionKey, sessionKey)).limit(1);
  if (existing.length > 0) return existing[0].id;
  const newId = `cart-ses-${sessionKey}`;
  await db.insert(carts).values({
    id: newId,
    sessionKey,
  });
  return newId;
}

export async function GET(req: Request) {
  try {
    const userId = await getUserIdFromToken();
    const { searchParams } = new URL(req.url);
    const sessionKey = searchParams.get("sessionKey") || "guest-session";

    const cartId = await getOrCreateCartId(userId, sessionKey);

    const cartData = await db.select().from(carts).where(eq(carts.id, cartId)).limit(1);
    const currentCart = cartData[0];

    const items = await db
      .select({
        id: cartItems.id,
        foodItemId: cartItems.foodItemId,
        quantity: cartItems.quantity,
        name: foodItems.name,
        price: foodItems.price,
        imageUrl: foodItems.imageUrl,
        isVeg: foodItems.isVeg,
        calories: foodItems.calories,
        protein: foodItems.protein,
        rating: foodItems.rating,
      })
      .from(cartItems)
      .innerJoin(foodItems, eq(cartItems.foodItemId, foodItems.id))
      .where(eq(cartItems.cartId, cartId));

    let offer = null;
    let discount = 0;
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    if (currentCart?.offerId) {
      const offerRows = await db.select().from(offers).where(eq(offers.id, currentCart.offerId)).limit(1);
      if (offerRows.length > 0) {
        offer = offerRows[0];
        if (!offer.minOrderAmount || subtotal >= offer.minOrderAmount) {
          if (offer.discountType === "PERCENTAGE") {
            discount = (subtotal * offer.discountValue) / 100;
            if (offer.maxDiscount) discount = Math.min(discount, offer.maxDiscount);
          } else {
            discount = offer.discountValue;
          }
        }
      }
    }

    const deliveryFee = subtotal > 0 ? (subtotal > 500 ? 0 : 49) : 0;
    const total = Math.max(0, subtotal + deliveryFee - discount);

    return NextResponse.json({
      cartId,
      items,
      subtotal,
      deliveryFee,
      discount,
      total,
      offer,
      notes: currentCart?.notes || "",
    });
  } catch (error) {
    console.error("Cart GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch cart" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getUserIdFromToken();
    const body = await req.json();
    const { foodItemId, quantity = 1, sessionKey = "guest-session" } = body;

    if (!foodItemId) {
      return NextResponse.json({ error: "Food item ID is required" }, { status: 400 });
    }

    const cartId = await getOrCreateCartId(userId, sessionKey);

    const existing = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.cartId, cartId), eq(cartItems.foodItemId, foodItemId)))
      .limit(1);

    if (quantity <= 0) {
      if (existing.length > 0) {
        await db.delete(cartItems).where(eq(cartItems.id, existing[0].id));
      }
    } else if (existing.length > 0) {
      await db
        .update(cartItems)
        .set({ quantity, updatedAt: new Date() })
        .where(eq(cartItems.id, existing[0].id));
    } else {
      await db.insert(cartItems).values({
        id: `ci-${cartId}-${foodItemId}`,
        cartId,
        foodItemId,
        quantity,
      });
    }

    return NextResponse.json({ success: true, cartId });
  } catch (error) {
    console.error("Cart POST Error:", error);
    return NextResponse.json({ error: "Failed to update cart" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const userId = await getUserIdFromToken();
    const { searchParams } = new URL(req.url);
    const foodItemId = searchParams.get("foodItemId");
    const sessionKey = searchParams.get("sessionKey") || "guest-session";

    const cartId = await getOrCreateCartId(userId, sessionKey);

    if (foodItemId) {
      await db
        .delete(cartItems)
        .where(and(eq(cartItems.cartId, cartId), eq(cartItems.foodItemId, foodItemId)));
    } else {
      await db.delete(cartItems).where(eq(cartItems.cartId, cartId));
      await db.update(carts).set({ offerId: null, notes: null }).where(eq(carts.id, cartId));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cart DELETE Error:", error);
    return NextResponse.json({ error: "Failed to delete cart item" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const userId = await getUserIdFromToken();
    const body = await req.json();
    const { couponCode, sessionKey = "guest-session", notes } = body;

    const cartId = await getOrCreateCartId(userId, sessionKey);

    if (notes !== undefined) {
      await db.update(carts).set({ notes }).where(eq(carts.id, cartId));
    }

    if (couponCode !== undefined) {
      if (!couponCode) {
        await db.update(carts).set({ offerId: null }).where(eq(carts.id, cartId));
        return NextResponse.json({ success: true, message: "Coupon removed" });
      }

      const offerRows = await db
        .select()
        .from(offers)
        .where(and(eq(offers.name, couponCode.trim().toUpperCase()), eq(offers.isActive, true)))
        .limit(1);

      if (offerRows.length === 0) {
        return NextResponse.json({ error: "Invalid or expired coupon code" }, { status: 400 });
      }

      await db.update(carts).set({ offerId: offerRows[0].id }).where(eq(carts.id, cartId));
      return NextResponse.json({ success: true, offer: offerRows[0] });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cart PUT Error:", error);
    return NextResponse.json({ error: "Failed to update cart" }, { status: 500 });
  }
}
