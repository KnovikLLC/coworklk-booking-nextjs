import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import { computeBookingTotals } from "@/lib/bookings/pricing";
import { SLOT_TIMES } from "@/lib/bookings/slot-times";
import { checkMemberDiscount } from "@/lib/pricing/discount";

export class BookingError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "BookingError";
  }
}

export interface CreateBookingParams {
  spaceId: string;
  pricingId: string;
  date: string;
  slot: string;
  addons?: { addon_id: string; quantity: number }[];
  notes?: string;
  userId?: string | null;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  createdBy?: string | null;
  /** Admin walk-ins with payment already received skip pending_payment. */
  markConfirmed?: boolean;
  /** Cowork Admin Assist: free-text accountability field, not a users.id FK
   *  (shared-device/shared-API-key trust model, no per-agent login). */
  agentName?: string;
  workspaceCount?: number;
}

export interface CreatedBooking {
  id: string;
  booking_number: string;
  total_amount: number;
  status: string;
}

// Shared by the guest checkout route (app/api/bookings) and the admin
// walk-in booking route (app/api/admin/bookings) so both go through the
// same server-side price/availability revalidation instead of trusting
// client-supplied amounts.
export async function createBooking(
  supabase: SupabaseClient<Database>,
  params: CreateBookingParams
): Promise<CreatedBooking> {
  const { data: space, error: spaceError } = await supabase
    .from("spaces")
    .select("id, type, total_inventory")
    .eq("id", params.spaceId)
    .eq("is_active", true)
    .single();

  if (spaceError || !space) {
    throw new BookingError("Space not found", 404);
  }

  const { data: pricing, error: pricingError } = await supabase
    .from("pricing")
    .select("id, price, space_id, duration")
    .eq("id", params.pricingId)
    .eq("space_id", params.spaceId)
    .eq("is_active", true)
    .single();

  if (pricingError || !pricing) {
    throw new BookingError("Pricing option not found for this space", 404);
  }

  const { data: availability, error: availabilityError } = await supabase.rpc(
    "check_availability",
    {
      p_space_id: params.spaceId,
      p_date: params.date,
      p_slot: params.slot as Database["public"]["Enums"]["time_slot"],
    }
  );

  const workspaceCount = params.workspaceCount ?? 1;
  const availabilityRow = !availabilityError && availability ? availability[0] : null;
  const remainingInventory = (availabilityRow?.total_inventory ?? 0) - (availabilityRow?.booked_count ?? 0);

  if (remainingInventory < workspaceCount) {
    throw new BookingError(
      remainingInventory > 0 
        ? `Only ${remainingInventory} seat(s) are available for this slot` 
        : "This slot is no longer available", 
      409
    );
  }

  let addonLines: { addon_id: string; unitPrice: number; quantity: number }[] = [];
  if (params.addons && params.addons.length > 0) {
    const addonIds = params.addons.map((a) => a.addon_id);
    const { data: addonRows, error: addonError } = await supabase
      .from("addons")
      .select("id, price")
      .in("id", addonIds)
      .eq("is_active", true);

    if (addonError || !addonRows || addonRows.length !== addonIds.length) {
      throw new BookingError("One or more add-ons are invalid", 400);
    }

    const priceById = new Map(addonRows.map((a) => [a.id, Number(a.price)]));
    addonLines = params.addons.map((a) => ({
      addon_id: a.addon_id,
      unitPrice: priceById.get(a.addon_id)!,
      quantity: a.quantity,
    }));
  }

  // Doc §8.3: guest bookings never get a discount; checkMemberDiscount
  // already short-circuits to ineligible when userId is null, but the
  // pricing.price lookup only exists here, so the discount check happens
  // here rather than being pre-computed by the caller.
  const discount = await checkMemberDiscount(
    supabase,
    params.userId ?? null,
    params.guestEmail ?? null,
    Number(pricing.price)
  );

  const totals = computeBookingTotals(
    Number(pricing.price) * workspaceCount,
    addonLines.map((l) => ({ unitPrice: l.unitPrice, quantity: l.quantity })),
    discount.discount_percent
  );

  let guestProfileId: string | null = null;
  if (!params.userId && params.guestEmail) {
    const { data: guestProfile, error: guestError } = await supabase
      .from("guest_profiles")
      .upsert(
        { email: params.guestEmail, full_name: params.guestName, phone: params.guestPhone },
        { onConflict: "email" }
      )
      .select("id")
      .single();

    if (guestError || !guestProfile) {
      throw new BookingError("Could not create guest profile", 500);
    }
    guestProfileId = guestProfile.id;
  }

  const slotTimes = SLOT_TIMES[params.slot] ?? null;

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      // Overwritten unconditionally by the set_booking_number trigger
      // (supabase/migrations/20260712173532_bookings.sql) before the row is
      // written; the generated insert type just doesn't know that.
      booking_number: "",
      space_id: params.spaceId,
      pricing_id: params.pricingId,
      user_id: params.userId ?? null,
      guest_profile_id: guestProfileId,
      booking_type: params.userId ? "member" : "guest",
      booking_date: params.date,
      time_slot: params.slot as Database["public"]["Enums"]["time_slot"],
      start_time: slotTimes?.start ?? null,
      end_time: slotTimes?.end ?? null,
      guest_name: params.guestName ?? null,
      guest_email: params.guestEmail ?? null,
      guest_phone: params.guestPhone ?? null,
      base_amount: totals.base_amount,
      addons_amount: totals.addons_amount,
      discount_percent: totals.discount_percent,
      discount_amount: totals.discount_amount,
      discount_reason: discount.eligible ? discount.reason : null,
      total_amount: totals.total_amount,
      status: params.markConfirmed ? "confirmed" : "pending_payment",
      payment_reference: null,
      notes: params.notes ?? null,
      created_by: params.createdBy ?? null,
      agent_name: params.agentName ?? null,
      workspace_count: workspaceCount,
    })
    .select("id, booking_number, total_amount, status")
    .single();

  if (bookingError || !booking) {
    throw new BookingError(bookingError?.message ?? "Could not create booking", 500);
  }

  if (addonLines.length > 0) {
    const { error: addonInsertError } = await supabase.from("booking_addons").insert(
      addonLines.map((l) => ({
        booking_id: booking.id,
        addon_id: l.addon_id,
        quantity: l.quantity,
        unit_price: l.unitPrice,
        total_price: l.unitPrice * l.quantity,
      }))
    );

    if (addonInsertError) {
      throw new BookingError(addonInsertError.message, 500);
    }
  }

  return { ...booking, status: booking.status ?? "pending_payment" };
}
