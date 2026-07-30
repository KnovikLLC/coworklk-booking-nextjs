-- Lets Knovik staff on the @knovik.eu domain also use the existing
-- domain-verification auto-confirm payment flow (alongside knovik.com,
-- seeded in 20260715104500_domain_verification.sql). Unrelated to the
-- separate hardcoded 25% corporate discount check in lib/pricing/discount.ts.
INSERT INTO preconfigured_domains (domain) VALUES ('knovik.eu') ON CONFLICT DO NOTHING;
