import io

path = "pages/admin/monitoring/index.js"
with io.open(path, "r", encoding="utf-8") as f:
    content = f.read()

replacements = []

# 1. Import skipShip alongside the other functions
replacements.append((
    "import { listPendingChanges, listAllChanges, reviewChange, listRecentAuditLog } from '../../../lib/cms/monitoring';",
    "import { listPendingChanges, listAllChanges, reviewChange, listRecentAuditLog, skipShip } from '../../../lib/cms/monitoring';"
))

# 2. Filter out ship_skipped changes from the shippable queue
replacements.append((
    "    const eligible = (confirmedRes.data || []).filter((c) => c.change_category === 'pricing' || c.change_category === 'status');",
    "    const eligible = (confirmedRes.data || []).filter((c) => (c.change_category === 'pricing' || c.change_category === 'status') && !c.ship_skipped);"
))

# 3. Add the handler, right after handleReview
replacements.append((
    "  async function handleShip(id) {",
    "  async function handleSkipShip(id) {\n"
    "    const result = await skipShip(id);\n"
    "    if (result.error) { setError(result.error); return; }\n"
    "    load();\n"
    "  }\n"
    "\n"
    "  async function handleShip(id) {"
))

# 4. Add the "Skip Ship" button next to Dismiss in the shippable card
replacements.append((
    "                  <Button onClick={() => handleShip(c.id)} disabled={shipping[c.id]} style={{ fontSize: 11, padding: '5px 9px' }}>\n"
    "                    {shipping[c.id] ? 'Shipping…' : 'Confirm & Ship'}\n"
    "                  </Button>\n"
    "                  <Button variant=\"danger\" onClick={() => handleReview(c.id, 'dismissed')} style={{ fontSize: 11, padding: '5px 9px' }}>Dismiss</Button>",
    "                  <Button onClick={() => handleShip(c.id)} disabled={shipping[c.id]} style={{ fontSize: 11, padding: '5px 9px' }}>\n"
    "                    {shipping[c.id] ? 'Shipping…' : 'Confirm & Ship'}\n"
    "                  </Button>\n"
    "                  <Button variant=\"secondary\" onClick={() => handleSkipShip(c.id)} style={{ fontSize: 11, padding: '5px 9px' }}>Skip Ship</Button>\n"
    "                  <Button variant=\"danger\" onClick={() => handleReview(c.id, 'dismissed')} style={{ fontSize: 11, padding: '5px 9px' }}>Dismiss</Button>"
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
