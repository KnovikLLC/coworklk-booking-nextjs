-- Admin "New Booking" flow requests a discount code before any booking
-- exists yet (order-level discount applied at creation time), so
-- discount_verifications.booking_id must be nullable. It gets backfilled to
-- the first created booking's id once the verified code is consumed at
-- creation, which also marks the row as no longer reusable.
alter table discount_verifications alter column booking_id drop not null;
