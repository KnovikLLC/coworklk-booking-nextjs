-- Flags exactly one addon row as the auto-applied, non-selectable Evening
-- Convenience Fee (LKR 500) — createBooking() attaches it automatically
-- whenever the booked slot is "evening"; getActiveAddons() excludes it from
-- the normal user-selectable add-on list.
ALTER TABLE addons ADD COLUMN is_evening_fee BOOLEAN NOT NULL DEFAULT FALSE;
