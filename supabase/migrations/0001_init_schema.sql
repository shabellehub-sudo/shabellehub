-- ShabelleHub: Firestore -> Postgres/Supabase schema
-- Pattern: each "collection" becomes a table with id (text) + doc (jsonb full record)
-- plus a few STORED generated columns mirrored out of doc for indexing/filtering/sorting,
-- mirroring exactly the where()/orderBy() calls used by the old Firestore lib/cms/*.js layer.

create extension if not exists pgcrypto;

-- Generic helper: every table uses this shape ------------------------------

-- ── PROFILES (admin/editor roles, linked 1:1 to Supabase Auth users) ──────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  role text not null default 'editor' check (role in ('admin','editor')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── POSTS ───────────────────────────────────────────────────────────────
create table if not exists public.posts (
  id text primary key default gen_random_uuid()::text,
  doc jsonb not null default '{}'::jsonb,
  status text generated always as (doc->>'status') stored,
  slug text generated always as (doc->>'slug') stored,
  title text generated always as (doc->>'title') stored,
  category_id text generated always as (doc->>'category_id') stored,
  author_id text generated always as (doc->>'author_id') stored,
  featured boolean generated always as (nullif(doc->>'featured','')::boolean) stored,
  tags jsonb generated always as (doc->'tags') stored,
  published_at text generated always as (doc->>'published_at') stored,
  scheduled_for text generated always as (doc->>'scheduled_for') stored,
  last_reviewed_at text generated always as (doc->>'last_reviewed_at') stored,
  created_at text generated always as (doc->>'created_at') stored,
  updated_at text generated always as (doc->>'updated_at') stored
);
create index if not exists posts_status_idx on public.posts(status);
create index if not exists posts_slug_idx on public.posts(slug);
create index if not exists posts_category_idx on public.posts(category_id);
create index if not exists posts_author_idx on public.posts(author_id);
create index if not exists posts_featured_idx on public.posts(featured);
create index if not exists posts_tags_gin on public.posts using gin(tags);
create index if not exists posts_updated_idx on public.posts(updated_at desc);
create index if not exists posts_published_idx on public.posts(published_at desc);

-- ── TOOLS ───────────────────────────────────────────────────────────────
create table if not exists public.tools (
  id text primary key default gen_random_uuid()::text,
  doc jsonb not null default '{}'::jsonb,
  status text generated always as (doc->>'status') stored,
  slug text generated always as (doc->>'slug') stored,
  name text generated always as (doc->>'name') stored,
  category text generated always as (doc->>'category') stored,
  featured boolean generated always as (nullif(doc->>'featured','')::boolean) stored,
  hot boolean generated always as (nullif(doc->>'hot','')::boolean) stored,
  tags jsonb generated always as (doc->'tags') stored,
  created_at text generated always as (doc->>'created_at') stored,
  updated_at text generated always as (doc->>'updated_at') stored
);
create index if not exists tools_status_idx on public.tools(status);
create index if not exists tools_slug_idx on public.tools(slug);
create index if not exists tools_category_idx on public.tools(category);
create index if not exists tools_featured_idx on public.tools(featured);
create index if not exists tools_hot_idx on public.tools(hot);
create index if not exists tools_tags_gin on public.tools using gin(tags);

-- ── AUTHORS ─────────────────────────────────────────────────────────────
create table if not exists public.authors (
  id text primary key default gen_random_uuid()::text,
  doc jsonb not null default '{}'::jsonb,
  slug text generated always as (doc->>'slug') stored,
  name text generated always as (doc->>'name') stored
);
create index if not exists authors_slug_idx on public.authors(slug);

-- ── CATEGORIES ──────────────────────────────────────────────────────────
create table if not exists public.categories (
  id text primary key default gen_random_uuid()::text,
  doc jsonb not null default '{}'::jsonb,
  name text generated always as (doc->>'name') stored,
  slug text generated always as (doc->>'slug') stored
);
create index if not exists categories_name_idx on public.categories(name);

-- ── TAGS ────────────────────────────────────────────────────────────────
create table if not exists public.tags (
  id text primary key default gen_random_uuid()::text,
  doc jsonb not null default '{}'::jsonb,
  name text generated always as (doc->>'name') stored,
  slug text generated always as (doc->>'slug') stored
);
create index if not exists tags_name_idx on public.tags(name);
create unique index if not exists tags_slug_unique on public.tags(slug);

-- ── MEDIA ───────────────────────────────────────────────────────────────
create table if not exists public.media (
  id text primary key default gen_random_uuid()::text,
  doc jsonb not null default '{}'::jsonb,
  created_at text generated always as (doc->>'created_at') stored
);
create index if not exists media_created_idx on public.media(created_at desc);

-- ── AFFILIATE LINKS ─────────────────────────────────────────────────────
create table if not exists public.affiliate_links (
  id text primary key default gen_random_uuid()::text,
  doc jsonb not null default '{}'::jsonb,
  status text generated always as (doc->>'status') stored,
  tool_slug text generated always as (doc->>'toolSlug') stored,
  updated_at text generated always as (doc->>'updated_at') stored,
  created_at text generated always as (doc->>'created_at') stored
);
create index if not exists affiliate_status_idx on public.affiliate_links(status);
create index if not exists affiliate_tool_idx on public.affiliate_links(tool_slug);

-- ── ANNOUNCEMENTS ───────────────────────────────────────────────────────
create table if not exists public.announcements (
  id text primary key default gen_random_uuid()::text,
  doc jsonb not null default '{}'::jsonb,
  active boolean generated always as (nullif(doc->>'active','')::boolean) stored,
  created_at text generated always as (doc->>'created_at') stored
);

-- ── NEWSLETTERS ─────────────────────────────────────────────────────────
create table if not exists public.newsletters (
  id text primary key default gen_random_uuid()::text,
  doc jsonb not null default '{}'::jsonb,
  status text generated always as (doc->>'status') stored,
  updated_at text generated always as (doc->>'updated_at') stored,
  created_at text generated always as (doc->>'created_at') stored
);
create index if not exists newsletters_status_idx on public.newsletters(status);

-- ── NEWSLETTER CAMPAIGNS ────────────────────────────────────────────────
create table if not exists public.newsletter_campaigns (
  id text primary key default gen_random_uuid()::text,
  doc jsonb not null default '{}'::jsonb,
  status text generated always as (doc->>'status') stored,
  sent_at text generated always as (doc->>'sentAt') stored,
  scheduled_at text generated always as (doc->>'scheduledAt') stored,
  updated_at text generated always as (doc->>'updated_at') stored,
  created_at text generated always as (doc->>'created_at') stored
);
create index if not exists campaigns_status_idx on public.newsletter_campaigns(status);

-- ── SUBSCRIBERS ─────────────────────────────────────────────────────────
create table if not exists public.subscribers (
  id text primary key default gen_random_uuid()::text,
  doc jsonb not null default '{}'::jsonb,
  email text generated always as (doc->>'email') stored,
  status text generated always as (doc->>'status') stored,
  source text generated always as (doc->>'source') stored,
  created_at text generated always as (doc->>'created_at') stored,
  updated_at text generated always as (doc->>'updated_at') stored
);
create unique index if not exists subscribers_email_unique on public.subscribers(email);
create index if not exists subscribers_status_idx on public.subscribers(status);

-- ── SITE CONFIG (singleton docs: navigation, homepage, footer, settings,
--    site_settings, plus one row per custom "page") ────────────────────
create table if not exists public.site_config (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by text
);

-- ── updated_at bump trigger (used only on site_config; doc-based tables
--    set updated_at themselves inside doc) ──────────────────────────────
create or replace function public.bump_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists site_config_touch on public.site_config;
create trigger site_config_touch before update on public.site_config
for each row execute function public.bump_updated_at();

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
for each row execute function public.bump_updated_at();
