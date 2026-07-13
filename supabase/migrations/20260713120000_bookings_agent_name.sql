-- Cowork Admin Assist (docs/admin-assist-app-plan.md): phone bookings created
-- by a front-desk agent record who logged the call for accountability. This
-- is a shared-device/shared-API-key trust model (no per-agent login), so it's
-- a free-text column, not a user_id — created_by (users.id FK) stays reserved
-- for admin-authenticated walk-in bookings.
ALTER TABLE bookings ADD COLUMN agent_name VARCHAR(100);
