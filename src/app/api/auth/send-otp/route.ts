import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { emailOtps } from "@/db/schema";
import { Resend } from "resend";
import nodemailer from "nodemailer";
import { randomInt } from "crypto";
import { eq } from "drizzle-orm";

const resendKey = process.env.RESEND_API_KEY;
const resend = resendKey ? new Resend(resendKey) : null;

const gmailUser = process.env.GMAIL_USER;
const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

// Configure Nodemailer transporter if Gmail App Password is provided
const transporter = (gmailUser && gmailAppPassword)
  ? nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    })
  : null;

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Mark previous unused OTPs as used to prevent stale/blocked state
    await db
      .update(emailOtps)
      .set({ used: true })
      .where(eq(emailOtps.email, cleanEmail));

    const otp = randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await db.insert(emailOtps).values({
      id: crypto.randomUUID(),
      email: cleanEmail,
      otp,
      expiresAt,
    });

    // Always log OTP in server console for development & debugging access
    console.log("\n=================================================");
    console.log(`🔑 [Q1 BOWL AUTH OTP] Code for ${cleanEmail}: ${otp}`);
    console.log("=================================================\n");

    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f5e3cd;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5e3cd;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#FFF8EE;border:4px solid #0F3329;border-radius:24px;overflow:hidden;box-shadow:8px 8px 0px #0F3329;">
        <tr>
          <td style="background:#0F3329;padding:32px 40px;text-align:center;">
            <p style="margin:0;font-size:28px;font-weight:900;color:#E5A00D;letter-spacing:1px;text-transform:uppercase;">Q1 BOWL</p>
            <p style="margin:4px 0 0;font-size:12px;color:#f5e3cd;letter-spacing:2px;text-transform:uppercase;">ARTISAN CLOUD KITCHEN</p>
          </td>
        </tr>
        <tr>
          <td style="padding:36px;">
            <p style="margin:0 0 8px;font-size:22px;font-weight:800;color:#0F3329;text-transform:uppercase;">YOUR SECURITY CODE</p>
            <p style="margin:0 0 28px;font-size:14px;color:#0F3329;opacity:0.8;line-height:1.5;">Use the 6-digit passcode below to access your Q1 Bowl account. Valid for <strong>10 minutes</strong>.</p>
            <div style="background:#f5e3cd;border:3px solid #0F3329;border-radius:16px;padding:24px;text-align:center;margin-bottom:28px;box-shadow:4px 4px 0px #0F3329;">
              <p style="margin:0 0 4px;font-size:11px;font-weight:800;color:#0F3329;letter-spacing:2px;text-transform:uppercase;">ONE-TIME PASSCODE</p>
              <p style="margin:0;font-size:42px;font-weight:900;letter-spacing:12px;color:#0F3329;font-family:monospace;">${otp}</p>
            </div>
            <p style="margin:0;font-size:12px;color:#0F3329;opacity:0.6;">If you did not request this verification code, please ignore this email.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    // 1. Try sending via Nodemailer (Gmail SMTP with App Password - works for ALL recipients!)
    if (transporter) {
      try {
        const info = await transporter.sendMail({
          from: `"Q1 Bowl" <${gmailUser}>`,
          to: cleanEmail,
          subject: `${otp} is your Q1 Bowl login code`,
          html: emailHtml,
        });
        console.log("✉️ [Nodemailer Gmail] OTP email sent successfully:", info.messageId);
      } catch (nodemailerError) {
        console.error("⚠️ [Nodemailer Error]:", nodemailerError);
      }
    } 
    // 2. Fallback to Resend if configured
    else if (resend) {
      try {
        const { data, error: resendApiError } = await resend.emails.send({
          from: "Q1 Bowl <onboarding@resend.dev>",
          to: cleanEmail,
          subject: `${otp} is your Q1 Bowl login code`,
          html: emailHtml,
        });

        if (resendApiError) {
          console.error("⚠️ [Resend Error]:", resendApiError.message);
        } else {
          console.log("✉️ [Resend] Email sent successfully, ID:", data?.id);
        }
      } catch (resendError) {
        console.error("⚠️ [Resend Unexpected Error]:", resendError);
      }
    }

    return NextResponse.json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error sending OTP:", error);
    return NextResponse.json({ error: "Failed to generate OTP" }, { status: 500 });
  }
}
