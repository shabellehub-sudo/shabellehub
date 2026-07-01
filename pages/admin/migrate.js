// pages/admin/migrate.js
// One-click migration: seeds Tools + Categories from data/index.js into Firestore

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/cms/useAuth';

const categories = [
  { name: "Chatbots", icon: "💬", description: "General-purpose AI chat assistants for everyday questions, writing, brainstorming, and research." },
  { name: "AI Writing", icon: "✍️", description: "AI tools focused on producing marketing copy, blog content, and short-form writing at scale." },
  { name: "Coding", icon: "💻", description: "AI-powered code editors, assistants, and app builders." },
  { name: "Image Generation", icon: "🎨", description: "AI models that turn text prompts into original artwork and images." },
  { name: "Video Generation", icon: "🎬", description: "Tools that generate video clips and talking AI avatars from text prompts." },
  { name: "Research", icon: "🔬", description: "AI search and research tools that answer questions with cited sources." },
  { name: "Audio", icon: "🎙️", description: "Text-to-speech, voice-cloning, music generation, and meeting-transcription tools." },
  { name: "Productivity", icon: "⚡", description: "AI features integrated into productivity and note-taking tools." },
  { name: "Marketing", icon: "📈", description: "AI platforms built specifically for marketing teams." },
  { name: "Automation", icon: "🔁", description: "Visual workflow-automation platforms that connect your apps together." },
  { name: "AI Agents", icon: "🤖", description: "Autonomous AI agents that can plan and execute multi-step tasks." },
  { name: "Design", icon: "🖌️", description: "AI-powered design platforms for generating and editing images and visuals." },
  { name: "Presentation", icon: "📊", description: "AI tools that turn a prompt into a fully designed slide deck." },
  { name: "Data Analysis", icon: "📉", description: "AI tools that analyze spreadsheets and datasets through plain-language chat." }
];

