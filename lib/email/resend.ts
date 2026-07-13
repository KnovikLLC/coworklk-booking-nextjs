import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

export class ResendNotConfiguredError extends Error {
  constructor() {
    super("Resend API key not configured");
    this.name = "ResendNotConfiguredError";
  }
}

// Doc: docs/cowork-booking-architecture.md §5.5 gap-fill.
// Sends a booking confirmation email using Resend, or gracefully no-ops/logs
// if the Resend API key is missing.
export async function sendBookingConfirmationEmail(bookingId: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn(`[Resend] RESEND_API_KEY is not configured. Logging booking confirmation email details instead:`);
    const admin = createAdminClient();
    const { data: booking } = await admin
      .from("bookings")
      .select("booking_number, booking_date, time_slot, total_amount, guest_name, guest_email, spaces ( name )")
      .eq("id", bookingId)
      .single();

    if (booking) {
      console.log(`[Resend Email Mock]`);
      console.log(`  To: ${booking.guest_email}`);
      console.log(`  Subject: Booking Confirmed - #${booking.booking_number}`);
      console.log(`  Body: Hello ${booking.guest_name || "Customer"}, your booking for ${booking.spaces?.name} on ${booking.booking_date} (${booking.time_slot}) is confirmed. Total: LKR ${booking.total_amount}.`);
    }
    return;
  }

  const admin = createAdminClient();
  const { data: booking, error } = await admin
    .from("bookings")
    .select("booking_number, booking_date, time_slot, total_amount, guest_name, guest_email, spaces ( name )")
    .eq("id", bookingId)
    .single();

  if (error || !booking || !booking.guest_email) {
    console.error(`[Resend] Could not send email: Booking details or customer email not found for ID: ${bookingId}`);
    return;
  }

  const resend = new Resend(apiKey);
  const fromEmail = process.env.EMAIL_FROM || "onboarding@resend.dev";

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #F97316;">Booking Confirmed!</h2>
      <p>Hello ${booking.guest_name || "Customer"},</p>
      <p>Thank you for booking with Cowork.lk. Your reservation has been successfully confirmed. Here are the details:</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eeeeee; font-weight: bold; width: 40%;">Booking Number:</td>
          <td style="padding: 8px; border-bottom: 1px solid #eeeeee; font-family: monospace;">${booking.booking_number}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eeeeee; font-weight: bold;">Space:</td>
          <td style="padding: 8px; border-bottom: 1px solid #eeeeee;">${booking.spaces?.name ?? "Coworking Space"}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eeeeee; font-weight: bold;">Date:</td>
          <td style="padding: 8px; border-bottom: 1px solid #eeeeee;">${booking.booking_date}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eeeeee; font-weight: bold;">Slot / Time:</td>
          <td style="padding: 8px; border-bottom: 1px solid #eeeeee;">${booking.time_slot.replace("_", " ")}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eeeeee; font-weight: bold;">Total Amount:</td>
          <td style="padding: 8px; border-bottom: 1px solid #eeeeee; font-weight: bold; color: #1F2937;">LKR ${Number(booking.total_amount)}</td>
        </tr>
      </table>

      <div style="margin-top: 30px; padding: 15px; background-color: #f9f9f9; border-radius: 6px; font-size: 12px; color: #666666;">
        <h4 style="margin-top: 0; color: #333333;">Cancellation & Refund Policy</h4>
        <ul>
          <li>Cancellations made 24+ hours in advance receive an 80% refund.</li>
          <li>Cancellations made 4-24 hours in advance receive a 50% refund.</li>
          <li>Cancellations made within 4 hours of the slot start are not eligible for a refund.</li>
        </ul>
      </div>

      <p style="margin-top: 20px; font-size: 14px;">You can view and manage your bookings at any time via the <a href="https://cowork.lk/profile/bookings" style="color: #F97316; text-decoration: none; font-weight: bold;">Member Dashboard</a>.</p>
      
      <p style="margin-top: 30px; font-size: 12px; color: #999999;">Cowork Lanka (Pvt) Ltd, Pannipitiya, Sri Lanka.</p>
    </div>
  `;

  const { error: sendError } = await resend.emails.send({
    from: `Cowork.lk <${fromEmail}>`,
    to: booking.guest_email,
    subject: `Booking Confirmed - #${booking.booking_number}`,
    html: htmlContent,
  });

  if (sendError) {
    throw new Error(sendError.message);
  }
}

