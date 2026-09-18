import { tools as staticTools } from '../../data';
import { listTools, getToolBySlug } from '../../lib/cms/tools';

export async function getStaticPaths() {
  let paths = (staticTools || []).map(t => ({ params: { slug: t.slug } }));

  try {
    const res = await listTools({ status: 'published', lim: 1000 });
    if (!res?.error && Array.isArray(res?.data) && res.data.length > 0) {
      paths = res.data.map(t => ({ params: { slug: t.slug } }));
    }
  } catch (err) {
    console.warn('[getStaticPaths] Supabase fetch failed, using fallback:', err);
  }

  return {
    paths,
    fallback: 'blocking',
  };
}

export async function getStaticProps({ params }) {
  let tool = null;
  
  try {
    const toolRes = await getToolBySlug(params.slug);
    if (!toolRes?.error && toolRes?.data) tool = toolRes.data;
  } catch (_) { /* fallback to static */ }

  if (!tool) {
    tool = (staticTools || []).find(t => t?.slug === params.slug) || null;
  }

  if (!tool) return { notFound: true };

  let allTools = Array.isArray(staticTools) ? staticTools : [];
  try {
    const toolsRes = await listTools({ status: 'published', lim: 200 });
    if (!toolsRes?.error && Array.isArray(toolsRes?.data) && toolsRes.data.length > 0) {
      allTools = toolsRes.data;
    }
  } catch (_) { /* keep fallback */ }

  let related = [];
  if (Array.isArray(tool.alternatives) && tool.alternatives.length > 0) {
    related = tool.alternatives
      .map(slug => allTools.find(t => t?.slug === slug))
      .filter(Boolean)
      .slice(0, 3);
  }
  if (related.length === 0) {
    related = allTools
      .filter(t => t && t.category === tool.category && t.id !== tool.id)
      .slice(0, 3);
  }

  return {
    props: { tool, related },
    revalidate: 3600,
  };
}

export default function ToolPage({ tool }) {
  if (!tool) return null;
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">{tool.name}</h1>
      <p className="mt-2 text-gray-600">{tool.description}</p>
    </div>
  );
}
