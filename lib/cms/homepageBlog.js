// lib/cms/homepageBlog.js
// Server-side helper — call from pages/index.js getStaticProps.
// Fetches featured + recent posts in one shot for the homepage widget.

import { listFeaturedPosts, listRecentPosts } from './posts';

export async function getHomepageBlogProps() {
  try {
    const [featuredRes, recentRes] = await Promise.all([
      listFeaturedPosts({ limit: 1 }),
      listRecentPosts({ limit: 3 }),
    ]);

    // Remove the featured post from the recent list if it appears there
    const featuredIds = new Set((featuredRes.data || []).map(p => p.id));
    const recentFiltered = (recentRes.data || []).filter(p => !featuredIds.has(p.id));

    return {
      featuredPosts: featuredRes.data || [],
      recentPosts:   recentFiltered,
    };
  } catch {
    return { featuredPosts: [], recentPosts: [] };
  }
}
