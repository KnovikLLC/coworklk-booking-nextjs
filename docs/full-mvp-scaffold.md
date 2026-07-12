# Cowork.lk Booking Engine — Full MVP Scaffold

## Context

`/Users/madus/Documents/Github/cowork-lk-booking-nextjs` is a brand-new, empty project (no git repo, no code) containing only [docs/cowork-booking-architecture.md](docs/cowork-booking-architecture.md) — a 2413-line, fully-specified technical architecture for cowork.lk, a real-time coworking space booking engine for Cowork Lanka (Pvt) Ltd (Pannipitiya, Sri Lanka). The doc was written by a prior architecture pass and already contains the full DB schema (SQL), API spec (JSON shapes), and large verbatim TypeScript code samples for the core integrations (PayHere, Zoho Books, discount/refund logic). The task here is not to redesign anything — it's to scaffold this exact spec into a working, deployable Next.js 14 + Supabase codebase.

User decisions for this build pass (confirmed):
1. Build the **full MVP** (doc §1.1) in one pass — not just Week 1.
2. Use **local Supabase via CLI + Docker** for development (Docker is installed; `supabase` CLI is not — install as a dev dependency).
3. PayHere and Zoho Books: build **real integration code wired to env vars in sandbox mode**, but no live credentials exist yet — integrations must **degrade gracefully** (never crash a booking) when unconfigured.

Explicitly out of scope (doc §1.2/1.3): Stripe, quotation flow, SMS, membership packages, invoice-download portal, account deletion, mobile app, multi-location, staff scheduling, POS, inventory.

Environment: node v22.16.0, pnpm at `/Users/madus/Library/pnpm/pnpm`, Docker installed, `supabase` CLI not installed, no git repo yet.

---

## 1. Bootstrap

Use **pnpm** throughout (already available, faster than npm).

1. `git init`; `.gitignore` covering `node_modules`, `.env*.local`, `supabase/.branches`, `supabase/.temp`, `.next`.
2. `pnpm dlx create-next-app@14 . --typescript --tailwind --eslint --app --import-alias "@/*"` (accept non-empty-dir prompt since `docs/` exists).
3. `pnpm dlx shadcn@latest init` — then re-theme `tailwind.config.ts` with brand colors from doc §9.3: orange `#F97316` primary, dark `#1F2937` headers.
4. Install: `@supabase/supabase-js @supabase/ssr zod react-hook-form @hookform/resolvers date-fns resend sonner`, dev: `supabase`.
5. `pnpm dlx shadcn@latest add button card input label textarea select checkbox radio-group dialog calendar popover table badge tabs form toast avatar dropdown-menu separator skeleton alert alert-dialog`.
6. `pnpm supabase init` → `pnpm supabase start` (Docker-backed local Postgres/Auth/Storage/Realtime/Studio). Capture local URL + anon/service keys.
7. `.env.local` (gitignored, local Supabase values + `PAYHERE_MODE=sandbox`, Zoho vars blank) and `.env.example` (committed, full var list from doc §11.2).
8. Initial commit.

### Directory layout

```
/app
  /(public)         page.tsx, about, booking, booking/[spaceId], booking/checkout,
                     booking/success, booking/cancel, contact, terms, privacy
  /(auth)           login, signup, forgot-password
  /(member)         profile, profile/bookings, profile/settings
  /admin            login, dashboard, bookings, bookings/new, calendar, settings
  /api/spaces, /api/availability, /api/bookings, /api/bookings/[id], /api/bookings/[id]/cancel
  /api/admin/bookings, /api/admin/bookings/[id], /api/admin/availability, /api/admin/calendar
  /api/admin/payments/confirm-qr, /api/admin/zoho/sync, /api/admin/zoho/sync/status
  /api/cron/zoho-sync, /api/cron/expire-bookings
  /api/payments/payhere/initiate, /api/webhooks/payhere, /api/auth/convert-guest
/components/ui (shadcn) /booking /admin /member /auth /layout
/lib/supabase (client.ts, server.ts, admin.ts)
/lib/zoho (client.ts, item-categorizer.ts, sync-service.ts, customers.ts, invoices.ts, item-mapping.ts)
/lib/payhere (hash.ts, config.ts)
/lib/bookings (cancellation.ts, availability.ts)
/lib/pricing (discount.ts)
/lib/email (resend.ts, templates/)
/lib/validation (booking.schema.ts, ...)
/lib/types (database.types.ts generated, domain.ts)
/lib/utils.ts
/supabase/migrations/*.sql, /supabase/seed.sql, config.toml
/middleware.ts
vercel.json
```

