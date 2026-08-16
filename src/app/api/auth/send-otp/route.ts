import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { emailOtps } from "@/db/schema";
import { Resend } from "resend";
import { randomInt } from "crypto";
import { eq, and, gt } from "drizzle-orm";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  // Check if a valid OTP already exists (rate limiting)
  const existing = await db
    .select()
    .from(emailOtps)
    .where(
      and(
        eq(emailOtps.email, email),
        eq(emailOtps.used, false),
        gt(emailOtps.expiresAt, new Date())
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json(
      { error: "OTP already sent. Please wait before requesting a new one." },
      { status: 429 }
    );
  }

  const otp = randomInt(100000, 999999).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await db.insert(emailOtps).values({
    id: crypto.randomUUID(),
    email,
    otp,
    expiresAt,
  });

  await resend.emails.send({
    from: "Q1 Bowl <onboarding@resend.dev>",
    to: email,
    subject: "Your Q1 Bowl Login Code",
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#F7F3E8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F3E8;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(73,106,90,0.12);">
        <tr>
          <td style="background:#496A5A;padding:36px 40px;text-align:center;">
            <p style="margin:0;font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">Q1 Bowl</p>
            <p style="margin:6px 0 0;font-size:13px;color:#8FAF8F;">Cloud Kitchen</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#24332B;">Your login code</p>
            <p style="margin:0 0 32px;font-size:14px;color:#7C817A;line-height:1.6;">Use the code below to sign in to your Q1 Bowl account. This code expires in <strong style="color:#24332B;">10 minutes</strong>.</p>
            <div style="background:#F7F3E8;border-radius:12px;padding:28px;text-align:center;margin-bottom:32px;border:2px dashed #8FAF8F;">
              <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#7C817A;letter-spacing:2px;text-transform:uppercase;">One-Time Code</p>
              <p style="margin:0;font-size:44px;font-weight:800;letter-spacing:14px;color:#496A5A;">${otp}</p>
            </div>
            <div style="background:#FFF8F5;border-left:4px solid #D86F45;border-radius:4px;padding:14px 16px;margin-bottom:24px;">
              <p style="margin:0;font-size:13px;color:#7C817A;line-height:1.6;">If you didn't request this code, you can safely ignore this email.</p>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#F7F3E8;padding:20px 40px;border-top:1px solid #DDD9CC;">
            <p style="margin:0;font-size:12px;color:#7C817A;text-align:center;">&copy; ${new Date().getFullYear()} Q1 Bowl. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });

  return NextResponse.json({ success: true });
}
