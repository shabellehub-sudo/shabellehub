import io

path = "pages/admin/monitoring/index.js"
with io.open(path, "r", encoding="utf-8") as f:
    content = f.read()

replacements = []

# 1. handleReview: fetch session, pass userId to reviewChange
replacements.append((
    "  async function handleReview(id, decision) {\n"
    "    const result = await reviewChange(id, decision);\n"
    "    if (result.error) { setError(result.error); return; }\n"
    "    load();\n"
    "  }",
    "  async function handleReview(id, decision) {\n"
    "    const supabase = getSupabaseClient();\n"
    "    const { data: { session } } = await supabase.auth.getSession();\n"
    "    const result = await reviewChange(id, decision, session?.user?.id);\n"
    "    if (result.error) { setError(result.error); return; }\n"
    "    load();\n"
    "  }"
))

# 2. handleSkipShip: fetch session, pass userId to skipShip
replacements.append((
    "  async function handleSkipShip(id) {\n"
    "    const result = await skipShip(id);\n"
    "    if (result.error) { setError(result.error); return; }\n"
    "    load();\n"
    "  }",
    "  async function handleSkipShip(id) {\n"
    "    const supabase = getSupabaseClient();\n"
    "    const { data: { session } } = await supabase.auth.getSession();\n"
    "    const result = await skipShip(id, session?.user?.id);\n"
    "    if (result.error) { setError(result.error); return; }\n"
    "    load();\n"
    "  }"
))

for old, new in replacements:
    n = content.count(old)
    if n != 1:
        print(f"SKIP (found {n} times, expected 1): {old[:60]!r}...")
        continue
    content = content.replace(old, new)

with io.open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Done. Review with: git diff pages/admin/monitoring/index.js")