---

## 2. Build Order (each milestone ends in a runnable, verifiable state)

1. **DB schema + seed** — write all migrations (see §3) + `seed.sql`, `pnpm supabase db reset`, generate types via `pnpm supabase gen types typescript --local > lib/types/database.types.ts`.
2. **Supabase client wiring + `/api/spaces`** — `lib/supabase/client.ts` (browser), `server.ts` (`@supabase/ssr`), spaces route matches doc §4.1 shape.
3. **Public space catalog** — `/booking` page + `SpaceCard`, brand styling.
4. **Availability engine + calendar UI** — `lib/bookings/availability.ts` wrapping `check_availability` RPC, `/api/availability`, `AvailabilityCalendar` + `SlotSelector` on `/booking/[spaceId]`.
5. **Auth + middleware** — signup/login/forgot-password, `middleware.ts` (rewritten against `@supabase/ssr`, not the deprecated `auth-helpers-nextjs` the doc shows), `auth.users → public.users` provisioning trigger (gap-fill, see §5.11), admin route guard.
6. **Guest checkout + booking creation** — `BookingForm`, `guest_profiles` upsert, `POST /api/bookings` with DB-generated `booking_number`, addon selection.
7. **PayHere integration (sandbox)** — `lib/payhere/hash.ts`, initiate route, webhook route with signature verification (must author the missing `generatePayhereNotifyHash`, see §5.9). Verified via simulated webhook curl, not a live redirect (no real credentials).
8. **QR/bank-transfer manual confirmation** — `BANK_DETAILS` constant, `/api/admin/payments/confirm-qr`.
9. **Member loyalty discount** — `lib/pricing/discount.ts` (verbatim `checkMemberDiscount`), wired into checkout total.
10. **Guest→member conversion** — `/api/auth/convert-guest` (verbatim, adapted to `@supabase/ssr`), prompt UI on `/booking/success`.
11. **Member profile pages** — `/profile`, `/profile/bookings`, `/profile/settings`, `MemberDashboard` widget (doc §8.8).
12. **Zoho integration core (degrade-gracefully)** — `lib/zoho/client.ts` with a typed `ZohoNotConfiguredError` short-circuit, `item-categorizer.ts`, `sync-service.ts`, `customers.ts`, `invoices.ts` (all verbatim from doc, wrapped in try/catch at call sites so bookings never fail on Zoho errors).
13. **Zoho sync API + admin dashboard** — sync/status routes, cron route, `vercel.json` cron entry, `ZohoSyncPanel` showing a "Not Configured" state cleanly.
14. **Admin availability grid + booking list** — `/api/admin/availability`, `/api/admin/bookings` (GET), grid/list UI per doc §10.3/10.4 mockups.
15. **Admin walk-in booking creation** — `POST /api/admin/bookings`, `CreateBookingForm` modal (doc §10.5), cash/card/QR branching.
16. **Admin calendar + check-in actions** — `/api/admin/calendar`, week view (doc §10.6), `PATCH /api/admin/bookings/:id` for status transitions.
17. **Cancellation + refund** — `lib/bookings/cancellation.ts` (verbatim `calculateRefund`), `/api/bookings/:id/cancel`.
18. **Email notifications** — `lib/email/resend.ts` + booking-confirmation template (gap-fill, see §5.5), no-ops cleanly without `RESEND_API_KEY`.
19. **Expired-booking cron** — `/api/cron/expire-bookings` (gap-fill, doc mentions 30-min timeout but gives no code), added to `vercel.json`.
20. **Static pages + mobile polish** — Home, About, Contact, Terms, Privacy, `MobileStickyBookingBar`, responsive pass per doc §9.3.
21. **Final pass** — `pnpm build` clean, `pnpm supabase db reset` from clean state, README with setup instructions.

This reorders the doc's Week 1-4 plan slightly — DB, availability, and auth are front-loaded since nearly everything else depends on them; email/cancellation/polish move to the end, consistent with the doc's own critical-path split (§12.3).

---

## 3. Database Migration Strategy

Split by FK dependency order, schema-only (no seed data in migrations — seed goes in `supabase/seed.sql` so it can be reapplied independently):

