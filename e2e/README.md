# E2E tests (Playwright)

Run with `pnpm test:e2e`. This boots `pnpm dev` automatically (see `playwright.config.ts`'s `webServer`) and runs against the **live Supabase project** the same way this app has been manually verified throughout development — there is no separate test database.

## What each spec does

- `checkout.spec.ts` — customer date/slot selection through to a correctly-priced checkout summary. Stops short of the final "Confirm Booking" click, since Zoho Books is live-configured in this project and a real submission would create a real invoice for a throwaway test customer.
- `holidays.spec.ts` — seeds a holiday directly via a service-role REST write (see `helpers/supabase-rest.ts`), confirms the customer booking calendar renders it as "Closed" with every slot blocked, then removes it in a `finally` block regardless of test outcome.
- `admin-batch-booking.spec.ts` — logs in as staff and creates a multi-item, multi-date order through the admin cart UI. **Skipped automatically** unless `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` are set (see below), and cleans up the bookings it creates.

## One-time setup: staff test account

`admin-batch-booking.spec.ts` needs a real Supabase user with `role = 'admin'` or `'frontdesk'` to log in as. This is **not** something the suite provisions or tears down per run — create it once manually (Supabase dashboard or SQL), then set:

```
E2E_ADMIN_EMAIL=...
E2E_ADMIN_PASSWORD=...
```

in `.env.local` (or CI secrets). Without these set, that spec skips cleanly rather than failing.

## Data hygiene

Every spec that writes data cleans it up in the same run (via `finally` or an explicit cleanup step at the end). If a run is interrupted mid-test, check for and remove:
- any `holidays` row with `reason = 'Playwright E2E test holiday'`
- any `bookings`/`guest_profiles` row with `guest_email` ending in `@example.com` from a Playwright test account
