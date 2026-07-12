-- Enums shared across bookings/payments tables.
-- Doc: docs/cowork-booking-architecture.md §3.2 (bookings ~lines 393-415, payments ~lines 535-549)

CREATE TYPE booking_status AS ENUM (
  'pending_payment',
  'confirmed',
  'checked_in',
  'completed',
  'cancelled',
  'no_show',
  'expired'
);

CREATE TYPE time_slot AS ENUM (
  'morning',    -- 8am - 12pm
  'afternoon',  -- 12pm - 4pm
  'evening',    -- 4pm - 8pm
  'night',      -- 8pm - 12am
  'full_day',   -- 8am - 5pm
  'unlimited',  -- 8am - 8pm
  '1hr',
  '2hr',
  '30min'
);

CREATE TYPE booking_type AS ENUM (
  'member',     -- Registered user booking
  'guest'       -- Guest checkout (no account)
);

CREATE TYPE payment_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed',
  'refunded',
  'partially_refunded'
);

CREATE TYPE payment_method AS ENUM (
  'payhere',
  'qr_transfer',
  'cash',
  'card_terminal'
);
