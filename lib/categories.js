// lib/categories.js — shared category-slug helper
//
// Extracted from pages/tools/category/[category].js so other pages/components
// (Layout footer, tools index) can import it without importing a page module
// directly, which Next.js's Pages Router does not reliably support for
// non-component named exports.

export function categoryToSlug(name) {
  return name
    .toLowerCase()
    .replace(/&/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
