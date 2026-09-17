import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // You can also persist to database / email service here
    console.log("[Newsletter Subscription]: New subscriber:", email);

    return NextResponse.json({
      success: true,
      message: "You're subscribed! Tomorrow's chef menu will drop in your inbox at 8:00 PM.",
    });
  } catch (error) {
    console.error("Newsletter error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
