# Handover — Cowork.lk Booking Engine

Read this first. It tells you exactly where things stand and what to do next without re-deriving anything from the codebase.

## Read these in order

1. **[build-progress.md](build-progress.md)** — what's done (17/23 milestones, all committed), what's pending, and 8 real bugs found in the source doc via live testing (RLS recursion, missing functions, etc.). Read this fully before touching code.
2. **[full-mvp-scaffold.md](full-mvp-scaffold.md)** — the original implementation plan (bootstrap steps, milestone breakdown, migration strategy, doc→file mapping, verification plan). This is the plan that's been executed milestone-by-milestone.
3. **[cowork-booking-architecture.md](cowork-booking-architecture.md)** — the source architecture spec everything is built from. Section numbers (§4.1, §8.3, etc.) are referenced throughout the code comments.

## Environment (already set up, don't redo)

- Local Supabase is running via Docker (`supabase_db_cowork-lk-booking-nextjs` etc.) — check with `docker ps | grep supabase`. If it's down: `pnpm supabase start` from the project root.
- `.env.local` exists (gitignored) with local Supabase keys already filled in. PayHere and Zoho vars are intentionally blank — every integration degrades gracefully without them (see build-progress.md point 3-7).
- `.claude/launch.json` defines the `dev` preview server (`pnpm dev`, autoPort enabled since port 3000 is often taken on this machine).
- Migrations: `supabase/migrations/*.sql` (13 files, timestamp-ordered). Seed data: `supabase/seed.sql`. To reset from clean: `pnpm supabase db reset` (this wipes local data and reseeds — test accounts below will be gone after).

### Test accounts (local DB only, will be lost on `db reset`)
- `admintester@example.com` / `TestPassword123!` — role `admin`
- `loyaltytester@example.com` / `TestPassword123!` — has a backdated completed booking (45 days ago) for testing loyalty-discount edge cases
- `convertme@example.com` / `ConvertPass123!` — converted from a guest booking
- `plainuser@example.com` / `TestPassword123!` — plain customer role, for testing non-admin access denial

## Critical workflow rule: never run `pnpm build` while the dev preview server is running

Doing this corrupts the `.next` cache and produces misleading errors (phantom `ReferenceError`s, flaky 404s on API routes that work fine seconds later). The pattern used throughout this build:

```bash
# to typecheck/build:
rm -rf .next && pnpm build

# to test in browser: stop the preview server first if one is running,
# clear .next, then start a fresh preview
```

If you see a route return 404 once and 400/200 on retry with identical requests, that's dev-mode HMR flakiness, not a real bug — confirm against a production build (`pnpm build && npx next start -p <port>`) before concluding it's broken.

## What's next: milestone 18 (in progress, not committed)

**Admin calendar view + check-in/status actions.** Was mid-implementation when handed off. Still needed:

1. `app/api/admin/calendar/route.ts` — GET, staff-only (reuse `lib/auth/require-staff.ts`), query params `start_date`/`end_date`/`space_id` (optional). Response shape is in doc §4.2 (`GET /api/admin/calendar`): `{ start_date, end_date, bookings: [...], availability_summary: {...} }`. `availability_summary` is keyed by date then space type; multi-inventory spaces (hot_desk, workspace) show `{used, total}`, single-inventory ones (meeting rooms, lobby — check `requires_specific_seat` on the `spaces` table) show `{booked: boolean}`.
2. `PATCH /api/admin/bookings/[id]/route.ts` — status transitions for check-in (`confirmed`→`checked_in`), complete (`checked_in`→`completed`, which fires the `update_user_booking_stats` trigger already in the DB), no-show (`confirmed`→`no_show`). Validate the transition is legal server-side; don't just accept any status string.
3. `components/admin/AdminCalendar.tsx` — week view per doc §10.6 mockup (days as columns, spaces as rows, booking blocks or FREE cells).
4. `app/admin/(staff)/calendar/page.tsx` — wire it in (route already linked from `AdminNav.tsx`, currently 404s).
5. Add check-in/complete/no-show action buttons somewhere reachable — simplest is adding them to `components/admin/BookingList.tsx`'s row actions, calling the new PATCH route.

**After milestone 18**, remaining in order: 19 (cancellation/refund — `calculateRefund` per doc §7.3, tiered 80%/50%/0%), 20 (email via Resend, must degrade gracefully like Zoho), 21 (expire-bookings cron, gap-fill — doc mentions it, no code given), 22 (static pages + mobile polish), 23 (final `pnpm build` + `db reset` + README pass).

## Patterns to follow (already established, don't reinvent)

- **Every `/api/admin/*` route** starts with `const staff = await requireStaff(); if ("error" in staff) return NextResponse.json(...)`.
- **Booking creation** always goes through `lib/bookings/create.ts`'s `createBooking()` — never insert into `bookings` directly, it handles price/availability revalidation, discount calc, and guest_profiles upsert.
- **Payment confirmation** always goes through `lib/bookings/payments.ts`'s `markBookingPaid()`, followed by `lib/zoho/create-booking-invoice.ts`'s `createBookingInvoice()` (which no-ops safely if Zoho is unconfigured).
- **Every external integration** (Zoho, PayHere) throws a typed "not configured" error when env vars are missing, and every call site catches it and continues. Follow this for Resend/email too.
- **Verify against the running app, not just `tsc`.** Every completed milestone in this project was checked live via the preview browser tools or curl against a running server — that's how the 8 bugs in build-progress.md were caught. Type-checking alone would have missed all of them.

## Outstanding uncommitted files

- `docs/build-progress.md` — the progress report, not yet committed. Commit it (or fold it into whatever commit finishes milestone 18) so history stays clean.
