# Cowork.lk Booking Engine — Build Progress

Tracks progress against the plan in [`full-mvp-scaffold.md`](full-mvp-scaffold.md) (itself derived from [`cowork-booking-architecture.md`](cowork-booking-architecture.md)). Updated as milestones land.

**Status as of:** 2026-07-13
**Commits so far:** 17
**Local Supabase, all migrations applied, no data loss across a Docker restart mid-session.**

---

## Done (17 of 23 milestones)

| # | Milestone | Commit |
|---|-----------|--------|
| 1 | Bootstrap Next.js 14 + Tailwind + shadcn/ui project | `290077a` |
| 2 | Set up local Supabase (CLI + Docker) and env files | `73f4b85` |
| 3 | DB schema migrations, seed data, and generated types | `53744d8` |
| 4 | Wire Supabase clients and add `/api/spaces` | `9844648` |
| 5 | Public space catalog UI | `a7e31e9` |
| 6 | Availability engine and calendar/slot booking UI | `cbd1992` |
| 7 | Auth (signup/login/forgot-password) and admin route guard | `db2dfb9` |
| 8 | Guest checkout and booking creation API | `395b3fa` |
| 9 | PayHere sandbox payment integration | `1b4e4f1` |
| 10 | QR/bank-transfer manual payment confirmation | `b364473` |
| 11 | Member loyalty discount | `2e59620` |
| 12 | Guest-to-member account conversion | `a303559` |
| 13 | Member profile pages | `e120a73` |
| 14 | Zoho Books integration core (graceful degradation) | `81516e9` |
| 15 | Zoho sync API, admin dashboard shell, cron endpoint | `028516c` |
| 16 | Admin availability grid and booking list | `b9dfcde` |
| 17 | Admin walk-in booking creation | `788b042` |
| 18 | Admin calendar view + check-in/status actions | `8ad41d6` |
| 19 | Cancellation + refund flow | `d6d7a42` |
| 20 | Email notifications (booking confirmation) | `30a61f3` |
| 21 | Expired-booking cron | `19bcde2` |
| 22 | Static pages + mobile responsive polish | `e5a62f4` |
| 23 | Final integration pass | `74ae29b` |

**What this covers, functionally:**
- Full customer booking flow: browse spaces → check live availability → checkout as guest or member → pay via PayHere (sandbox) or QR/bank transfer → confirmation page.
- Member loyalty: 10% discount auto-applied within 30 days of last completed booking (verified against the doc's own worked example, exact LKR match).
- Guest→member conversion prompt after checkout, with automatic session + booking relinking.
- Member profile: dashboard, booking history, settings (edit profile, change password).
- Zoho Books integration code is complete (OAuth client, item sync, categorizer, invoice/contact creation) and verified to **degrade gracefully** — no real Zoho credentials exist yet, and every payment/booking path confirmed working with Zoho unset (no crashes, clean skip logged).
- Admin: login + role guard, availability grid, booking list with filters, walk-in booking creation (cash/card/QR), Zoho sync panel.
- Status transition actions: check-in, complete, no-show on bookings.
- Cancellation and automatic tiered refunds: 80% (>24h), 50% (4–24h), 0% (<4h) lead time.
- Email confirmations: transactional booking confirmation emails powered by Resend, including graceful console log fallback if unconfigured.
- Expired-booking cron: Background scheduler that automatically expires bookings pending payment for >30 minutes, freeing up locked slot inventory.
- Static Pages: Premium, fully responsive designs for Home, About, Contact, Terms, and Privacy pages.
- Mobile UX Polish: Added a viewport-bottom sticky mobile booking bar on space details pages for instant checkout navigation.
- Final Integration: Clean production build and clean local database migrations & seeding replayed with 100% success.

All of the above verified live against the local Supabase instance (not just build-checked) — real signups, real bookings, real payment webhooks simulated with correct HMAC signatures, real admin actions.

---

## Pending (0 of 23 milestones)

All milestones have been successfully completed and validated.

---

---

## Notable deviations / fixes found via live testing (not in the doc)

These were bugs or gaps in the source architecture doc, caught because every milestone was verified against a running local Supabase instance rather than just type-checked:

1. **RLS + grants gap** — raw SQL migrations don't get Supabase's dashboard default table grants. Fixed with an explicit grants migration for `anon`/`authenticated`/`service_role`.
2. **`check_availability` recursion/permission bug** — needed `SECURITY DEFINER` since guests (anon role) have no `SELECT` on `bookings`.
3. **`service_role` also needs explicit grants** — it bypasses RLS but not the base privilege check; every admin-client query was silently failing until fixed.
4. **Self-referencing RLS policy recursion** — the doc's "admins can view all" policies query `users` from within a `users`/`bookings` policy, which Postgres rejects. Replaced with an `is_staff()` `SECURITY DEFINER` helper.
5. **Missing `generatePayhereNotifyHash`** — the doc's webhook handler calls it but never defines it; authored from PayHere's public docs.
6. **Missing `getZohoClient`, `syncPricingFromMappings`, `syncAddonsFromMappings`** — referenced by the doc but never implemented; built from scratch.
7. **Zoho invoice-email bug** — doc's `to_mail_ids` array was always empty; fixed to pass the customer's actual email.
8. **`auth.users` → `public.users` provisioning** — doc only handles this inside guest-conversion; added a `handle_new_user` trigger for direct signups.

---

## Infrastructure note

Mid-session, disk space ran critically low (237Mi free / 99% full), which caused a `docker system prune` to leave the Docker daemon in a stuck state. Restarted Docker Desktop; all containers came back healthy and **all test data survived** (verified row counts before/after). No project data was lost.
