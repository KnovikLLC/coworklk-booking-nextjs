import { z } from "zod";
import { bookingAddonSchema } from "@/lib/validation/booking.schema";

// Cowork Admin Assist (front-desk phone-booking app). Unlike the guest
// checkout and admin walk-in schemas, guest_email is genuinely optional here
// — a phone call doesn't yield an email, and the design doc's own posture is
// "booking still created, Zoho/email steps skipped gracefully" when absent.
// agent_name is required (per-submission accountability, not per-staff login).
export const mobileBookingCreateSchema = z.object({
  space_id: z.string().uuid(),
  pricing_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  slot: z.enum([
    "morning",
    "afternoon",
    "evening",
    "night",
    "full_day",
    "unlimited",
    "1hr",
    "2hr",
    "30min",
  ]),
  guest_name: z.string().min(2).optional(),
  guest_email: z.string().email().optional(),
  guest_phone: z.string().min(9),
  addons: z.array(bookingAddonSchema).max(20).optional(),
  notes: z.string().max(1000).optional(),
  agent_name: z.string().min(1),
  device_id: z.string().optional(),
});

export type MobileBookingCreateInput = z.infer<typeof mobileBookingCreateSchema>;
