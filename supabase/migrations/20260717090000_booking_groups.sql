-- App-assigned grouping key for multi-item admin bookings (multiple spaces
-- and/or multiple dates created together in one order). NULL for every
-- existing single-booking path (guest checkout, mobile agent, single-item
-- admin booking) — fully backward compatible.
ALTER TABLE bookings ADD COLUMN booking_group_id UUID NULL;

CREATE INDEX idx_bookings_booking_group_id ON bookings (booking_group_id) WHERE booking_group_id IS NOT NULL;
