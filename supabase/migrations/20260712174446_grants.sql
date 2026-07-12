-- Gap-fill (not in doc): raw SQL migrations don't get Supabase's dashboard
-- default table grants, so RLS policies alone aren't enough — the anon/
-- authenticated roles also need the underlying GRANT privileges, or every
-- query gets "permission denied for table X" regardless of policy.

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
