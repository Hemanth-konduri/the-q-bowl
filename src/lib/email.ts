import nodemailer from "nodemailer";
import { Resend } from "resend";

const resendKey = process.env.RESEND_API_KEY;
const resend = resendKey ? new Resend(resendKey) : null;

const gmailUser = process.env.GMAIL_USER;
const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

const transporter = (gmailUser && gmailAppPassword)
  ? nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    })
  : null;

interface ComplaintEmailOptions {
  to: string;
  customerName: string;
  complaintId: string;
  subject: string;
  responseText: string;
  status: string;
  adminName?: string;
}

export async function sendComplaintResponseEmail(options: ComplaintEmailOptions) {
  const { to, customerName, complaintId, subject, responseText, status, adminName = "Q1 Bowl Support Team" } = options;

  if (!to) {
    console.warn("⚠️ No recipient email provided for complaint notification.");
    return false;
  }

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 2px solid #000; border-radius: 16px; padding: 24px; background-color: #FFF8EE;">
      <div style="text-align: center; border-b: 2px solid #000; padding-bottom: 16px; margin-bottom: 20px;">
        <h1 style="margin: 0; color: #000; font-size: 24px; font-weight: 900; text-transform: uppercase;">Q1 BOWL SUPPORT</h1>
        <p style="margin: 4px 0 0; color: #E5A00D; font-weight: bold; font-size: 14px;">Ticket Update: ${complaintId}</p>
      </div>

      <p style="font-size: 15px; color: #111; font-weight: bold;">Hello ${customerName},</p>
      <p style="font-size: 14px; color: #333; line-height: 1.5;">There is a new update regarding your support complaint <strong>"${subject}"</strong> (ID: <code>${complaintId}</code>).</p>

      <div style="background-color: #ffffff; border: 2px solid #000; border-radius: 12px; padding: 16px; margin: 20px 0;">
        <div style="font-size: 12px; font-weight: 900; color: #666; text-transform: uppercase; margin-bottom: 8px;">
          Message from ${adminName}:
        </div>
        <p style="font-size: 14px; color: #000; margin: 0; font-weight: 600; white-space: pre-wrap;">"${responseText}"</p>
      </div>

      <div style="display: flex; align-items: center; justify-content: space-between; background-color: #000; color: #E5A00D; padding: 12px 16px; border-radius: 10px; font-size: 13px; font-weight: 900; text-transform: uppercase;">
        <span>Current Ticket Status:</span>
        <span style="background-color: #E5A00D; color: #000; padding: 4px 10px; border-radius: 6px;">${status}</span>
      </div>

      <p style="font-size: 12px; color: #666; margin-top: 24px; text-align: center;">
        You can view your complete ticket history anytime under <strong>My Complaints</strong> in your Q1 Bowl account.
      </p>
    </div>
  `;

  try {
    if (resend) {
      await resend.emails.send({
        from: "Q1 Bowl Support <support@theqbowl.com>",
        to: [to],
        subject: `Update on Ticket ${complaintId}: ${subject}`,
        html: htmlBody,
      });
      console.log(`✓ Complaint update email sent via Resend to ${to}`);
      return true;
    }

    if (transporter) {
      await transporter.sendMail({
        from: `"Q1 Bowl Support" <${gmailUser}>`,
        to,
        subject: `Update on Ticket ${complaintId}: ${subject}`,
        html: htmlBody,
      });
      console.log(`✓ Complaint update email sent via Nodemailer to ${to}`);
      return true;
    }

    console.log(`ℹ️ [Email Simulation] To: ${to} | Ticket ${complaintId} | Status: ${status} | Message: ${responseText}`);
    return true;
  } catch (err) {
    console.error("Failed to send complaint response email:", err);
    return false;
  }
}
