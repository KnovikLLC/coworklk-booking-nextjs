-- Create discount_verifications table: holds a pending admin-applied booking
-- discount until the emailed 6-digit code is confirmed. Only once verified
-- does the discount get written onto the target booking.
create table if not exists discount_verifications (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id),
  discount_type text not null check (discount_type in ('percent', 'amount')),
  discount_value numeric not null check (discount_value > 0),
  discount_reason text,
  requested_by uuid not null references users(id),
  code text not null,
  expires_at timestamp with time zone not null,
  verified_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add index on booking_id for quick lookups
create index if not exists idx_discount_verifications_booking on discount_verifications(booking_id);

-- Enable RLS (service role only, same posture as domain_verifications)
alter table discount_verifications enable row level security;
