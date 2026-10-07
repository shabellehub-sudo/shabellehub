// lib/cms/homepageBlog.js
// Server-side helper. Uses the service-role published-post reader so the
// homepage matches the canonical Blog data source (published, newest first).

import { adminListPublishedPosts } from './postsAdmin';

function serializeHomepagePost(post) {
  return {
    id: post?.id ?? null,
    slug: post?.slug || '',
    title: post?.title || '',
    category_name: post?.category_name || '',
    excerpt: post?.excerpt || '',
    published_at: post?.published_at ?? null,
    updated_at: post?.updated_at ?? null,
    tags: Array.isArray(post?.tags) ? post.tags : [],
    author_name: post?.author_name || '',
    featured: Boolean(post?.featured),
  };
}

export async function getHomepageBlogProps() {
  try {
    const result = await adminListPublishedPosts({ limit: 20 });
    if (result.error) return { featuredPosts: [], recentPosts: [] };

    const posts = (result.data || []).map(serializeHomepagePost);
    const featured = posts.find(p => p.featured) || null;
    const featuredPosts = featured ? [featured] : [];
    const recentPosts = posts.filter(p => p.id !== featured?.id).slice(0, 3);

    return { featuredPosts, recentPosts };
  } catch {
    return { featuredPosts: [], recentPosts: [] };
  }
}
