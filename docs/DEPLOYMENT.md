# Deployment Guide — Cowork.lk Booking Engine

Target: **Vercel (Hobby)** for hosting + **Supabase (Free tier)** for the database, with **GitHub Actions** running the two background cron jobs. Total infra cost at launch: **$0/mo** (see the upgrade-path table in §6 for when that changes).

## 1. Pre-deploy checklist

- [ ] Real PayHere merchant ID + merchant secret (live, not sandbox)
- [ ] Real Zoho OAuth app: client ID, client secret, refresh token, organization ID
- [ ] Resend API key + a verified sending domain (or subdomain) for `cowork.lk`
- [ ] A generated `CRON_SECRET` (any random string)
- [ ] DNS access for `cowork.lk`
- [ ] A GitHub account/org to host the repo

## 2. Push the repo to GitHub

This repo has no GitHub remote yet. Create a new repo and push. **Recommendation: make it public.** No secrets are ever committed (`.env.local` is gitignored; all real credentials live in Vercel and GitHub Actions secrets), and a public repo gets unlimited free GitHub Actions minutes — see §4 for why that matters. If it must stay private, everything still works, just with a small (~$7/mo) Actions overage cost documented below.

## 3. Create the Supabase project (Free tier)

1. New project in Supabase Cloud, region **Southeast Asia (Singapore)** (closest available to Sri Lanka), plan **Free**.
2. `supabase link --project-ref <ref>`, then `supabase db push` to apply all 14 migrations in `supabase/migrations/`.
3. Apply `supabase/seed.sql` once — confirm 6 spaces, ~20 pricing rows, 9 addons landed.
4. **Re-verify the RLS/grants fixes found during local development actually apply on the fresh hosted project** — this is the single highest-risk step in this whole plan. Three separate permission bugs were found and fixed during the build (see `docs/build-progress.md`): explicit `GRANT`s for `anon`/`authenticated`/`service_role` (raw SQL migrations don't get Supabase dashboard's default grants), `SECURITY DEFINER` on `check_availability()`, and the `is_staff()` helper replacing a self-referencing RLS policy that Postgres would otherwise reject as infinite recursion. These are all already in the migration files, so `db push` should carry them over — but confirm with a real test: a guest can view availability, a booking can be created, an admin can see all bookings.
5. Supabase Auth → Site URL: `https://cowork.lk`, plus redirect URLs for password reset and guest-conversion signup.
6. **Configure custom SMTP for Auth emails using Resend** (Project Settings → Auth → SMTP Settings), reusing the same Resend account already used for booking confirmations. Supabase's free-tier built-in email sender is rate-limited to a handful per hour; custom SMTP removes that limit entirely, at no extra cost.

## 4. Push crons to GitHub Actions (not Vercel Cron)

Vercel's Hobby plan caps native Cron Jobs at once per day — too infrequent for this app's `zoho-sync` and `expire-bookings` jobs. Running them via GitHub Actions instead is what makes Vercel Hobby viable.

