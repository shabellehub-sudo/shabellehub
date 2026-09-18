import io

path = "pages/api/admin/ship-change.js"
with io.open(path, "r", encoding="utf-8") as f:
    content = f.read()

old = """  return res.status(200).json({
    ok: true,
    slug,
    column,
    confirmedValue: confirmedValue.trim(),
    shippedAt,
  });
}"""

new = """  // On-demand revalidation: without this, the shipped change sits in
  // Supabase but the live /tools/[slug] page keeps serving its cached
  // ISR output for up to `revalidate: 3600` seconds (1 hour). This makes
  // the shipped value appear immediately. Best-effort: a failure here
  // must not undo the successful writes above, so it's caught and
  // surfaced as a warning rather than an error.
  try {
    await res.revalidate(`/tools/${slug}`);
  } catch (revalidateErr) {
    return res.status(200).json({
      ok: true,
      slug,
      column,
      confirmedValue: confirmedValue.trim(),
      shippedAt,
      warning: `Shipped successfully, but on-demand revalidation failed: ${revalidateErr.message}. Page will still update within the normal 1-hour ISR window.`,
    });
  }

  return res.status(200).json({
    ok: true,
    slug,
    column,
    confirmedValue: confirmedValue.trim(),
    shippedAt,
  });
}"""

n = content.count(old)
if n != 1:
    print(f"SKIP (found {n} times, expected 1) -- do not push, investigate manually.")
else:
    content = content.replace(old, new)
    with io.open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Done. Review with: git diff pages/api/admin/ship-change.js")
