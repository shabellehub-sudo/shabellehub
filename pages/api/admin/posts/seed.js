// pages/api/admin/posts/seed.js
// POST — Admin-only. Migrates static data/index.js blogPosts into Firestore.
// Uses slug as dedup key — safe to call multiple times.

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
    let created   = 0;
    let skipped   = 0;

    for (const post of staticPosts) {
      const snap = await col.where('slug', '==', post.slug).limit(1).get();
      if (!snap.empty) { skipped++; continue; }

      const publishedAt = post.date ? new Date(post.date) : now;

      await col.add({
        title:            post.title           || '',
        slug:             post.slug             || '',
        status:           'published',
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
        published_at:     publishedAt,
        created_at:       now,
        updated_at:       now,
        created_by:       auth.uid || null,
        updated_by:       auth.uid || null,
      });
      created++;
    }

    return res.status(200).json({
      data: { created, skipped, total: staticPosts.length },
      error: null,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