export default function MigratePage() {
  const auth = useAuth();
  const [status, setStatus]   = useState('idle'); // idle | running | done | error
  const [log, setLog]         = useState([]);
  const [toolsResult, setToolsResult]   = useState(null);
  const [catResult, setCatResult]       = useState({ done: 0, total: categories.length });
  const [postsResult, setPostsResult]   = useState(null);
  const [resyncResult, setResyncResult] = useState(null);
  const [debugResult, setDebugResult] = useState(null);

  function addLog(msg) {
    setLog(prev => [...prev, msg]);
  }

  async function runMigration() {
    if (!auth.user) { addLog('❌ Not logged in.'); return; }
    setStatus('running');
    setLog([]);

    try {
      const token = await auth.user.getIdToken();

      // ── 1. Tools ──────────────────────────────────────────────────────────
      addLog('⏳ Tools migrate billaabmaya (64 tools)...');
      const r1 = await fetch('/api/admin/tools/seed', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const d1 = await r1.json();
      if (!r1.ok) {
        addLog(`❌ Tools error: ${d1.error}`);
        setStatus('error');
        return;
      }
      setToolsResult(d1.data);
      addLog(`✅ Tools: ${d1.data.created} cusub, ${d1.data.skipped} horay u jiray`);

      // ── 2. Categories ─────────────────────────────────────────────────────
      addLog('⏳ Categories migrate billaabmaya (14 categories)...');
      let catDone = 0;
      for (const cat of categories) {
        const r = await fetch('/api/admin/cms/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(cat),
        });
        const d = await r.json();
        catDone++;
        setCatResult({ done: catDone, total: categories.length });
        if (r.ok) {
          addLog(`  ✅ ${cat.icon} ${cat.name}${d.skipped ? ' (horay u jiray)' : ''}`);
        } else {
          addLog(`  ❌ ${cat.name}: ${d.error}`);
        }
      }

      addLog('');
      addLog('🎉 MIGRATION DHAMMAATAY!');
      addLog('👉 CMS → Tools iyo Categories hadda waa shaqeynayaan.');
      setStatus('done');

    } catch (err) {
      addLog(`❌ Error: ${err.message}`);
      setStatus('error');
    }
  }

  async function runPostsMigration() {
    if (!auth.user) { addLog('❌ Not logged in.'); return; }
    setStatus('running');

    try {
      const token = await auth.user.getIdToken();

      addLog('⏳ Blog posts migrate billaabmaya (24 articles)...');
      const r = await fetch('/api/admin/posts/seed', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await r.json();
      if (!r.ok) {
        addLog(`❌ Posts error: ${d.error}`);
        setStatus('error');
        return;
      }
      setPostsResult(d.data);
      addLog(`✅ Posts: ${d.data.created} cusub, ${d.data.skipped} horay u jiray`);
      addLog('');
      addLog('🎉 POSTS MIGRATION DHAMMAATAY!');
      addLog('👉 /blog hadda waa muuqan doonaa articles-ka.');
      setStatus('done');

    } catch (err) {
      addLog(`❌ Error: ${err.message}`);
      setStatus('error');
    }
  }

  async function runPostsResync() {
    if (!auth.user) { addLog('❌ Not logged in.'); return; }
    setStatus('running');

    try {
      const token = await auth.user.getIdToken();

      addLog('⏳ Blog posts resync billaabmaya (dib-u-qorista 24 articles)...');
      const r = await fetch('/api/admin/posts/resync', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await r.json();
      if (!r.ok) {
        addLog(`❌ Resync error: ${d.error}`);
        setStatus('error');
        return;
      }
      setResyncResult(d.data);
      addLog(`✅ Resync: ${d.data.updated} cusboonaysiiyay, ${d.data.notFound} lama helin`);
      addLog('');
      addLog('🎉 RESYNC DHAMMAATAY!');
      addLog('👉 Isbeddelladii koodhka hadda waa ka muuqdaan /blog.');
      setStatus('done');

    } catch (err) {
      addLog(`❌ Error: ${err.message}`);
      setStatus('error');
    }
  }

  async function runDebug() {
    if (!auth.user) { addLog('❌ Not logged in.'); return; }
    try {
      const token = await auth.user.getIdToken();
      const r = await fetch('/api/admin/posts/debug', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await r.json();
      setDebugResult(d);
      addLog('🔍 DEBUG RESULT:');
      addLog(JSON.stringify(d, null, 2));
    } catch (err) {
      addLog(`❌ Debug error: ${err.message}`);
    }
  }

  const s = {
    page: {
      minHeight: '100vh', background: '#080d1a', color: '#e8f0ff',
      fontFamily: 'Inter, sans-serif', padding: 24,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    },
    card: {
      width: '100%', maxWidth: 480, background: '#0f1829',
      border: '1px solid #1a2d4a', borderRadius: 16, padding: 28,
    },
    h1: { fontFamily: 'Space Grotesk, sans-serif', fontSize: 22, fontWeight: 800, marginBottom: 6, color: '#e8f0ff' },
    sub: { fontSize: 13, color: '#6b82a8', marginBottom: 24 },
    btn: {
      width: '100%', padding: '14px 0', borderRadius: 10, border: 'none',
      fontWeight: 800, fontSize: 15, cursor: status === 'running' ? 'not-allowed' : 'pointer',
      fontFamily: 'Space Grotesk, sans-serif',
      background: status === 'done' ? '#00c896' : status === 'error' ? '#ff4d6d' : status === 'running' ? 'rgba(20,255,244,0.4)' : '#14FFF4',
      color: '#080d1a',
    },
    progress: { marginTop: 20, background: '#080d1a', borderRadius: 10, padding: 16, fontSize: 13 },
    logItem: { padding: '3px 0', borderBottom: '1px solid #0f1829', color: '#9fb3d4', fontFamily: 'monospace', fontSize: 12 },
    stat: { display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 },
  };

  if (auth.status === 'loading') return <div style={s.page}><p>Loading...</p></div>;
  if (auth.status !== 'authenticated') return <div style={s.page}><p style={{ color: '#ff8080' }}>❌ Login ugu hore: /admin/login</p></div>;

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.h1}>🚀 Migration Tool</h1>
        <p style={s.sub}>64 Tools + 14 Categories → Firestore. Hal mar ku orod.</p>

        <div style={{ ...s.stat }}>
          <span style={{ color: '#6b82a8' }}>Tools</span>
          <span>{toolsResult ? `✅ ${toolsResult.created} cusub` : '—'}</span>
        </div>
        <div style={{ ...s.stat }}>
          <span style={{ color: '#6b82a8' }}>Categories</span>
          <span>{status === 'idle' ? '—' : `${catResult.done} / ${catResult.total}`}</span>
        </div>
        <div style={{ ...s.stat }}>
          <span style={{ color: '#6b82a8' }}>Blog Posts</span>
          <span>{postsResult ? `✅ ${postsResult.created} cusub` : '—'}</span>
        </div>
        <div style={{ ...s.stat }}>
          <span style={{ color: '#6b82a8' }}>Posts Resync</span>
          <span>{resyncResult ? `✅ ${resyncResult.updated} cusboonaysiiyay` : '—'}</span>
        </div>

        <button
          style={s.btn}
          onClick={runMigration}
          disabled={status === 'running' || status === 'done'}
        >
          {status === 'idle'    && '▶ Migration Bilaab (Tools + Categories)'}
          {status === 'running' && '⏳ Socda...'}
          {status === 'done'    && '✅ Dhammaatay!'}
          {status === 'error'   && '❌ Khalad — Dib u Isku Day'}
        </button>

        <button
          style={{ ...s.btn, marginTop: 12, background: status === 'running' ? 'rgba(0,200,150,0.4)' : '#00c896' }}
          onClick={runPostsMigration}
          disabled={status === 'running'}
        >
          {status === 'running' ? '⏳ Socda...' : '📝 Blog Posts Migrate Garee (24 Articles)'}
        </button>

        <button
          style={{ ...s.btn, marginTop: 12, background: status === 'running' ? 'rgba(255,170,0,0.4)' : '#ffaa00' }}
          onClick={runPostsResync}
          disabled={status === 'running'}
        >
          {status === 'running' ? '⏳ Socda...' : '🔄 Posts Resync Garee (Cusboonaysii Content-ka)'}
        </button>

        <button
          style={{ ...s.btn, marginTop: 12, background: '#9d4edd' }}
          onClick={runDebug}
        >
          🔍 Debug Posts Data (Eeg Raw Firestore)
        </button>

        {log.length > 0 && (
          <div style={s.progress}>
            {log.map((l, i) => <div key={i} style={s.logItem}>{l}</div>)}
          </div>
        )}

        {status === 'done' && (
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <Link href="/admin/tools" style={{ color: '#14FFF4', fontSize: 13 }}>→ CMS Tools fur</Link>
            {'  |  '}
            <Link href="/admin/categories" style={{ color: '#14FFF4', fontSize: 13 }}>→ CMS Categories fur</Link>
            {'  |  '}
            <Link href="/blog" style={{ color: '#14FFF4', fontSize: 13 }}>→ Blog fur</Link>
          </div>
        )}
      </div>
    </div>
  );
}
