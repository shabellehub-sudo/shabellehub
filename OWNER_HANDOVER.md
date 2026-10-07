# ShabelleHub — Buyer Handover Guide

## 0. Purpose
This guide covers the key steps for transferring, verifying, and operating the production ShabelleHub platform.

## 1. Tech Stack
- Next.js 14 (Pages Router)
- Supabase (PostgreSQL)
- Vercel hosting
- Resend email
- Supabase Auth, roles via profiles.role

## 2. Production URL and Domain
Site runs on vercel.app subdomain. No custom domain purchased yet.
To add one: buy domain, add in Vercel Settings - Domains, update DNS, update NEXT_PUBLIC_SITE_URL.

## 3. Supabase Transfer
Option A: Supabase Dashboard - Project Settings - Transfer Project. Rotate service_role key after.
Option B: pg_dump/pg_restore to a new project, then re-run migrations in supabase/migrations/.

## 4. Storage Buckets
Check Supabase Storage for buckets (logos, screenshots). Confirm public/authenticated policy before recreating.

## 5. First Admin Account
1. New owner signs up via the app's auth flow.
2. Run in Supabase SQL Editor (replace email):
update profiles set role = 'admin' where id = (select id from auth.users where email = 'new-owner@example.com');
3. Confirm by logging into /admin.

## 6. Vercel Environment Variables
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY (rotate if transfer wasn't clean)
- RESEND_API_KEY
- NEXT_PUBLIC_SITE_URL
See .env.local.example for the full list.

## 7. Resend Email Ownership
1. New owner creates own Resend account or joins as team member.
2. If using a custom domain, verify sending domain (SPF, DKIM).
3. Generate new API key, update RESEND_API_KEY in Vercel.
4. Revoke old key after cutover confirmed working.

## 8. Database Migrations
All schema changes live in supabase/migrations/, applied in filename order.
Row Level Security is enabled on all public tables with policies scoped to is_staff/is_admin for writes and status-based filters for public reads. Verified against the live database directly.

## 9. Backup / Rollback
- Database backup: Supabase Dashboard - Database - Backups
- Code rollback: Vercel Dashboard - Deployments - select prior deployment - Promote to Production
- Full git history is in the repo

## 10. Credential Rotation Checklist
- Supabase service_role key
- Supabase anon key (if project wasn't transferred cleanly)
- Resend API key
- Admin account password(s)
- Any other API keys in .env.local.example

## 11. Known Limitations
- No custom domain configured yet
- Next.js is on the 14.x line (Pages Router); upgrade is optional
- Screenshots/Gallery field exists in tool schema but has no admin UI yet
- Some tools have stack/faqs fields populated, others do not (optional per-tool fields)


## 12. Buyer Verification
- [ ] GitHub repository and  branch verified
- [ ] Vercel production deployment verified
- [ ] Supabase database, Auth, Storage and RLS verified
- [ ] Buyer admin account verified
- [ ] Monitoring GitHub Action and recent run verified
- [ ] Resend/email configuration verified
- [ ] Sitemap, robots.txt and key pages verified

## 13. Transfer Order
1. GitHub → 2. Vercel → 3. Supabase → 4. Resend → 5. Verify production → 6. Rotate seller credentials.

## 14. Asset Scope
Included: source code, Git history, website, published content, admin functionality, monitoring workflow, database/storage subject to transfer, deployment configuration and documentation.

Not automatically included: seller personal accounts, credentials, payment accounts, custom domain (none currently configured), or third-party affiliate accounts that cannot be transferred.

## 15. Final Acceptance
Handover is complete when the buyer controls the required infrastructure, can access the admin, production is operational, monitoring is working, and seller credentials have been revoked or rotated.
