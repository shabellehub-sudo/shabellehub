# ShabelleHub - Owner Handover Guide

## 1. Tech Stack
- Next.js 14 (Pages Router)
- Supabase (PostgreSQL)
- Vercel hosting
- Resend email
- Supabase Auth, roles via profiles.role

## 2. Domain
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
