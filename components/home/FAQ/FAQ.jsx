import { useState, useId } from 'react';
import { getFaqs } from '../../../data/faqs';
import SectionHeader from '../../shared/SectionHeader/SectionHeader';
import styles from './FAQ.module.css';

/**
 * FAQ — homepage excerpt of the full /faq page. Shows the first `limit`
 * questions as an accessible accordion and emits FAQPage JSON-LD scoped
 * to exactly the questions rendered here (not the full FAQS list), so
 * the structured data always matches what's actually on the page —
 * search engines penalize schema that doesn't match visible content.
 */
export default function FAQ({ limit = 5, toolsCount, categoriesCount }) {
  const items = getFaqs({ toolsCount, categoriesCount }).slice(0, limit);
  const [openIndex, setOpenIndex] = useState(null);
  const uid = useId().replace(/:/g, '');

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <section className={styles.section}>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className={styles.inner}>
        <SectionHeader icon="❓" title="Frequently Asked Questions" ctaLabel="All FAQs" ctaHref="/faq" />

        <div className={styles.list}>
          {items.map((f, i) => {
            const isOpen = openIndex === i;
            const panelId = `faq-panel-${uid}-${i}`;
            const buttonId = `faq-button-${uid}-${i}`;
            return (
              <div key={f.q} className={styles.item}>
                <h3 className={styles.qWrap}>
                  <button
                    type="button"
                    id={buttonId}
                    className={styles.question}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                  >
                    <span>{f.q}</span>
                    <span className={styles.icon} aria-hidden="true">{isOpen ? '−' : '+'}</span>
                  </button>
                </h3>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className={styles.answer}
                  hidden={!isOpen}
                >
                  <p>{f.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
