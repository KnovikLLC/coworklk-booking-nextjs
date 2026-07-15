import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/auth/require-staff";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const staff = await requireStaff();
    if ("error" in staff) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // Fetch all payments completed via domain_verification
    const { data: payments, error: paymentsError } = await admin
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
      console.error("Error fetching billing report payments:", paymentsError.message);
      return NextResponse.json({ error: paymentsError.message }, { status: 500 });
    }

    const groups: Record<
      string,
      {
        domain: string;
        month: string;
        bookingCount: number;
        totalAmount: number;
        bookings: {
          id: string;
          booking_number: string;
          booking_date: string;
          time_slot: string;
          customer_name: string;
          customer_email: string | null;
          total_amount: number;
          space_name: string;
        }[];
      }
    > = {};

    for (const p of payments ?? []) {
      const b = p.bookings as Record<string, unknown> | null;
      if (!b || !["confirmed", "completed", "checked_in"].includes((b.status as string) ?? "")) {
        continue;
      }

      const email = (b.guest_email as string) || "";
      const domain = email.split("@")[1]?.toLowerCase() || "unknown";
      const dateParts = (b.booking_date as string).split("-");
      const month = dateParts.length >= 2 ? `${dateParts[0]}-${dateParts[1]}` : "unknown";
      const key = `${domain}_${month}`;

      if (!groups[key]) {
        groups[key] = {
          domain,
          month,
          bookingCount: 0,
          totalAmount: 0,
          bookings: [],
        };
      }

      groups[key].bookingCount += 1;
      groups[key].totalAmount += Number(p.amount);
      groups[key].bookings.push({
        id: b.id as string,
        booking_number: b.booking_number as string,
        booking_date: b.booking_date as string,
        time_slot: b.time_slot as string,
        customer_name: (b.guest_name as string) || "Customer",
        customer_email: (b.guest_email as string) || null,
        total_amount: Number(p.amount),
        space_name: ((b.spaces as Record<string, unknown> | null)?.name as string) ?? "Space",
      });
    }

    const report = Object.values(groups).sort((a, b) => {
      if (a.domain !== b.domain) return a.domain.localeCompare(b.domain);
      return b.month.localeCompare(a.month);
    });

    return NextResponse.json({ report });
  } catch (err: unknown) {
    console.error("Corporate billing report error:", err);
    const msg = err instanceof Error ? err.message : "An unexpected error occurred";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
