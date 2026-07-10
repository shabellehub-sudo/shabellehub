-- 0002_tool_events.sql
-- Trending section (this week / fastest growing) needs real usage data
-- instead of a static `hot` flag. This table records lightweight click
-- events per tool; trending is computed server-side by aggregating
-- recent rows, not stored as a precomputed number, so the ranking is
-- always current as of each request.

create table if not exists public.tool_events (
  id         uuid primary key default gen_random_uuid(),
  tool_id    text not null,
  event_type text not null check (event_type in ('view', 'click')),
  created_at timestamptz not null default now()
);

-- Aggregation queries filter by tool_id + a created_at range — this
-- composite index keeps that fast even once the table has millions of rows.
create index if not exists tool_events_tool_id_created_at_idx
  on public.tool_events (tool_id, created_at desc);

-- Also index created_at alone for the "all tools in the last N days" scans
-- the trending aggregation does.
create index if not exists tool_events_created_at_idx
  on public.tool_events (created_at desc);

alter table public.tool_events enable row level security;

-- Public/anon can INSERT (the whole point — anonymous visitors trigger
-- these events) but can NEVER read raw rows back. Aggregated trending
-- numbers are computed server-side with the service-role key (see
-- lib/trending.js), which bypasses RLS entirely — so this table's data
-- never needs to be readable by the anon key at all.
create policy "anon can insert tool_events"
  on public.tool_events
  for insert
  to anon
  with check (true);

-- Explicitly no SELECT/UPDATE/DELETE policy for anon — default-deny.

-- Optional housekeeping: uncomment and run periodically (e.g. via a
-- scheduled Supabase Edge Function) if you want to cap table growth.
-- This is NOT required for trending to work — it's just storage hygiene.
-- delete from public.tool_events where created_at < now() - interval '90 days';