1. `0001_extensions.sql` — `pgcrypto` for `gen_random_uuid()`.
2. `0002_enums.sql` — `booking_status`, `time_slot`, `booking_type`, `payment_status`, `payment_method`.
3. `0003_spaces.sql` — `spaces` (doc lines 186-199).
4. `0004_pricing.sql` — `pricing`, FK → `spaces` (lines 214-226).
5. `0005_users.sql` — `users` + RLS + `check_member_discount()` (lines 267-334), FK → `auth.users`.
6. `0006_guest_profiles.sql` — `guest_profiles` + `convert_guest_to_member()` (lines 341-388).
7. `0007_bookings.sql` — `bookings` + `booking_number_seq` + `generate_booking_number()` + `update_user_booking_stats()` triggers + indexes + RLS (lines 393-529).
8. `0008_check_availability_function.sql` — `check_availability()` (lines 614-655).
9. `0009_payments.sql` — `payments` (lines 551-573).
10. `0010_addons.sql` — `addons` + `booking_addons` (lines 578-607).
11. `0011_zoho_sync.sql` — `zoho_sync_log` (lines 972-984).
12. `0012_zoho_item_mapping.sql` — `zoho_item_mapping` (lines 987-1012).
13. `0013_users_profile_trigger.sql` — **gap-fill**: `handle_new_user()` trigger on `auth.users` insert to auto-provision `public.users` rows for direct signups (doc only shows this happening inside guest-conversion, §8.6; direct `/signup` needs its own path — Supabase's standard documented pattern).

`supabase/seed.sql` — exact `INSERT` transcription of spaces (lines 202-208), all 6 space types' pricing (lines 229-261), addons (lines 589-598). Auto-applied by `supabase db reset`.

---

## 4. Doc Code Sample → File Mapping

Direct transcription targets (reuse verbatim, adapting only where noted):

| Source (doc) | Target file |
|---|---|
| §3.2 `check_member_discount` | `supabase/migrations/0005_users.sql` |
| §3.2 `convert_guest_to_member` | `supabase/migrations/0006_guest_profiles.sql` |
| §3.2 booking triggers | `supabase/migrations/0007_bookings.sql` |
| §3.3 `check_availability` | `supabase/migrations/0008_check_availability_function.sql` |
| §5.3 `categorizeZohoItem` | `lib/zoho/item-categorizer.ts` |
| §5.3 `syncZohoItems` | `lib/zoho/sync-service.ts` |
| §5.3 sync endpoints + cron config | `app/api/admin/zoho/sync/*`, `app/api/cron/zoho-sync/route.ts`, `vercel.json` |
| §5.4 `findOrCreateCustomer` | `lib/zoho/customers.ts` |
| §5.4 `createInvoice` | `lib/zoho/invoices.ts` |
| §5.4 `ZOHO_ITEMS` | `lib/zoho/item-mapping.ts` |
| §6.1 `generatePayhereHash` | `lib/payhere/hash.ts` |
| §6.1 initiate route | `app/api/payments/payhere/initiate/route.ts` |
| §6.1 webhook handler | `app/api/webhooks/payhere/route.ts` (needs the missing `generatePayhereNotifyHash`, see §5.9 below) |
| §6.2 `BANK_DETAILS` | `lib/payhere/config.ts` |
| §7.3 `calculateRefund` | `lib/bookings/cancellation.ts` |
| §8.4 `checkMemberDiscount` | `lib/pricing/discount.ts` |
| §8.6 convert-guest route | `app/api/auth/convert-guest/route.ts` (adapt to `@supabase/ssr`) |
| §10.7 `middleware.ts` | `middleware.ts` — **rewrite** against `@supabase/ssr`'s `createServerClient` + cookie adapter; the doc's version uses the deprecated `@supabase/auth-helpers-nextjs`. Same redirect logic (no session → `/admin/login`; role not in `admin`/`frontdesk` → `/`). |
| §11.2 env vars | `.env.example` |

---

## 5. Gaps in the Doc — Defaults to Apply

1. **shadcn components** not enumerated → install the set listed in bootstrap step 5.
2. **Toasts** not specified → `sonner`.
3. **Form validation** not specified → `zod` + `react-hook-form` + `@hookform/resolvers/zod`, schemas in `lib/validation/`.
4. **Space image upload** — doc mentions `image_url`/Storage but no upload flow. Default: seed with static `/public/images/spaces/*.jpg` placeholders; skip building a Storage upload UI in this pass (small standalone feature for later).
5. **Email template content** — only "booking confirmation" is named. Default: one template in `lib/email/templates/` with booking number, space, date/slot, total, cancellation policy, link to success page; `sendBookingConfirmationEmail()` no-ops/logs when `RESEND_API_KEY` unset.
6. **Loading/error states** — use Next.js `loading.tsx`/`error.tsx` per route segment + shadcn `Skeleton`.
7. **Shared types** — `lib/types/database.types.ts` (generated) + `lib/types/domain.ts` (hand-authored DTOs matching doc §4 JSON shapes).
8. **Tests** — doc has none; not adding a test framework in this pass since it wasn't requested, but keeping `lib/` functions pure/unit-testable for later.
9. **`generatePayhereNotifyHash`** — referenced by the webhook handler but never defined in the doc. Author from PayHere's documented formula: `md5(merchant_id + order_id + payhere_amount + payhere_currency + status_code + md5(merchant_secret).toUpperCase()).toUpperCase()`.
10. **30-min pending-payment expiry cron** — mentioned in the state table (§7.2) but no code/cron entry given. Author `app/api/cron/expire-bookings/route.ts` + add to `vercel.json`.
11. **`auth.users` → `public.users` provisioning** — only shown inside guest-conversion. Add `handle_new_user()` trigger (migration `0013`) for direct signups.
12. **Currency formatting** — add `formatLKR()` in `lib/utils.ts` via `Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' })`.
13. **Zoho OAuth token handling** — `getZohoClient()` is referenced but not implemented. Author `lib/zoho/client.ts` with access-token caching + refresh, and a typed `ZohoNotConfiguredError` thrown early when `ZOHO_CLIENT_ID`/`ZOHO_REFRESH_TOKEN`/`ZOHO_ORGANIZATION_ID` are unset — caught at every call site so bookings/sync never 500.
14. **`@supabase/auth-helpers-nextjs`** — deprecated; every doc reference to it is translated to `@supabase/ssr` throughout.

---

## 6. Verification

- **DB**: `pnpm supabase status` all-up; Studio Table Editor shows exact seed rows (6 spaces, 17 pricing, 9 addons); SQL Editor call to `check_availability(...)` returns expected row.
- **Spaces/availability API**: `curl localhost:3000/api/spaces` and `/api/availability?...` match doc §4.1 shapes.
- **Public UI**: preview tools — screenshot `/booking` and `/booking/[spaceId]`, snapshot for accessible text, network tab to confirm availability fetch succeeds.
- **Auth**: sign up a test user via preview `fill`/`click`, confirm `public.users` row created by trigger; confirm `/admin` redirects when logged out.
- **Booking + PayHere**: complete a guest booking → `pending_payment` row created; simulate the webhook with a locally computed matching MD5 signature (small throwaway Node script using sandbox secret from `.env.local`) → confirm flip to `confirmed`, `payments` row inserted, no crash with Zoho unset.
- **QR flow**: create `qr_transfer` booking (stays pending) → `POST /api/admin/payments/confirm-qr` → confirms.
- **Loyalty**: backdate a test user's completed booking within 30 days in Studio → next booking shows 10% off base only; matches doc §8.3 worked example.
- **Guest conversion**: convert a guest → prior `guest_email`-matched bookings now carry `user_id`/`booking_type = 'member'`.
- **Zoho graceful no-op**: with all `ZOHO_*` vars unset, `/api/admin/zoho/sync` returns a clean "not configured" response (not a 500), writes a `zoho_sync_log` row, admin panel renders a "Not Configured" state.
- **Admin dashboard**: screenshot availability grid vs doc §10.3 mockup, cross-check counts against a Studio SQL count; create a walk-in cash booking → immediately `confirmed`, appears in list + calendar; test check-in status transition.
- **Cancellation**: three bookings at >24h / 4-24h / <4h out → refunds of 80% / 50% / 0% respectively.
- **Email**: trigger confirmation without `RESEND_API_KEY` → logs instead of crashing.
- **Expiry cron**: backdate a `pending_payment` booking's `created_at` >30 min, invoke `/api/cron/expire-bookings` → flips to `expired`.
- **Mobile**: resize preview to 375×812 on `/booking` and homepage, confirm sticky booking bar and no overflow.
- **Final**: `pnpm build` zero errors; `pnpm supabase db reset` from clean replays all migrations + seed without failure (strongest signal migration ordering is correct).

### Critical files

- `supabase/migrations/0001–0013` — schema backbone, everything depends on correct ordering.
- `supabase/seed.sql` — exact transcription of doc's seed INSERTs.
- `lib/supabase/{client.ts,server.ts}` + `middleware.ts` — auth/session plumbing (requires translating the doc's deprecated auth-helpers pattern to `@supabase/ssr`).
- `lib/zoho/client.ts` + `lib/zoho/sync-service.ts` — must implement graceful degradation; riskiest divergence area from the doc, which assumes live credentials.
- `app/api/webhooks/payhere/route.ts` + `lib/payhere/hash.ts` — critical junction triggering Zoho invoice + email; requires authoring the missing `generatePayhereNotifyHash`.