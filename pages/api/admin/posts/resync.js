// pages/api/admin/posts/resync.js
// POST — Admin-only. Overwrites existing Firestore posts with the latest
// content from data/index.js, matched by slug. Does NOT create new posts
// (use seed.js for that) and does NOT touch created_at — only refreshes
// content and related metadata fields, then bumps updated_at.

import { requireAdmin } from '../../../../lib/supabaseAdmin';
import { blogPosts as staticPosts } from '../../../../data';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await requireAdmin(req);
  if (auth.error) {
    return res.status(auth.error.includes('configured') ? 503 : 401).json({ error: auth.error });
  }

  try {
    const db      = auth.db;
    const col     = db.collection('posts');
    const now     = new Date();
    let updated   = 0;
    let notFound  = 0;

    for (const post of staticPosts) {
      const snap = await col.where('slug', '==', post.slug).limit(1).get();
      if (snap.empty) { notFound++; continue; }

      const docRef = snap.docs[0].ref;

      await docRef.update({
        title:            post.title           || '',
        excerpt:          post.excerpt          || '',
        content:          post.content          || '',
        category:         post.category         || '',
        author:           post.author           || 'Shabelle Hub Team',
        readTime:         post.readTime         || '',
        tags:             post.tags             || [],
        seoTitle:         post.seoTitle         || post.title   || '',
        seoDescription:   post.seoDesc          || post.excerpt || '',
        seoKeywords:      post.seoKeywords      || [],
        relatedTools:     post.relatedTools     || [],
        relatedArticles:  post.relatedArticles  || [],
        faqs:             post.faqs             || [],
        featured:         post.featured         || false,
        updated_at:       now,
        updated_by:       auth.uid || null,
      });
      updated++;
    }

    return res.status(200).json({
      data: { updated, notFound, total: staticPosts.length },
      error: null,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