Workflow: `.github/workflows/cron.yml`. Set `APP_URL` (`https://cowork.lk`) and `CRON_SECRET` (same value as in Vercel's env vars) as GitHub Actions repo secrets — Settings → Secrets and variables → Actions. No app code changes needed; both routes already check `CRON_SECRET` as a Bearer token.

Both jobs run together every 15 minutes (one billed Actions-minute per firing, not two) — `expire-bookings` was originally every 5 minutes; checking every 15 instead just means an abandoned pending-payment booking frees its slot up to ~15 min later than before, which is a fine tradeoff for this business's volume. At */15: ~2,880 runs/mo. **Free on a public repo. On a private repo, ~880 min over GitHub Free's 2,000/mo allowance ≈ ~$7/mo** — still cheaper than paying for Vercel Pro, which is the alternative this avoids.

Side benefit: this workflow hits the database every 15 minutes for as long as the app is live, which keeps the Supabase free-tier project from ever going 7 days idle (see §6 — that's what free tier's auto-pause is keyed off).

## 5. Create the Vercel project (Hobby)

1. Import the GitHub repo, framework preset Next.js, plan **Hobby**.
2. Set every variable from `.env.example` to real production values: `NEXT_PUBLIC_URL`, `NEXT_PUBLIC_PHONE`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `PAYHERE_MERCHANT_ID`, `PAYHERE_MERCHANT_SECRET`, `PAYHERE_MODE` (start `sandbox`), `ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`, `ZOHO_REFRESH_TOKEN`, `ZOHO_ORGANIZATION_ID`, `ZOHO_REDIRECT_URI`, `RESEND_API_KEY`, `EMAIL_FROM`, `CRON_SECRET`.
3. Note: Vercel Hobby's ToS restricts use to non-commercial projects. This is a paid booking business — worth a conscious decision here, not silently ignored. If that's a blocker, Vercel Pro ($20/mo) is the fallback with no other changes needed.
4. Point `cowork.lk` DNS at Vercel; SSL auto-provisions.

## 6. Free-tier limits and upgrade paths (reference table)

| Layer | Free path | What you're accepting | Upgrade if |
|---|---|---|---|
| Vercel | Hobby, $0/mo | Non-commercial ToS restriction | Need commercial terms, more function headroom → **Pro $20/mo** |
| Supabase | Free, $0/mo | No automated backups (mitigate: run `supabase db dump` manually on a schedule you're comfortable with, e.g. weekly); built-in Auth email rate limit (mitigated by Resend SMTP in §3.6); auto-pause after 7 days idle (mitigated by the GitHub Actions cron in §4 keeping it warm) | Want automated daily backups/PITR without doing it yourself → **Pro $25/mo**. Want to avoid Supabase's pricing specifically rather than pay for backups → **self-host** the same Docker stack this app already runs in local dev (zero app code changes, just different connection env vars) on a small VPS — 2 vCPU/4GB RAM/40-80GB SSD is plenty (e.g., Hetzner CX22 ≈ $4.70/mo, or DigitalOcean 4GB Droplet ≈ $24/mo) — but you then own OS patching, Docker updates, backup automation, and uptime yourself. |
| Cron | GitHub Actions | ~$7/mo Actions overage if repo is private | Make the repo public to remove this entirely |

**Total at launch: $0/mo**, or up to ~$7/mo if the GitHub repo must stay private.

## 7. Go live with real payments

1. With `PAYHERE_MODE=sandbox` still set, run one full booking → PayHere sandbox payment → webhook confirmation cycle against the **live deployment URL** — first real test of the `notify_url` wiring, which is derived from `NEXT_PUBLIC_URL`.
2. Once that passes, flip `PAYHERE_MODE=live` and redeploy (env var changes need a redeploy).
3. Run one small real transaction end-to-end before announcing launch.

## 8. Post-deploy smoke test

- [ ] Guest checkout → booking created → payment confirmed → status flips to `confirmed`
- [ ] Zoho invoice attempt fires (check `zoho_sync_log` / the booking's `zoho_invoice_id`)
- [ ] Confirmation email actually arrives
- [ ] Member signup → loyalty discount applies correctly on a second booking within 30 days
- [ ] Admin login → availability grid, booking list, walk-in creation, check-in all work
- [ ] Cancellation → correct tiered refund amount computed
- [ ] Manually trigger `.github/workflows/cron.yml` via `workflow_dispatch` right after first deploy and confirm both curl steps return 200

## 9. Monitoring & rollback

Vercel's and Supabase's built-in dashboards (function logs, Postgres logs/metrics) are sufficient at this scale. Recommended addition: one free external uptime check (e.g., UptimeRobot) pinging the homepage. **Rollback:** Vercel deploys are atomic and instantly revertible from the dashboard. Database rollback on free tier means restoring your latest manual `pg_dump` — a reason to actually keep that cadence, not just note it exists.

## Known gap to launch with

Space photo upload was explicitly deferred during the build — production will launch with placeholder SVG images unless an admin upload flow is built first.
