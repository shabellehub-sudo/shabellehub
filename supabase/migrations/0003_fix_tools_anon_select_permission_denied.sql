-- Fix: anon SELECT on public.tools failed with
-- "permission denied for function is_staff" because Postgres requires
-- EXECUTE on every function referenced in a policy's USING clause to plan
-- the query -- even when it's OR'd with a condition that would short-
-- circuit at runtime -- and the anon role never had EXECUTE on is_staff().
--
-- Minimal fix: split the single combined SELECT policy into two policies
-- scoped by role, so the anon-facing policy never references is_staff()
-- at all. Net permissions are unchanged: anon/authenticated still only see
-- published rows via one policy; staff (authenticated + is_staff()) still
-- see everything via the other.
--
-- Applied directly to production Supabase (mpciqgiykgoizsklmkhz) and
-- verified on 2026-09-18; this file brings the migration history in the
-- repo back in sync with the live database.

drop policy if exists "tools: public can read published" on public.tools;

create policy "tools_public_read_published"
on public.tools
for select
to anon, authenticated
using (status = 'published');

create policy "tools_staff_read_all"
on public.tools
for select
to authenticated
using (is_staff());
