const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

async function run() {
  console.log("=== Corporate Billing Report Verification Suite ===\n");

  // 1. Load env variables
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    console.error("Error: .env.local file not found.");
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, "utf8");
  const getEnv = (key) => {
    const regex = new RegExp(`^[^#\\n]*${key}\\s*=\\s*(.+)`, "m");
    return envContent.match(regex)?.[1]?.trim() || "";
  };

  const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseKey) {
    console.error("Error: Supabase credentials missing in .env.local.");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // 2. Fetch mock resources
  const { data: space } = await supabase.from("spaces").select("id").limit(1).single();
  const { data: pricing } = await supabase.from("pricing").select("id").limit(1).single();
  const { data: user } = await supabase.from("users").select("id, email, full_name").limit(1).single();

  if (!space || !pricing || !user) {
    console.error("Setup error: missing space, pricing, or user records.");
    process.exit(1);
  }

  console.log("Step 1: Inserting multiple mock corporate bookings across domains...");
  
  const org1 = "lakshan@knovik.com";
  const org2 = "ceo@corlence.com";
  
  const mockBookingsData = [
    { email: org1, num: `MOCK-RPT-1`, date: "2026-07-10", amt: 2500 },
    { email: org1, num: `MOCK-RPT-2`, date: "2026-07-15", amt: 3500 },
    { email: org2, num: `MOCK-RPT-3`, date: "2026-07-02", amt: 5000 },
    { email: org2, num: `MOCK-RPT-4`, date: "2026-06-25", amt: 4000 } // Different month!
  ];

  const bookingIds = [];
  
  for (const mock of mockBookingsData) {
    const { data: booking, error: bErr } = await supabase
      .from("bookings")
      .insert({
        user_id: user.id,
        booking_number: mock.num,
        booking_date: mock.date,
        time_slot: "morning",
        space_id: space.id,
        pricing_id: pricing.id,
        base_amount: mock.amt,
        total_amount: mock.amt,
        status: "confirmed",
        booking_type: "member",
        guest_name: "Mock Corporate Guest",
        guest_email: mock.email
      })
      .select("id")
      .single();

    if (bErr) {
      console.error(`Failed to insert mock booking ${mock.num}:`, bErr.message);
      process.exit(1);
    }
    
    bookingIds.push(booking.id);

    // Insert payment record
    const { error: pErr } = await supabase.from("payments").insert({
      booking_id: booking.id,
      amount: mock.amt,
      method: "domain_verification",
      status: "completed",
      gateway_transaction_id: `TX-${mock.num}`,
      paid_at: new Date(mock.date).toISOString()
    });

    if (pErr) {
      console.error(`Failed to insert mock payment for ${mock.num}:`, pErr.message);
      process.exit(1);
    }
  }

  console.log(`Successfully inserted ${mockBookingsData.length} mock corporate bookings/payments.`);

  // 3. Simulating the report generation
  console.log("\nStep 2: Simulating corporate billing report query & groupings...");
  
  const { data: payments, error: paymentsError } = await supabase
    .from("payments")
    .select(`
      id,
      amount,
      paid_at,
      bookings (
        id,
        booking_number,
        booking_date,
        time_slot,
        guest_name,
        guest_email,
        total_amount,
        status,
        spaces ( name )
      )
    `)
    .eq("method", "domain_verification")
    .eq("status", "completed");

  if (paymentsError) {
    console.error("Failed to query report payments:", paymentsError.message);
    process.exit(1);
  }

  const groups = {};

  for (const p of payments ?? []) {
    const b = p.bookings;
    if (!b || !["confirmed", "completed", "checked_in"].includes(b.status ?? "")) {
      continue;
    }

    const email = b.guest_email || "";
    const domain = email.split("@")[1]?.toLowerCase() || "unknown";
    const dateParts = b.booking_date.split("-");
    const month = dateParts.length >= 2 ? `${dateParts[0]}-${dateParts[1]}` : "unknown";
    const key = `${domain}_${month}`;

    if (!groups[key]) {
      groups[key] = {
        domain,
        month,
        bookingCount: 0,
        totalAmount: 0,
        bookings: []
      };
    }

    groups[key].bookingCount += 1;
    groups[key].totalAmount += Number(p.amount);
    groups[key].bookings.push({
      id: b.id,
      booking_number: b.booking_number,
      booking_date: b.booking_date,
      time_slot: b.time_slot,
      customer_name: b.guest_name,
      customer_email: b.guest_email,
      total_amount: Number(p.amount)
    });
  }

  const report = Object.values(groups).sort((a, b) => {
    if (a.domain !== b.domain) return a.domain.localeCompare(b.domain);
    return b.month.localeCompare(a.month);
  });

  console.log("\nGenerated Report Groups:");
  report.forEach(grp => {
    console.log(`- Domain: ${grp.domain} | Month: ${grp.month} | Bookings: ${grp.bookingCount} | Amount Due: LKR ${grp.totalAmount}`);
  });

  // 4. Assert correctness
  const knovikJuly = report.find(r => r.domain === "knovik.com" && r.month === "2026-07");
  const corlenceJuly = report.find(r => r.domain === "corlence.com" && r.month === "2026-07");
  const corlenceJune = report.find(r => r.domain === "corlence.com" && r.month === "2026-06");

  if (
    knovikJuly && knovikJuly.bookingCount >= 2 && knovikJuly.totalAmount >= 6000 &&
    corlenceJuly && corlenceJuly.bookingCount >= 1 && corlenceJuly.totalAmount >= 5000 &&
    corlenceJune && corlenceJune.bookingCount >= 1 && corlenceJune.totalAmount >= 4000
  ) {
    console.log("\nINTEGRATION SUCCESS: Groupings, filters, and sums verify perfectly!");
  } else {
    console.error("\nINTEGRATION FAILURE: Report values do not match expected sums.");
  }

  // 5. Clean up
  console.log("\nCleaning up mock records...");
  for (const id of bookingIds) {
    await supabase.from("payments").delete().eq("booking_id", id);
    await supabase.from("bookings").delete().eq("id", id);
  }
  console.log("Cleanup complete.");
}

run();
