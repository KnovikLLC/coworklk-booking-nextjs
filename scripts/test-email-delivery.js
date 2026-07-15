const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const { Resend } = require("resend");

async function run() {
  console.log("=== Email Delivery Test Runner ===\n");

  // 1. Load environment variables from .env.local
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    console.error("Error: .env.local file not found at project root.");
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, "utf8");
  const getEnv = (key) => {
    const regex = new RegExp(`^[^#\\n]*${key}\\s*=\\s*(.+)`, "m");
    return envContent.match(regex)?.[1]?.trim() || "";
  };

  const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
  const resendApiKey = getEnv("RESEND_API_KEY");
  const emailFrom = getEnv("EMAIL_FROM") || "onboarding@resend.dev";

  console.log("Configuration Loaded:");
  console.log(`- Supabase URL: ${supabaseUrl || "(Not Set)"}`);
  console.log(`- Supabase Key: ${supabaseKey ? "Present (***)" : "(Not Set)"}`);
  console.log(`- Resend API Key: ${resendApiKey ? "Present (***)" : "(Not Set)"}`);
  console.log(`- From Email: ${emailFrom}\n`);

  if (!resendApiKey) {
    console.error("Error: RESEND_API_KEY is not configured in .env.local.");
    console.error("Please add a valid Resend API key to test real delivery.");
    process.exit(1);
  }

  const resend = new Resend(resendApiKey);

  // 2. Fetch booking details (real or mock fallback)
  let booking = null;
  let bookingIdInput = process.argv[2];

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      let query = supabase
        .from("bookings")
        .select("id, booking_number, booking_date, time_slot, total_amount, guest_name, guest_email, spaces ( name )");

      if (bookingIdInput) {
        console.log(`Fetching specified booking ID: ${bookingIdInput}...`);
        query = query.eq("id", bookingIdInput);
      } else {
        console.log("No booking ID specified. Fetching latest booking from Supabase...");
        query = query.order("created_at", { ascending: false }).limit(1);
      }

      const { data, error } = await query;
      if (error) {
        console.warn(`Supabase query warning: ${error.message}`);
      } else if (data && data.length > 0) {
        booking = data[0];
        console.log(`Found booking #${booking.booking_number} in database.`);
      }
    } catch (dbError) {
      console.warn("Could not connect to Supabase database. Falling back to mock booking.");
    }
  }

  // 3. Fallback to mock data if no database booking is found
  if (!booking) {
    console.log("Using Mock Booking details for test email...");
    booking = {
      booking_number: "TEST-99999",
      booking_date: "2026-07-20",
      time_slot: "08:00_12:00",
      total_amount: "1500.00",
      guest_name: "John Doe Test",
      guest_email: "rmmpremaratne@gmail.com", // default developer test email
      spaces: { name: "Test Space (Hot Desk)" }
    };
  }

  // 4. Overwrite recipient from CLI args if provided
  const targetEmail = process.argv[3] || booking.guest_email;
  if (!targetEmail) {
    console.error("Error: No recipient email address could be resolved.");
    process.exit(1);
  }

  const ccList = ["admin@cowork.lk", "lakshan@cowork.lk"];
  const bccList = ["hasanthi@cowork.lk"];

  console.log("\nPreparing email delivery check:");
  console.log(`- From: Cowork.lk <${emailFrom}>`);
  console.log(`- To: ${targetEmail}`);
  console.log(`- CC: ${ccList.join(", ")}`);
  console.log(`- BCC: ${bccList.join(", ")}`);
  console.log(`- Booking Ref: #${booking.booking_number}`);
  console.log(`- Space: ${booking.spaces?.name}`);
  console.log(`- Date: ${booking.booking_date} (${booking.time_slot.replace("_", " ")})`);
  console.log(`- Amount: LKR ${booking.total_amount}`);

  // 5. Build HTML content (matching Resend HTML template)
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #F97316;">Booking Confirmed! [TEST DELIVERY]</h2>
      <p>Hello ${booking.guest_name || "Customer"},</p>
      <p>This is a test execution to verify the email delivery pipeline of Cowork.lk.</p>
      
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
        <h4 style="margin-top: 0; color: #333333;">Verification Details</h4>
        <p style="margin: 0;">If you received this email, the Resend integration, domain DNS configuration, and CC recipient routing are functional.</p>
      </div>

      <p style="margin-top: 30px; font-size: 12px; color: #999999;">Cowork Lanka (Pvt) Ltd, Pannipitiya, Sri Lanka.</p>
    </div>
  `;

  // 6. Send via Resend SDK
  console.log("\nSending email via Resend API...");
  try {
    const response = await resend.emails.send({
      from: `Cowork.lk <${emailFrom}>`,
      to: targetEmail,
      cc: ccList,
      bcc: bccList,
      subject: `Booking Confirmed [TEST] - #${booking.booking_number}`,
      html: htmlContent,
    });

    if (response.error) {
      console.error("Delivery failed with Resend API error:");
      console.error(response.error);
      process.exit(1);
    }

    console.log("\nSuccess! Email queued successfully via Resend.");
    console.log(`Response Event ID: ${response.data.id}`);
  } catch (err) {
    console.error("An unexpected error occurred during Resend API execution:");
    console.error(err);
    process.exit(1);
  }
}

run();
