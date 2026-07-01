// pages/api/admin/tools/seed.js
// POST — Admin-only. Migrates static data/index.js tools into Firestore.
// Uses slug as dedup key — safe to call multiple times.

import { requireAdmin } from '../../../../lib/supabaseAdmin';
import { tools as staticTools } from '../../../../data';

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
    const col     = db.collection('tools');
    const now     = new Date();
    let created   = 0;
    let skipped   = 0;

    for (const tool of staticTools) {
      const snap = await col.where('slug', '==', tool.slug).limit(1).get();
      if (!snap.empty) { skipped++; continue; }

      await col.add({
        name:              tool.name,
        slug:              tool.slug,
        status:            'published',
        category:          tool.category    || '',
        badge:             tool.badge       || null,
        rating:            tool.rating      || 0,
        price:             tool.price       || '',
        priceTier:         tool.priceTier   || 'freemium',
        desc:              tool.desc        || '',
        longDesc:          tool.longDesc    || '',
        website:           tool.website     || '',
        affiliateLink:     tool.affiliateLink || null,
        logo_url:          tool.logo_url    || null,
        logo_storage_path: null,
        screenshots:       [],
        features:          tool.features    || [],
        pros:              tool.pros        || [],
        cons:              tool.cons        || [],
        tags:              tool.tags        || [],
        useCases:          tool.useCases    || [],
        alternatives:      tool.alternatives || [],
        featured:          tool.featured    || false,
        hot:               tool.hot         || false,
        seoTitle:          tool.seoTitle    || tool.name || '',
        seoDescription:    tool.seoDesc     || tool.desc || '',
        seoKeywords:       tool.seoKeywords || [],
        canonical_url:     null,
        published_at:      now,
        created_at:        now,
        updated_at:        now,
        created_by:        auth.uid,
        updated_by:        auth.uid,
      });
      created++;
    }

    return res.status(200).json({
      data: { created, skipped, total: staticTools.length },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
