import io

path = "data/eeat-meta.js"
with io.open(path, "r", encoding="utf-8") as f:
    content = f.read()

old = """  'replit-ai': {
    authorSlug: 'mohamed-abdi-guled',
    reviewerSlug: 'mohamed-abdi-guled',
    lastUpdated: '2026-06-13',
    lastReviewed: '2026-06-11',
  },"""

new = """  'replit-ai': {
    authorSlug: 'mohamed-abdi-guled',
    reviewerSlug: 'mohamed-abdi-guled',
    lastUpdated: '2026-09-10',
    lastReviewed: '2026-09-10',
  },"""

n = content.count(old)
if n != 1:
    print(f"SKIP (found {n} times, expected 1) -- do not push, investigate manually.")
else:
    content = content.replace(old, new)
    with io.open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Done. Review with: git diff data/eeat-meta.js")
