 // pages/admin/index.js — Dashboard with live Supabase counts + seed button
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminLayout from '../../components/admin/AdminLayout';
import { StatCard, AdminCard, Button, ErrorBanner } from '../../components/admin/ui';
import { isSupabaseConfigured, getSupabaseClient } from '../../lib/supabase';
import { useAuth } from '../../lib/cms/useAuth';

async function headCount(client, table, filters = {}) {
  let q = client.from(table).select('id', { count: 'exact', head: true });
  for (const [col, val] of Object.entries(filters)) {
    if (val && val.op === 'contains') q = q.contains(col, val.value);
    else q = q.eq(col, val);
  }
  const { count } = await q;
  return count || 0;
}

async function fetchCounts() {
  const client = getSupabaseClient();
  if (!client) return null;

  const [
    totalTools, publishedTools, draftTools, featuredTools,
    totalPosts, publishedPosts, draftPosts,
    totalAuthors, totalReviewers, totalCats,
    totalAffiliates, activeAffiliates,
    totalSubscribers, activeSubscribers,
    totalCampaigns, sentCampaigns, draftCampaigns, scheduledCampaigns,
  ] = await Promise.all([
    headCount(client, 'tools'),
    headCount(client, 'tools', { status: 'published' }),
    headCount(client, 'tools', { status: 'draft' }),
    headCount(client, 'tools', { featured: true }),
    headCount(client, 'posts'),
    headCount(client, 'posts', { status: 'published' }),
    headCount(client, 'posts', { status: 'draft' }),
    headCount(client, 'authors', { doc: { op: 'contains', value: { roles: ['author'] } } }),
    headCount(client, 'authors', { doc: { op: 'contains', value: { roles: ['reviewer'] } } }),
    headCount(client, 'categories'),
    headCount(client, 'affiliate_links'),
    headCount(client, 'affiliate_links', { status: 'active' }),
    headCount(client, 'subscribers'),
    headCount(client, 'subscribers', { status: 'active' }),
    headCount(client, 'newsletter_campaigns'),
    headCount(client, 'newsletter_campaigns', { status: 'sent' }),
    headCount(client, 'newsletter_campaigns', { status: 'draft' }),
    headCount(client, 'newsletter_campaigns', { status: 'scheduled' }),
  ]);

  return {
    totalTools, publishedTools, draftTools, featuredTools,
    totalPosts, publishedPosts, draftPosts,
    totalAuthors, totalReviewers, totalCategories: totalCats,
    totalAffiliates, activeAffiliates,
    totalSubscribers, activeSubscribers,
    totalCampaigns, sentCampaigns, draftCampaigns, scheduledCampaigns,
  };
}

