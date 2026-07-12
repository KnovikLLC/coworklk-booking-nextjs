-- Gap-fill (not in doc): raw SQL migrations don't get Supabase's dashboard
-- default table grants, so RLS policies alone aren't enough — every role,
-- INCLUDING service_role, needs the underlying GRANT privilege or every
-- query gets "permission denied for table X" regardless of policy or RLS
-- bypass. service_role bypasses RLS but NOT the base privilege check —
-- found by testing the booking-creation flow end-to-end (the admin client
-- silently failed every table read with a swallowed "not found").

GRANT SELECT ON spaces TO anon, authenticated;
GRANT SELECT ON pricing TO anon, authenticated;
GRANT SELECT ON addons TO anon, authenticated;

GRANT SELECT, UPDATE ON users TO authenticated;
GRANT SELECT ON bookings TO authenticated;
GRANT SELECT ON payments TO authenticated;
GRANT SELECT ON booking_addons TO authenticated;
GRANT SELECT ON zoho_sync_log TO authenticated;
GRANT SELECT ON zoho_item_mapping TO authenticated;

-- guest_profiles has no client-facing policy (service-role only), so no
-- grants to anon/authenticated are needed there.

-- service_role: full read/write on every table it's used to write to
-- (guest checkout, admin actions, webhooks, cron, Zoho sync).
GRANT ALL ON spaces, pricing, addons, users, guest_profiles, bookings, payments,
  booking_addons, zoho_sync_log, zoho_item_mapping TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
