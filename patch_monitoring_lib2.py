import io

path = "lib/cms/monitoring.js"
with io.open(path, "r", encoding="utf-8") as f:
    content = f.read()

old = """export async function reviewChange(id, decision, userId) {
  return update(CHANGES_TABLE, id, {
    status: decision,
    reviewed_by: userId || null,
    reviewed_at: new Date().toISOString(),
  }, { userId });
}"""

new = """export async function reviewChange(id, decision, userId) {
  return update(CHANGES_TABLE, id, {
    status: decision,
    reviewed_by: userId || null,
    reviewed_at: new Date().toISOString(),
    // Flag every newly-confirmed change as needing an editorial pass on
    // the actual article/tool longDesc -- Ship only ever touches
    // tools.price/badge, so confirmed changes (feature/model/plan
    // updates, and even shippable ones where the field mapping doesn't
    // fit, like a sub-plan price change) can otherwise sit confirmed
    // forever with no visible reminder that the write-up itself is
    // still stale. Cleared by markEditorialUpdated() once handled.
    ...(decision === 'confirmed' ? { editorial_update_needed: true } : {}),
  }, { userId });
}

// Clears the editorial-update reminder once the admin has manually
// updated the relevant tool/article copy for a confirmed change.
export async function markEditorialUpdated(id, userId) {
  return update(CHANGES_TABLE, id, {
    editorial_update_needed: false,
    editorial_updated_at: new Date().toISOString(),
  }, { userId });
}"""

n = content.count(old)
if n != 1:
    print(f"SKIP (found {n} times, expected 1) -- do not push, investigate manually.")
else:
    content = content.replace(old, new)
    with io.open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Done. Review with: git diff lib/cms/monitoring.js")