export default function AdminDashboard() {
  const auth          = useAuth();
  const [counts, setCounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [countError, setCountError] = useState(null);
  const [seeding, setSeeding]       = useState(false);
  const [seedResult, setSeedResult] = useState(null);
  const [seedError, setSeedError]   = useState(null);
  const [seedingPosts, setSeedingPosts]       = useState(false);
  const [seedPostsResult, setSeedPostsResult] = useState(null);
  const [seedPostsError, setSeedPostsError]   = useState(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) { setLoading(false); return; }
    fetchCounts()
      .then(data => { setCounts(data); setLoading(false); })
      .catch(err  => { setCountError(err.message); setLoading(false); });
  }, []);

  async function handleSeed() {
    if (!window.confirm('Migrate static tool data into Supabase? Existing slugs will be skipped.')) return;
    setSeeding(true); setSeedResult(null); setSeedError(null);
    try {
      const client = getSupabaseClient();
      const { data: sessionData } = await client.auth.getSession();
      const token = sessionData?.session?.access_token;
      const res   = await fetch('/api/admin/tools/seed', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const body  = await res.json();
      if (!res.ok) { setSeedError(body.error); setSeeding(false); return; }
      setSeedResult(`Seeded ${body.data.created} tools. Skipped ${body.data.skipped} (already existed).`);
      fetchCounts().then(setCounts).catch(() => {});
    } catch (err) {
      setSeedError(err.message);
    }
    setSeeding(false);
  }

  async function handleSeedPosts() {
    if (!window.confirm('Migrate the 24 static blog articles into Supabase? Existing slugs will be skipped.')) return;
    setSeedingPosts(true); setSeedPostsResult(null); setSeedPostsError(null);
    try {
      const client = getSupabaseClient();
      const { data: sessionData } = await client.auth.getSession();
      const token = sessionData?.session?.access_token;
      const res   = await fetch('/api/admin/posts/seed', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const body  = await res.json();
      if (!res.ok) { setSeedPostsError(body.error); setSeedingPosts(false); return; }
      setSeedPostsResult(`Seeded ${body.data.created} articles. Skipped ${body.data.skipped} (already existed).`);
      fetchCounts().then(setCounts).catch(() => {});
    } catch (err) {
      setSeedPostsError(err.message);
    }
    setSeedingPosts(false);
  }

  const n = (key) => loading ? '—' : String(counts?.[key] ?? 0);
  const greeting = auth.user?.email ? `Welcome, ${auth.user.email.split('@')[0]}` : 'Dashboard';

  return (
    <AdminLayout title={greeting}>
      <ErrorBanner message={countError} />

      <p style={{ fontSize: 11, fontWeight: 700, color: '#6b82a8', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>AI Tools</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
        <StatCard label="Total Tools"     value={n('totalTools')}     accent="#14FFF4" />
        <StatCard label="Published"       value={n('publishedTools')} accent="#00d084" />
        <StatCard label="Drafts"          value={n('draftTools')}     accent="#9fb3d4" />
        <StatCard label="Featured"        value={n('featuredTools')}  accent="#ffc147" />
      </div>

      <p style={{ fontSize: 11, fontWeight: 700, color: '#6b82a8', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>Content</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
        <StatCard label="Total Posts"     value={n('totalPosts')}     accent="#14FFF4" />
        <StatCard label="Published Posts" value={n('publishedPosts')} accent="#00d084" />
        <StatCard label="Draft Posts"     value={n('draftPosts')}     accent="#9fb3d4" />
        <StatCard label="Categories"      value={n('totalCategories')}accent="#14FFF4" />
      </div>

      <p style={{ fontSize: 11, fontWeight: 700, color: '#6b82a8', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>E-E-A-T</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
        <StatCard label="Authors"   value={n('totalAuthors')}   accent="#14FFF4" />
        <StatCard label="Reviewers" value={n('totalReviewers')} accent="#14FFF4" />
      </div>

      <p style={{ fontSize: 11, fontWeight: 700, color: '#6b82a8', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>Monetisation</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 28 }}>
        <StatCard label="Affiliate Links" value={n('totalAffiliates')}  accent="#14FFF4" />
        <StatCard label="Active"          value={n('activeAffiliates')} accent="#00d084" />
      </div>

      <p style={{ fontSize: 11, fontWeight: 700, color: '#6b82a8', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>Marketing</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 28 }}>
        <StatCard label="Subscribers"   value={n('totalSubscribers')}   accent="#14FFF4" />
        <StatCard label="Active Subs"   value={n('activeSubscribers')}  accent="#00d084" />
        <StatCard label="Campaigns"     value={n('totalCampaigns')}     accent="#14FFF4" />
        <StatCard label="Sent"          value={n('sentCampaigns')}      accent="#00d084" />
        <StatCard label="Drafts"        value={n('draftCampaigns')}     accent="#9fb3d4" />
        <StatCard label="Scheduled"     value={n('scheduledCampaigns')} accent="#ffc147" />
      </div>

      <AdminCard style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 14, fontWeight: 700, marginBottom: 14, color: '#e8f0ff' }}>
          Quick actions
        </h2>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { href: '/admin/tools/new',       label: '+ New tool' },
            { href: '/admin/tools',           label: 'Manage tools' },
            { href: '/admin/posts/new',       label: '+ New post' },
            { href: '/admin/posts',           label: 'Manage posts' },
            { href: '/admin/categories',      label: 'Categories' },
            { href: '/admin/authors',         label: 'Authors' },
            { href: '/admin/affiliates',                  label: '🔗 Affiliates' },
            { href: '/admin/newsletter/campaigns',        label: '📨 Campaigns' },
            { href: '/admin/newsletter/campaigns/new',    label: '+ New Campaign' },
            { href: '/admin/newsletter/templates',        label: '✉️ Templates' },
            { href: '/admin/newsletter/subscribers',      label: '👥 Subscribers' },
            { href: '/admin/homepage',        label: '🏠 Homepage' },
            { href: '/admin/navigation',      label: '🔗 Navigation' },
            { href: '/admin/announcements',   label: '📣 Announcements' },
            { href: '/admin/site-settings',   label: '🌐 Site Settings' },
          ].map(l => (
            <Link key={l.href} href={l.href} style={{
              display: 'inline-block',
              background: 'rgba(20,255,244,0.06)', border: '1px solid rgba(20,255,244,0.2)',
              color: '#14FFF4', borderRadius: 8, padding: '8px 14px',
              fontSize: 13, fontWeight: 600, textDecoration: 'none',
            }}>
              {l.label}
            </Link>
          ))}
        </div>
      </AdminCard>

      {isSupabaseConfigured() && auth.isAdmin && (
        <AdminCard style={{ borderColor: 'rgba(255,193,71,0.3)' }}>
          <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 14, fontWeight: 700, color: '#ffc147', marginBottom: 8 }}>
            🔄 Seed Tools from Static Data
          </h3>
          <p style={{ color: '#9fb3d4', fontSize: 13, lineHeight: 1.6, marginBottom: 14 }}>
            One-time migration — copies the static <code>data/index.js</code> tools into Supabase.
            Existing slugs are skipped so it&apos;s safe to run again.
          </p>
          {seedError  && <ErrorBanner message={seedError} />}
          {seedResult && (
            <div style={{ background: 'rgba(0,208,132,0.1)', border: '1px solid rgba(0,208,132,0.3)', borderRadius: 8, padding: '10px 14px', color: '#00d084', fontSize: 13, marginBottom: 12 }}>
              ✓ {seedResult}
            </div>
          )}
          <Button onClick={handleSeed} disabled={seeding} variant="secondary">
            {seeding ? 'Seeding…' : 'Seed Supabase from static data'}
          </Button>
        </AdminCard>
      )}
      {isSupabaseConfigured() && auth.isAdmin && (
        <AdminCard style={{ borderColor: 'rgba(255,193,71,0.3)', marginTop: 20 }}>
          <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 14, fontWeight: 700, color: '#ffc147', marginBottom: 8 }}>
            📝 Seed Blog Articles from Static Data
          </h3>
          <p style={{ color: '#9fb3d4', fontSize: 13, lineHeight: 1.6, marginBottom: 14 }}>
            One-time migration — copies the 24 static blog articles from <code>data/index.js</code> into Supabase.
            Existing slugs are skipped so it&apos;s safe to run again.
          </p>
          {seedPostsError  && <ErrorBanner message={seedPostsError} />}
          {seedPostsResult && (
            <div style={{ background: 'rgba(0,208,132,0.1)', border: '1px solid rgba(0,208,132,0.3)', borderRadius: 8, padding: '10px 14px', color: '#00d084', fontSize: 13, marginBottom: 12 }}>
              ✓ {seedPostsResult}
            </div>
          )}
          <Button onClick={handleSeedPosts} disabled={seedingPosts} variant="secondary">
            {seedingPosts ? 'Seeding…' : 'Seed Supabase with blog articles'}
          </Button>
        </AdminCard>
      )}
    </AdminLayout>
  );
                                                     }
