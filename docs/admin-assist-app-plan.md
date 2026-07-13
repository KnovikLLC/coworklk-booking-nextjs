# Cowork Admin Assist — Mobile App Plan

This is a design document for handoff — implementation happens in a separate new Android project, not in this repo.

## Context

Front-desk staff currently take booking requests by phone with no structured capture — a caller asks for a space, staff note it down ad hoc, and creating the actual booking/invoice/payment request happens later as a separate manual step. The goal is an Android app, "Cowork Admin Assist," that closes this gap: after every call, it prompts staff to log the caller's details and the requested booking, then automatically checks availability, creates the booking, creates/reuses the Zoho customer, generates an invoice, and produces a payment link — with an automatic email and a WhatsApp message (sent manually by the agent, prefilled by the app) carrying that link to the customer.

There's an existing PoC at `/Users/madus/Documents/Github/badudeal-call-logger` — a **different client's** production tool (Badudeal, a hotline call-logger). It must not be modified. Its call-detection and offline-sync architecture is exactly what's needed here, so the plan is to **copy the pattern into a new project**, not touch the original.

Three real constraints surfaced during planning and were resolved:
1. **Truecaller has no public reverse-lookup API** for arbitrary callers (only a sales-negotiated Enterprise product). Resolved: match against the phone's local Android Contacts if the number is saved there; otherwise manual entry.
2. **Zoho Books likely can't process PayHere payments** (its gateway list doesn't include Sri Lanka-specific providers). Resolved: the Zoho invoice is the accounting record only; the actual payable "payment link" is a new page on our own site that opens PayHere checkout.
3. **App auth**: shared API key (mirrors this repo's existing `CRON_SECRET` Bearer-token pattern, and matches the trust model the PoC itself already uses — company-managed devices, one shared token) plus an `agent_name` field per submission for accountability, not per-staff login.

## What gets reused as-is from the PoC (copied, package renamed, unchanged logic)

Call-detection and offline-durability pipeline — this is the hard, already-solved part:
- `HotlineCallScreeningService` → capture the incoming number via `RoleManager.ROLE_CALL_SCREENING`
- `CallStateMonitor` → process-lifetime `TelephonyManager` listener detecting the OFFHOOK→IDLE transition (the deliberate deviation from a naive design that actually makes call-end detection work under Android's service-binding model)
- `CallSessionStore`, `CallEndNotifier` → hand-off and full-screen post-call notification
- Room persistence layer (`CallLogDao`/`Database`/`Entity`/`Mappers`) and `CallLogRepository`'s write-ahead-then-sync pattern, including its `Mutex`/`AtomicInteger` guard against the periodic and immediate sync workers racing each other
- `SyncScheduler`/`SyncWorker` (WorkManager, Hilt-injected worker factory, connectivity-constrained retry)
- `DeviceIdProvider`, DI module structure, `MainActivity`/`SetupScreen` permission checklist flow (Call Screening role, phone state, notifications, full-screen intent, battery optimization exemption — same MIUI-specific manual steps noted in the PoC's deployment checklist apply here too, since front-desk devices are likely similar budget Android hardware)

**One meaningful adaptation, not a blind copy:** the PoC's design assumes sync can lag — a call log reaching the Sheet ten minutes late is fine. A booking isn't: the agent needs to know immediately whether the space is available, ideally while the customer's still reachable. So the booking submission calls the backend **synchronously in the foreground** (loading state → immediate success/failure), with Room write-ahead kept as a local audit record and WorkManager retry only as the fallback path when the synchronous attempt fails due to connectivity.

## What's new in the Android app

- **Extended domain model**: `CallLogRecord` → adds `spaceId`, `pricingId`, `date`, `timeSlot`, `addons`, `customerEmail` (optional — a phone call doesn't yield an email; see backend section), `agentName` alongside the existing phone/name/timestamp fields. Kept flat and sink-agnostic per the PoC's own stated design principle.
- **Contacts lookup**: on `LogCallActivity` open, query `ContactsContract.PhoneLookup` with the captured number; prefill `customerName` on a match. Requires adding `READ_CONTACTS` to the manifest + a new runtime-permission step in the setup checklist (the PoC currently requests none of this — phone state, notifications, full-screen intent, battery only).
- **Booking form** replacing the PoC's 3-field `LogCallScreen`: space dropdown, date picker, slot/duration selector populated from a live availability call, add-on multi-select, customer name/phone/email fields, agent name. Mirrors the web admin's `CreateBookingForm.tsx` structure (`cowork-lk-booking-nextjs/components/admin/CreateBookingForm.tsx`) translated to Compose.
- **New sink** implementing the same `CallLogSink` interface shape, POSTing to the new backend endpoint (below) with `Authorization: Bearer <ADMIN_ASSIST_API_KEY>` — the exact `SinkModule`/`@Binds` swap point the PoC's own README already documents as the intended v2 migration path.
- **Result screen**: booking summary + payment link + a "Send via WhatsApp" button building an `Intent.ACTION_VIEW` on a `https://wa.me/<phone>?text=<url-encoded message>` deep link, prefilled with the booking summary and payment link — the agent reviews and taps send themselves inside WhatsApp. No WhatsApp Business API integration (no Meta approval/template process needed) — this is the "sent by admin manually" requirement, implemented as simply as possible.

New project at `/Users/madus/Documents/Github/cowork-admin-assist`, copied from the PoC's structure: `applicationId com.knovik.coworkadminassist`, app name "Cowork Admin Assist", same dependency versions (Kotlin 2.0.21, Compose BOM 2024.12.01, Hilt 2.52, Room 2.6.1, WorkManager 2.10.0, OkHttp 4.12.0 — all current, no upgrade needed).

## What's new on the backend (`cowork-lk-booking-nextjs`)

Reused untouched: `createBooking()` (`lib/bookings/create.ts`), `findOrCreateCustomer()` (`lib/zoho/customers.ts`), `lib/zoho/client.ts`'s graceful-degradation pattern, and the already-public `GET /api/spaces` / `GET /api/availability` routes — the mobile app's space/slot pickers call these directly, no new endpoints needed for browsing.

New:
- **`lib/auth/require-mobile-api-key.ts`** — mirrors `lib/auth/require-staff.ts`'s return shape but checks `Authorization: Bearer $ADMIN_ASSIST_API_KEY`, same pattern already proven in `app/api/cron/*/route.ts`.
- **`GET /api/mobile/customers/lookup?phone=`** — checks `guest_profiles` (and `users`) for a phone match, returns `{name, email}` if found, so a repeat caller's email doesn't need to be asked for again.
- **`POST /api/mobile/bookings`** — mobile-key-authed. Calls `createBooking()` with `markConfirmed: false` (this is an unpaid, `pending_payment` booking — payment happens later via the link). If an email was provided/found: calls `findOrCreateCustomer()` + `createInvoice()` (`lib/zoho/invoices.ts`, called with `paymentReceived: false`) for the Zoho accounting record, then a new `sendPaymentRequestEmail()` (`lib/email/resend.ts`, sibling to the existing `sendBookingConfirmationEmail`) with the booking summary + payment link. If no email: booking is still created, Zoho/email steps are skipped gracefully (same posture as every other integration in this app when its prerequisite is missing). Returns `{ booking, payment_link, zoho: { invoiced } }` to the app.
- **`lib/payhere/build-checkout.ts`** — small refactor extracting the hash/form-data-building logic currently inline in `app/api/payments/payhere/initiate/route.ts` into a shared function, so both that existing route and the new public page below use one implementation instead of duplicating it.
- **`app/(site)/pay/[bookingId]/page.tsx`** — new public page, the actual payment link destination. Server-loads the booking (must be `pending_payment`), shows a summary + a "Pay Now" button (a visible tap, not an on-load auto-submit — more reliable across mobile browsers when the link is opened from WhatsApp) that triggers the existing `redirectToPayhereCheckout()` client helper (`lib/payhere/redirect.ts`, already built, reused as-is) into PayHere checkout.
- **`createInvoice()` signature extension** (`lib/zoho/invoices.ts`): add an optional `sendEmail: boolean = true` param. Existing callers (PayHere webhook, QR confirm) keep current behavior; this new flow passes `false` since our own Resend email already carries the payment link — sending Zoho's separate email too would be a third redundant message alongside email + WhatsApp.
- **`ADMIN_ASSIST_API_KEY`** env var, added to `.env.example` alongside `CRON_SECRET`.

## Verification (for whoever implements this)

- Backend: same pattern used throughout this repo's build — curl the new endpoints against local Supabase with a test API key, confirm a booking row lands as `pending_payment`, confirm the `/pay/[id]` page renders and (with Zoho/PayHere left unconfigured, matching how the rest of local dev already works) degrades gracefully with clear "not configured" messaging instead of crashing.
- Android: a real connected device and JDK 17 are both available on this machine (`adb devices` / `/Library/Java/JavaVirtualMachines/jdk-17.jdk`), so the new project can be built (`./gradlew assembleDebug`) and installed (`adb install`) directly rather than written blind — worth doing early and often while implementing, not just at the end.
- What stays manual regardless (same as the PoC's own deployment checklist already requires): placing a real incoming call to confirm the screening service captures the number and the post-call notification fires — that needs an actual phone call to the device, not something to automate.
