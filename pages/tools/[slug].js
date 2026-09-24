import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { tools as staticTools } from '../../data';
import { listTools } from '../../lib/cms/tools';
import { getToolChangeHistory } from '../../lib/changes';

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function normalizeTool(row) {
  if (!row) return null;

  const doc = row.doc || {};

  return {
    ...doc,
    ...row,
  };
}

function asArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string' && value.trim()) {
    return value
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
  }
  return [];
}

function unique(values) {
  return [...new Set(values.filter(Boolean).map(String))];
}

function safeUrl(value) {
  if (!value || typeof value !== 'string') return null;

  try {
    const url = new URL(value);

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

function safeJsonLd(value) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

function normalizeFaq(tool) {
  const source =
    tool?.faq ??
    tool?.faqs ??
    tool?.faqItems ??
    tool?.frequentlyAskedQuestions ??
    [];

  if (!Array.isArray(source)) return [];

  return source
    .map((item) => {
      if (!item) return null;

      if (typeof item === 'string') {
        const separator = item.indexOf('?');

        if (separator === -1) return null;

        return {
          question: item.slice(0, separator + 1).trim(),
          answer: item.slice(separator + 1).trim(),
        };
      }

      const question =
        item.question ||
        item.q ||
        item.title ||
        item.name;

      const answer =
        item.answer ||
        item.a ||
        item.content ||
        item.description;

      if (!question || !answer) return null;

      return {
        question: String(question),
        answer: String(answer),
      };
    })
    .filter(Boolean);
}

function ReviewContent({ value }) {
  if (!value) return null;

  const text = String(value).replace(/\r\n/g, '\n').trim();

  const blocks = text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <div className="sh-review-content">
      {blocks.map((block, index) => {
        if (block.startsWith('### ')) {
          return (
            <h3 key={index}>
              {block.replace(/^###\s+/, '')}
            </h3>
          );
        }

        if (block.startsWith('## ')) {
          return (
            <h2 key={index}>
              {block.replace(/^##\s+/, '')}
            </h2>
          );
        }

        if (block.startsWith('# ')) {
          return (
            <h2 key={index}>
              {block.replace(/^#\s+/, '')}
            </h2>
          );
        }

        const lines = block
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean);

        const isList = lines.every((line) =>
          /^[-*•]\s+/.test(line)
        );

        if (isList) {
          return (
            <ul key={index}>
              {lines.map((line, itemIndex) => (
                <li key={itemIndex}>
                  {line.replace(/^[-*•]\s+/, '')}
                </li>
              ))}
            </ul>
          );
        }

        return <p key={index}>{block}</p>;
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Smart Stack Matcher                                                        */
/* -------------------------------------------------------------------------- */

function getToolSignals(tool) {
  const tags = asArray(tool.tags);
  const integrations = asArray(
    tool.integrations ||
      tool.integration ||
      tool.supportedIntegrations
  );

  const stack = asArray(
    tool.stack ||
      tool.techStack ||
      tool.compatibility ||
      tool.platforms
  );

  const useCases = asArray(tool.useCases);

  return {
    tags: unique(tags),
    integrations: unique(integrations),
    stack: unique(stack),
    useCases: unique(useCases),
  };
}

function normalizeSignal(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function signalMatches(source, selected) {
  const normalizedSource = source.map(normalizeSignal);

  return selected.filter((item) => {
    const normalized = normalizeSignal(item);

    return normalizedSource.some(
      (sourceItem) =>
        sourceItem === normalized ||
        sourceItem.includes(normalized) ||
        normalized.includes(sourceItem)
    );
  });
}

function SmartStackMatcher({ tool }) {
  const [role, setRole] = React.useState('');
  const [stack, setStack] = React.useState([]);
  const [needs, setNeeds] = React.useState([]);
  const [result, setResult] = React.useState(null);

  const signals = getToolSignals(tool);

  const roles = unique([
    ...asArray(tool.roles),
    ...asArray(tool.targetAudience),
    ...asArray(tool.audiences),
    ...asArray(tool.useCases),
  ]).slice(0, 12);

  const availableStack = unique([
    ...signals.stack,
    ...signals.integrations,
    ...asArray(tool.platforms),
  ]).slice(0, 18);

  const availableNeeds = unique([
    ...signals.useCases,
    ...signals.tags,
  ]).slice(0, 18);

  function toggleValue(list, setList, value) {
    setList((current) =>
      current.includes(value)
        ? current.filter((x) => x !== value)
        : [...current, value]
    );
  }

  function calculateMatch() {
    const selectedStack = stack;
    const selectedNeeds = needs;

    const stackMatches = signalMatches(
      [...signals.stack, ...signals.integrations],
      selectedStack
    );

    const needMatches = signalMatches(
      [...signals.useCases, ...signals.tags],
      selectedNeeds
    );

    const roleMatches = role
      ? signalMatches(
          [
            ...signals.useCases,
            ...signals.tags,
            ...roles,
          ],
          [role]
        )
      : [];

    const totalSelected =
      selectedStack.length +
      selectedNeeds.length +
      (role ? 1 : 0);

    const totalMatches =
      stackMatches.length +
      needMatches.length +
      roleMatches.length;

    let score = totalSelected
      ? Math.round((totalMatches / totalSelected) * 100)
      : 0;

    score = Math.max(0, Math.min(100, score));

    let strength = 'Possible Match';

    if (score >= 80) {
      strength = 'Strong Match';
    } else if (score >= 55) {
      strength = 'Good Match';
    } else if (score < 35) {
      strength = 'Limited Match';
    }

    const reasons = [
      ...stackMatches.map(
        (item) => `Works with ${item}`
      ),
      ...needMatches.map(
        (item) => `Useful for ${item}`
      ),
      ...roleMatches.map(
        (item) => `Relevant to ${item}`
      ),
    ].slice(0, 5);

    setResult({
      score,
      strength,
      reasons,
    });
  }

  return (
    <section className="sh-section sh-matcher" id="smart-stack-matcher">
      <div className="sh-section-heading">
        <div>
          <span className="sh-eyebrow">SMART TOOL DISCOVERY</span>
          <h2>Smart Stack Matcher</h2>
          <p>
            Check how well this tool fits your workflow, stack and
            use case.
          </p>
        </div>
      </div>

      <div className="sh-matcher-grid">
        <div className="sh-matcher-panel">
          {roles.length > 0 && (
            <div className="sh-field">
              <label htmlFor="matcher-role">Your role</label>

              <select
                id="matcher-role"
                value={role}
                onChange={(event) => setRole(event.target.value)}
              >
                <option value="">Choose your role</option>

                {roles.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          )}

          {availableStack.length > 0 && (
            <div className="sh-field">
              <label>Your stack</label>

              <div className="sh-chip-list">
                {availableStack.map((item) => {
                  const active = stack.includes(item);

                  return (
                    <button
                      type="button"
                      key={item}
                      className={`sh-chip ${
                        active ? 'is-active' : ''
                      }`}
                      onClick={() =>
                        toggleValue(stack, setStack, item)
                      }
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {availableNeeds.length > 0 && (
            <div className="sh-field">
              <label>What do you need it for?</label>

              <div className="sh-chip-list">
                {availableNeeds.map((item) => {
                  const active = needs.includes(item);

                  return (
                    <button
                      type="button"
                      key={item}
                      className={`sh-chip ${
                        active ? 'is-active' : ''
                      }`}
                      onClick={() =>
                        toggleValue(needs, setNeeds, item)
                      }
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <button
            type="button"
            className="sh-primary-button"
            onClick={calculateMatch}
          >
            Check Compatibility
            <span>→</span>
          </button>
        </div>

        <div className="sh-match-result">
          {!result ? (
            <div className="sh-empty-match">
              <div className="sh-match-icon">✦</div>
              <h3>Find your compatibility</h3>
              <p>
                Select your role, stack or needs to see how this
                tool fits your workflow.
              </p>
            </div>
          ) : (
            <>
              <div className="sh-score">
                <strong>{result.score}%</strong>
                <span>compatibility</span>
              </div>

              <div className="sh-match-strength">
                {result.strength}
              </div>

              {result.reasons.length > 0 && (
                <ul className="sh-reasons">
                  {result.reasons.map((reason, index) => (
                    <li key={index}>
                      <span>✓</span>
                      {reason}
                    </li>
                  ))}
                </ul>
              )}

              {result.reasons.length === 0 && (
                <p className="sh-muted">
                  We don&apos;t have enough matching signals yet.
                  Consider checking the alternatives below.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* FAQ                                                                        */
/* -------------------------------------------------------------------------- */

function FAQSection({ faq }) {
  const [open, setOpen] = React.useState(0);

  if (!faq.length) return null;

  return (
    <section className="sh-section" id="faq">
      <div className="sh-section-heading">
        <div>
          <span className="sh-eyebrow">QUESTIONS</span>
          <h2>Frequently Asked Questions</h2>
          <p>
            Common questions about this AI tool, pricing and
            capabilities.
          </p>
        </div>
      </div>

      <div className="sh-faq">
        {faq.map((item, index) => {
          const isOpen = open === index;

          return (
            <div
              className={`sh-faq-item ${
                isOpen ? 'is-open' : ''
              }`}
              key={`${item.question}-${index}`}
            >
              <button
                type="button"
                className="sh-faq-question"
                aria-expanded={isOpen}
                onClick={() =>
                  setOpen(isOpen ? -1 : index)
                }
              >
                <span>{item.question}</span>
                <span
                  className="sh-faq-plus"
                  aria-hidden="true"
                >
                  {isOpen ? '−' : '+'}
                </span>
              </button>

              {isOpen && (
                <div className="sh-faq-answer">
                  <p>{item.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Related Cards                                                              */
/* -------------------------------------------------------------------------- */

function ToolCard({ tool }) {
  const logo =
    tool.logo ||
    tool.logoUrl ||
    tool.image ||
    tool.icon;

  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="sh-related-card"
    >
      <div className="sh-related-top">
        {logo ? (
          <img
            src={logo}
            alt=""
            className="sh-related-logo"
            loading="lazy"
          />
        ) : (
          <div className="sh-related-logo-placeholder">
            {String(tool.name || '?')
              .slice(0, 1)
              .toUpperCase()}
          </div>
        )}

        <div>
          <h3>{tool.name}</h3>
          {tool.category && (
            <span>{tool.category}</span>
          )}
        </div>
      </div>

      <p>{tool.desc || tool.description}</p>
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/* Data                                                                       */
/* -------------------------------------------------------------------------- */

export async function getStaticPaths() {
  try {
    const result = await listTools({
      status: 'published',
      lim: 1000,
    });

    if (
      !result?.error &&
      Array.isArray(result?.data)
    ) {
      return {
        paths: result.data
          .filter((tool) => tool?.slug)
          .map((tool) => ({
            params: {
              slug: tool.slug,
            },
          })),
        fallback: 'blocking',
      };
    }
  } catch (error) {
    console.warn(
      '[tools/[slug]] published path lookup failed:',
      error
    );
  }

  return {
    paths: (staticTools || [])
      .filter((tool) => tool?.slug)
      .map((tool) => ({
        params: {
          slug: tool.slug,
        },
      })),
    fallback: 'blocking',
  };
}

export async function getStaticProps({ params }) {
  const slug = String(params?.slug || '').trim();

  if (!slug) {
    return {
      notFound: true,
    };
  }

  let tool = null;
  let databaseSucceeded = false;

  try {
    const result = await listTools({
      status: 'published',
      lim: 1000,
    });

    if (!result?.error && Array.isArray(result?.data)) {
      databaseSucceeded = true;

      const match = result.data.find(
        (item) => item?.slug === slug
      );

      if (match) {
        tool = normalizeTool(match);
      }
    }
  } catch (error) {
    console.warn(
      '[tools/[slug]] tool lookup failed:',
      error
    );
  }

  if (!tool && !databaseSucceeded) {
    const staticMatch = (staticTools || []).find(
      (item) => item?.slug === slug
    );

    if (staticMatch) {
      tool = normalizeTool({
        ...staticMatch,
        doc: staticMatch,
      });
    }
  }

  if (!tool || (tool.status && tool.status !== 'published')) {
    return {
      notFound: true,
    };
  }

  let allTools = [];

  try {
    const result = await listTools({
      status: 'published',
      lim: 1000,
    });

    if (
      !result?.error &&
      Array.isArray(result?.data)
    ) {
      allTools = result.data
        .map(normalizeTool)
        .filter(
          (item) =>
            item?.slug &&
            (!item.status ||
              item.status === 'published')
        );
    }
  } catch (error) {
    console.warn(
      '[tools/[slug]] related tools lookup failed:',
      error
    );
  }

  const alternatives = asArray(tool.alternatives);

  let related = alternatives
    .map((slugValue) =>
      allTools.find(
        (item) => item?.slug === slugValue
      )
    )
    .filter(Boolean)
    .slice(0, 3);

  if (related.length === 0) {
    related = allTools
      .filter(
        (item) =>
          item &&
          item.slug !== tool.slug &&
          item.category === tool.category
      )
      .slice(0, 3);
  }

  const changeHistory = await getToolChangeHistory(tool.slug);

  return {
    props: {
      tool,
      related,
      changeHistory,
    },

    revalidate: 3600,
  };
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function ToolPage({
  tool,
  related = [],
  changeHistory = [],
}) {
  if (!tool) return null;

  const {
    name,
    desc,
    description,
    longDesc,
    fullReview,
    review,
    price,
    priceTier,
    priceLabel,
    rating,
    badge,
    featured,
    hot,
    features = [],
    pros = [],
    cons = [],
    useCases = [],
    tags = [],
    alternatives = [],
    website,
    affiliateLink,
    seoTitle,
    seoDescription,
    canonical_url,
    ogImage,
    og_image,
    logo,
    logoUrl,
    category,
  } = tool;

  const faq = normalizeFaq(tool);

  const safeWebsite = safeUrl(website);
  const safeAffiliate = safeUrl(affiliateLink);

  const ctaUrl =
    safeAffiliate ||
    safeWebsite ||
    null;

  const pageTitle =
    seoTitle ||
    `${name} Review & Pricing | ShabelleHub`;

  const pageDescription =
    seoDescription ||
    desc ||
    description ||
    `Learn about ${name}, its features, pricing and use cases.`;

  const canonical =
    safeUrl(canonical_url) ||
    `https://shabellehub.com/tools/${encodeURIComponent(
      tool.slug
    )}`;

  const image =
    safeUrl(ogImage) ||
    safeUrl(og_image);

  const normalizedFeatures = asArray(features);
  const normalizedPros = asArray(pros);
  const normalizedCons = asArray(cons);
  const normalizedUseCases = asArray(useCases);
  const normalizedTags = asArray(tags);

  const reviewContent =
    fullReview ||
    review ||
    longDesc ||
    desc ||
    description;

  const ratingValue = Number(rating) || 0;

  const priceText = String(price || '');
  const isFreeTier =
    ['free', 'freemium'].includes(priceTier) ||
    /^ *free/i.test(priceText);
  const priceMatch = priceText.match(
    /[$] ?([0-9]+(?:[.][0-9]+)?)/
  );
  const offerPrice = isFreeTier
    ? '0'
    : priceMatch
      ? priceMatch[1]
      : null;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name,
    description: pageDescription,
    applicationCategory:
      category || 'AIApplication',
    url: canonical,
    ...(image
      ? {
          image,
        }
      : {}),
    ...(ratingValue > 0
      ? {
          review: {
            '@type': 'Review',
            author: {
              '@type': 'Organization',
              name: 'ShabelleHub',
            },
            reviewRating: {
              '@type': 'Rating',
              ratingValue,
              bestRating: 5,
              worstRating: 1,
            },
          },
        }
      : {}),
    ...(offerPrice !== null
      ? {
          offers: {
            '@type': 'Offer',
            price: offerPrice,
            priceCurrency: 'USD',
            ...(price
              ? { description: String(price) }
              : {}),
          },
        }
      : {}),
  };

  if (faq.length > 0) {
    structuredData.mainEntity = faq.map(
      (item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })
    );
  }

  const stars =
    ratingValue > 0
      ? `${'★'.repeat(
          Math.min(5, Math.round(ratingValue))
        )}${'☆'.repeat(
          Math.max(0, 5 - Math.round(ratingValue))
        )}`
      : '';

  return (
    <>
      <Head>
        <title>{pageTitle}</title>

        <meta
          name="description"
          content={pageDescription}
        />

        <link
          rel="canonical"
          href={canonical}
        />

        <meta
          property="og:title"
          content={pageTitle}
        />

        <meta
          property="og:description"
          content={pageDescription}
        />

        <meta
          property="og:type"
          content="website"
        />

        {image && (
          <meta
            property="og:image"
            content={image}
          />
        )}

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: safeJsonLd(structuredData),
          }}
        />
      </Head>

      <main className="sh-tool-page">
        <div className="sh-container">

          <nav
            className="sh-breadcrumb"
            aria-label="Breadcrumb"
          >
            <Link href="/tools">
              AI Directory
            </Link>

            <span>/</span>

            {category && (
              <>
                <Link
                  href={`/tools?category=${encodeURIComponent(
                    category
                  )}`}
                >
                  {category}
                </Link>
                <span>/</span>
              </>
            )}

            <span>{name}</span>
          </nav>

          <section className="sh-hero">
            <div className="sh-hero-main">

              <div className="sh-tool-identity">
                {logo || logoUrl ? (
                  <img
                    src={logo || logoUrl}
                    alt={`${name} logo`}
                    className="sh-tool-logo"
                  />
                ) : (
                  <div className="sh-tool-logo-placeholder">
                    {String(name || '?')
                      .slice(0, 1)
                      .toUpperCase()}
                  </div>
                )}

                <div>
                  <div className="sh-badge-row">
                    {badge && (
                      <span className="sh-badge">
                        {badge}
                      </span>
                    )}

                    {featured && (
                      <span className="sh-badge sh-badge-featured">
                        Featured
                      </span>
                    )}

                    {hot && (
                      <span className="sh-badge sh-badge-hot">
                        🔥 Trending
                      </span>
                    )}
                  </div>

                  <h1>{name}</h1>

                  <div className="sh-meta-row">
                    {category && (
                      <span>{category}</span>
                    )}

                    {priceTier && (
                      <span>{priceTier}</span>
                    )}

                    {(priceLabel || price) && (
                      <span>
                        {priceLabel || price}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <p className="sh-hero-description">
                {desc || description}
              </p>

              {ratingValue > 0 && (
                <div className="sh-rating">
                  <span className="sh-stars">
                    {stars}
                  </span>

                  <strong>
                    {ratingValue.toFixed(1)}
                  </strong>

                  <span>/ 5</span>
                </div>
              )}

              {ctaUrl && (
                <div className="sh-cta-row">
                  <a
                    href={ctaUrl}
                    target="_blank"
                    rel="noopener noreferrer sponsored nofollow"
                    className="sh-primary-button sh-hero-button"
                  >
                    {safeAffiliate
                      ? `Try ${name} →`
                      : `Visit ${name} →`}
                  </a>

                  {safeAffiliate && (
                    <span className="sh-affiliate-note">
                      We may earn a commission at no
                      extra cost to you.
                    </span>
                  )}
                </div>
              )}
            </div>

            <aside className="sh-hero-side">
              <div className="sh-quick-card">
                <span>Tool Overview</span>

                {category && (
                  <div>
                    <small>Category</small>
                    <strong>{category}</strong>
                  </div>
                )}

                {(priceLabel || price) && (
                  <div>
                    <small>Pricing</small>
                    <strong>
                      {priceLabel || price}
                    </strong>
                  </div>
                )}

                {ratingValue > 0 && (
                  <div>
                    <small>Rating</small>
                    <strong>
                      {ratingValue.toFixed(1)} / 5
                    </strong>
                  </div>
                )}

                {normalizedTags.length > 0 && (
                  <div>
                    <small>Tags</small>
                    <strong>
                      {normalizedTags.length}
                    </strong>
                  </div>
                )}
              </div>
            </aside>
          </section>

          {reviewContent && (
            <section
              className="sh-section"
              id="overview"
            >
              <div className="sh-section-heading">
                <div>
                  <span className="sh-eyebrow">
                    OVERVIEW
                  </span>
                  <h2>About {name}</h2>
                </div>
              </div>

              <ReviewContent value={reviewContent} />
            </section>
          )}

          {normalizedFeatures.length > 0 && (
            <section
              className="sh-section"
              id="features"
            >
              <div className="sh-section-heading">
                <div>
                  <span className="sh-eyebrow">
                    CAPABILITIES
                  </span>
                  <h2>Key Features</h2>
                </div>
              </div>

              <div className="sh-feature-grid">
                {normalizedFeatures.map(
                  (feature, index) => (
                    <div
                      className="sh-feature-card"
                      key={`${feature}-${index}`}
                    >
                      <span className="sh-feature-number">
                        {String(index + 1).padStart(
                          2,
                          '0'
                        )}
                      </span>

                      <p>{feature}</p>
                    </div>
                  )
                )}
              </div>
            </section>
          )}

          {(normalizedPros.length > 0 ||
            normalizedCons.length > 0) && (
            <section
              className="sh-section sh-pros-cons"
              id="pros-cons"
            >
              {normalizedPros.length > 0 && (
                <div className="sh-list-card sh-pros">
                  <span className="sh-eyebrow">
                    ADVANTAGES
                  </span>

                  <h2>Pros</h2>

                  <ul>
                    {normalizedPros.map(
                      (item, index) => (
                        <li key={index}>
                          <span>✓</span>
                          {item}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}

              {normalizedCons.length > 0 && (
                <div className="sh-list-card sh-cons">
                  <span className="sh-eyebrow">
                    CONSIDERATIONS
                  </span>

                  <h2>Cons</h2>

                  <ul>
                    {normalizedCons.map(
                      (item, index) => (
                        <li key={index}>
                          <span>×</span>
                          {item}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}
            </section>
          )}

          {normalizedUseCases.length > 0 && (
            <section
              className="sh-section"
              id="use-cases"
            >
              <div className="sh-section-heading">
                <div>
                  <span className="sh-eyebrow">
                    WORKFLOWS
                  </span>
                  <h2>Use Cases</h2>
                </div>
              </div>

              <div className="sh-use-case-grid">
                {normalizedUseCases.map(
                  (item, index) => (
                    <div
                      className="sh-use-case"
                      key={`${item}-${index}`}
                    >
                      <span>→</span>
                      <p>{item}</p>
                    </div>
                  )
                )}
              </div>
            </section>
          )}

          <SmartStackMatcher tool={tool} />

          {normalizedTags.length > 0 && (
            <section
              className="sh-section"
              id="tags"
            >
              <div className="sh-section-heading">
                <div>
                  <span className="sh-eyebrow">
                    DISCOVERY
                  </span>
                  <h2>Tags</h2>
                </div>
              </div>

              <div className="sh-tag-list">
                {normalizedTags.map((tag) => (
                  <span
                    className="sh-tag"
                    key={tag}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </section>
          )}

          {(price || priceLabel || priceTier) && (
            <section
              className="sh-section sh-pricing-section"
              id="pricing"
            >
              <div className="sh-pricing-card">
                <div>
                  <span className="sh-eyebrow">
                    PRICING
                  </span>

                  <h2>
                    {priceLabel ||
                      price ||
                      priceTier}
                  </h2>

                  {priceTier && (
                    <p>{priceTier}</p>
                  )}
                </div>

                {ctaUrl && (
                  <a
                    href={ctaUrl}
                    target="_blank"
                    rel="noopener noreferrer sponsored nofollow"
                    className="sh-primary-button"
                  >
                    Check Current Pricing →
                  </a>
                )}
              </div>
            </section>
          )}

          {related.length > 0 && (
            <section
              className="sh-section"
              id="related"
            >
              <div className="sh-section-heading">
                <div>
                  <span className="sh-eyebrow">
                    EXPLORE MORE
                  </span>
                  <h2>
                    {alternatives.length > 0
                      ? 'Alternatives & Related Tools'
                      : 'Related Tools'}
                  </h2>
                </div>
              </div>

              <div className="sh-related-grid">
                {related.map((item) => (
                  <ToolCard
                    key={item.slug}
                    tool={item}
                  />
                ))}
              </div>
            </section>
          )}

          <FAQSection faq={faq} />

          {changeHistory && changeHistory.length > 0 && (
            <section className="sh-section" id="change-history">
              <div className="sh-section-heading">
                <div>
                  <span className="sh-eyebrow">CHANGE LOG</span>
                  <h2>Change History</h2>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {changeHistory.map((c) => (
                  <a
                    key={c.anchor}
                    href={`/changes#${c.anchor}`}
                    style={{ display: 'block', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', textDecoration: 'none' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-2)', background: 'rgba(108,92,255,0.12)', borderRadius: 999, padding: '2px 10px' }}>
                        {c.category}
                      </span>
                      <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)' }}>
                        {new Date(c.detected_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })}
                      </span>
                    </div>
                    <p style={{ color: 'var(--muted)', fontSize: 13, margin: 0 }}>{c.summary}</p>
                  </a>
                ))}
              </div>
              <Link href="/changes" style={{ display: 'inline-block', marginTop: 12, fontSize: 13, color: 'var(--accent-2)' }}>
                View all changes →
              </Link>
            </section>
          )}

        </div>
      </main>
    </>
  );
}
