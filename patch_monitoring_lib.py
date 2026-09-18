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
  }, { userId });
}

// Marks a confirmed change as "don't auto-ship this" without dismissing
// it or touching tools.price/badge -- for cases where the category is
// shippable (pricing/status) but the new_value text isn't a clean value
// to write (e.g. it references a different plan tier than the one the
// price field represents). The change stays confirmed/correct in the
// audit trail; it just drops out of the "Ready to Ship" queue.
export async function skipShip(id, userId) {
  return update(CHANGES_TABLE, id, {
    ship_skipped: true,
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