// Cowork Admin Assist: sent for phone bookings created by a front-desk agent,
// carrying the booking summary + payment link (the actual payable link,
// since the Zoho invoice is accounting-record-only — see docs/admin-assist-app-plan.md).
// Same graceful no-op-if-unconfigured posture as sendBookingConfirmationEmail.
export async function sendPaymentRequestEmail(bookingId: string, paymentLink: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const admin = createAdminClient();
  const { data: booking, error } = await admin
    .from("bookings")
    .select("booking_number, booking_date, time_slot, total_amount, guest_name, guest_email, spaces ( name )")
    .eq("id", bookingId)
    .single();

  if (error || !booking || !booking.guest_email) {
    console.error(`[Resend] Could not send payment request: booking or email not found for ID: ${bookingId}`);
    return;
  }

  if (!apiKey) {
    console.warn(`[Resend] RESEND_API_KEY is not configured. Logging payment request email details instead:`);
    console.log(`[Resend Email Mock]`);
    console.log(`  To: ${booking.guest_email}`);
    console.log(`  Subject: Complete Your Booking - #${booking.booking_number}`);
    console.log(`  Body: Hello ${booking.guest_name || "Customer"}, please complete payment for your ${booking.spaces?.name} booking on ${booking.booking_date} (${booking.time_slot}). Total: LKR ${booking.total_amount}. Pay here: ${paymentLink}`);
    return;
  }

  const resend = new Resend(apiKey);
  const fromEmail = process.env.EMAIL_FROM || "onboarding@resend.dev";

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #F97316;">Complete Your Booking</h2>
      <p>Hello ${booking.guest_name || "Customer"},</p>
      <p>Thanks for booking with Cowork.lk over the phone. Here's a summary — tap below to complete payment and confirm your reservation.</p>

      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eeeeee; font-weight: bold; width: 40%;">Booking Number:</td>
          <td style="padding: 8px; border-bottom: 1px solid #eeeeee; font-family: monospace;">${booking.booking_number}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eeeeee; font-weight: bold;">Space:</td>
          <td style="padding: 8px; border-bottom: 1px solid #eeeeee;">${booking.spaces?.name ?? "Coworking Space"}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eeeeee; font-weight: bold;">Date:</td>
          <td style="padding: 8px; border-bottom: 1px solid #eeeeee;">${booking.booking_date}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eeeeee; font-weight: bold;">Slot / Time:</td>
          <td style="padding: 8px; border-bottom: 1px solid #eeeeee;">${booking.time_slot.replace("_", " ")}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eeeeee; font-weight: bold;">Total Amount:</td>
          <td style="padding: 8px; border-bottom: 1px solid #eeeeee; font-weight: bold; color: #1F2937;">LKR ${Number(booking.total_amount)}</td>
        </tr>
      </table>

      <p style="text-align: center; margin: 30px 0;">
        <a href="${paymentLink}" style="background-color: #F97316; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Pay Now</a>
      </p>

      <p style="margin-top: 20px; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:<br/>${paymentLink}</p>

      <p style="margin-top: 30px; font-size: 12px; color: #999999;">Cowork Lanka (Pvt) Ltd, Pannipitiya, Sri Lanka.</p>
    </div>
  `;

  const { error: sendError } = await resend.emails.send({
    from: `Cowork.lk <${fromEmail}>`,
    to: booking.guest_email,
    subject: `Complete Your Booking - #${booking.booking_number}`,
    html: htmlContent,
  });

  if (sendError) {
    throw new Error(sendError.message);
  }
}
