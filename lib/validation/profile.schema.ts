import { z } from "zod";

// PATCH /api/profile — whitelist of user-editable fields only. email/role/
// membership fields are server-managed and excluded on purpose.
export const profileUpdateSchema = z.object({
  full_name: z.string().min(2).max(100).optional(),
  phone: z.string().min(9).max(20).optional(),
  company_name: z.string().max(100).nullable().optional(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
