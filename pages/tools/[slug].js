import { useState, useEffect } from 'react';
import { NextSeo } from 'next-seo';
import Link from 'next/link';
import { tools as staticTools } from '../../data';
import { getToolSEO, getToolStructuredData } from '../../lib/seo';
import { getToolMeta } from '../../data/eeat-meta';
import { getAuthor, getReviewer } from '../../data/team';
import { openAffiliateLink, buildAffiliateUrl } from '../../lib/affiliate';
import { StarRating, Badge } from '../../components/ui';
import { TrustBlock } from '../../components/eeat';
import { AffiliateDisclosure, AdvertisingNotice, ContentUpdateNotice } from '../../components/compliance';
import AdSlot from '../../components/AdSlot';
import SmartStack from '../../components/tools/SmartStack';
import { getAffiliateByToolSlug } from '../../lib/cms/affiliates';
import { listTools, getToolBySlug } from '../../lib/cms/tools';
import { getComplementaryStack } from '../../lib/stackMatcher';
import { generateToolFaqs } from '../../lib/faq-generator';
import { listAllChanges } from '../../lib/cms/monitoring';
import { isAlternativesPageEligible } from '../../lib/alternatives';
import ToolFAQ from '../../components/tools/ToolFAQ';

export async function getStaticPaths() {
  let paths = staticTools.map(t => ({ params: { slug: t.slug } }));

  try {
    const res = await listTools({ status: 'published', lim: 1000 });
    if (!res.error && res.data?.length > 0) {
      paths = res.data.map(t => ({ params: { slug: t.slug } }));
    }
  } catch (err) {
    console.warn('[getStaticPaths] Supabase fetch failed, using static fallback:', err);
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
    if (!toolRes.error && toolRes.data) tool = toolRes.data;
  } catch (_) { /* fall through to static lookup */ }

  if (!tool) {
    tool = staticTools.find(t => t.slug === params.slug) || null;
  }

  if (!tool) return { notFound: true };

  let allTools = staticTools;
  try {
    const toolsRes = await listTools({ status: 'published', lim: 200 });
    if (!toolsRes.error && toolsRes.data?.length > 0) allTools = toolsRes.data;
  } catch (_) { /* keep staticTools fallback */ }

  let related = [];
  if (tool.alternatives && tool.alternatives.length > 0) {
    related = tool.alternatives
      .map(slug => allTools.find(t => t.slug === slug))
      .filter(Boolean)
      .slice(0, 3);
  }
  if (related.length === 0) {
    related = allTools
      .filter(t => t.category === tool.category && t.id !== tool.id)
      .slice(0, 3);
  }

  let affiliateLink = null;
  try {
    const { data } = await getAffiliateByToolSlug(params.slug);
    affiliateLink = data ?? null;
  } catch (_) { /* non-fatal — falls back to static data */ }

  let stack = { primary: tool, asset: null, distribution: null };
  try {
    stack = getComplementaryStack(tool, allTools);
  } catch (err) {
    console.warn(`[stackMatcher] ${err.message}`);
  }

  let recentUpdate = null;
  try {
    const shippedRes = await listAllChanges({ status: 'shipped', lim: 200 });
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const forThisTool = (shippedRes.data || [])
      .filter((c) => c.tool_slug === params.slug && c.shipped_at && new Date(c.shipped_at).getTime() > cutoff)
      .sort((a, b) => new Date(b.shipped_at) - new Date(a.shipped_at));
    if (forThisTool.length > 0) {
      const c = forThisTool[0];
      recentUpdate = {
        category: c.change_category,
        oldValue: c.old_value,
        newValue: c.confirmed_value || c.new_value,
        shippedAt: c.shipped_at,
      };
    }
  } catch (err) {
    console.warn(`[recentUpdate] ${err.message}`);
  }

  const hasAlternativesPage = isAlternativesPageEligible(tool);

  return {
    props: { tool, related, affiliateLink, stack, allTools, recentUpdate, hasAlternativesPage },
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
