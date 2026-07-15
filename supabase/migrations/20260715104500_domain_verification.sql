-- Alter payment_method enum to add 'domain_verification'
ALTER TYPE payment_method ADD VALUE 'domain_verification';

-- Create preconfigured_domains table
CREATE TABLE public.preconfigured_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.preconfigured_domains ENABLE ROW LEVEL SECURITY;

-- Policies for preconfigured_domains
CREATE POLICY "Allow read access for authenticated users" ON public.preconfigured_domains
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow full access for staff" ON public.preconfigured_domains
  FOR ALL USING (is_staff());

-- Seed the initial preconfigured domains
INSERT INTO public.preconfigured_domains (domain)
VALUES 
  ('cowork.lk'),
  ('knovik.com'),
  ('corlence.com'),
  ('x-venture.io')
ON CONFLICT (domain) DO NOTHING;
