-- Create domain_verifications table for 2FA validation codes
create table if not exists domain_verifications (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code text not null,
  expires_at timestamp with time zone not null,
  verified_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add index on email for quick lookups
create index if not exists idx_domain_verifications_email on domain_verifications(email);

-- Enable RLS
alter table domain_verifications enable row level security;
