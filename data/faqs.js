// data/faqs.js
// Single source of truth for FAQ content — shared by pages/faq.js (full page)
// and components/home/FAQ (homepage excerpt with JSON-LD). getFaqs() takes
// live toolsCount/categoriesCount as params (instead of importing them
// statically from the legacy data/index.js bundle) so the first answer
// always reflects the real, current Supabase inventory rather than the
// count frozen at whatever data/index.js said at build time.
export function getFaqs({ toolsCount = 100, categoriesCount = 16 } = {}) {
  return [
    {
      q: 'How does Shabelle Hub choose which AI tools to review?',
      a: `We focus on AI tools that are widely used or solve a clear, common problem — general assistants, coding tools, image and video generation, research tools, voice AI, and productivity add-ons. We currently cover ${toolsCount} tools across ${categoriesCount} categories, and we're adding more as we test them.`,
    },
    {
      q: 'Are your reviews really independent?',
      a: 'Yes. We do not accept payment for inclusion or for positive coverage. Some of our links are affiliate links, which means we may earn a commission if you sign up through them — but this never determines which tools we cover or how we rate them. See our Affiliate Disclosure for full details.',
    },
    {
      q: 'How do you test each tool?',
      a: 'Every tool is signed up for and used hands-on across realistic tasks relevant to its category. We test the free tier where one exists, then the paid tier, and note specific strengths and limitations we encounter. Ratings reflect this testing, not vendor marketing claims.',
    },
    {
      q: 'How often is content updated?',
      a: 'AI tools change quickly — pricing, features, and limits can shift with little notice. We aim to revisit and update our reviews periodically, but always check the provider\'s official site for the most current pricing before subscribing.',
    },
    {
      q: 'Do you offer a free newsletter?',
      a: 'Yes — you can subscribe from the homepage or footer to get updates when we publish new reviews and comparisons.',
    },
    {
      q: 'I think a review is inaccurate or outdated. How can I let you know?',
      a: 'Please use our Contact page to let us know. We review all feedback and update pages when something has genuinely changed.',
    },
    {
      q: 'Can I suggest a tool for you to review?',
      a: 'Absolutely — send suggestions through the Contact page. We can\'t review everything, but we do prioritize tools that readers ask about most.',
    },
  ];
}
