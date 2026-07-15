import { z } from "zod";

export const bookingAddonSchema = z.object({
  addon_id: z.string().uuid(),
  quantity: z.number().int().min(1).max(20),
});

export const bookingCreateSchema = z
  .object({
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
    guest_phone: z.string().min(9).optional(),
    addons: z.array(bookingAddonSchema).max(20).optional(),
    payment_method: z.enum(["payhere", "qr_transfer", "stripe", "domain_verification"]),
    workspace_count: z.number().int().min(1).max(20).default(1),
    notes: z.string().max(1000).optional(),
    verification_email: z.string().email().optional(),
    verification_code: z.string().optional(),
  })
  .refine((data) => !!data.guest_email === !!data.guest_name, {
    message: "guest_name and guest_email must be provided together",
  });

export type BookingCreateInput = z.infer<typeof bookingCreateSchema>;

// Doc §4.2 POST /api/admin/bookings (walk-in/phone/manual booking).
export const adminBookingCreateSchema = z.object({
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
  customer: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(9),
  }),
  addons: z.array(bookingAddonSchema).max(20).optional(),
  payment_method: z.enum(["cash", "card_terminal", "qr_transfer", "payhere", "stripe", "domain_verification"]),
  payment_received: z.boolean().optional(),
  workspace_count: z.number().int().min(1).max(20).default(1),
  notes: z.string().max(1000).optional(),
});
export type AdminBookingCreateInput = z.infer<typeof adminBookingCreateSchema>;
