import io

path = "pages/admin/monitoring/index.js"
with io.open(path, "r", encoding="utf-8") as f:
    content = f.read()

replacements = []

# 1. Import markEditorialUpdated
replacements.append((
    "import { listPendingChanges, listAllChanges, reviewChange, listRecentAuditLog, skipShip } from '../../../lib/cms/monitoring';",
    "import { listPendingChanges, listAllChanges, reviewChange, listRecentAuditLog, skipShip, markEditorialUpdated } from '../../../lib/cms/monitoring';"
))

# 2. Fetch confirmed changes broadly (all categories, not just pricing/status)
#    for the editorial-update queue, alongside the existing shippable fetch.
replacements.append((
    "    const eligible = (confirmedRes.data || []).filter((c) => (c.change_category === 'pricing' || c.change_category === 'status') && !c.ship_skipped);\n"
    "    setShippable(eligible);",
    "    const eligible = (confirmedRes.data || []).filter((c) => (c.change_category === 'pricing' || c.change_category === 'status') && !c.ship_skipped);\n"
    "    setShippable(eligible);\n"
    "    setNeedsEditorial((confirmedRes.data || []).filter((c) => c.editorial_update_needed));"
))

# 3. Add the needsEditorial state next to shippable
replacements.append((
    "  const [shippable, setShippable] = useState([]);",
    "  const [shippable, setShippable] = useState([]);\n"
    "  const [needsEditorial, setNeedsEditorial] = useState([]);\n"
    "  const [markingUpdated, setMarkingUpdated] = useState({});"
))

# 4. Add the handler, near handleSkipShip
replacements.append((
    "  async function handleShip(id) {",
    "  async function handleMarkEditorialUpdated(id) {\n"
    "    setMarkingUpdated((m) => ({ ...m, [id]: true }));\n"
    "    const supabase = getSupabaseClient();\n"
    "    const { data: { session } } = await supabase.auth.getSession();\n"
    "    const result = await markEditorialUpdated(id, session?.user?.id);\n"
    "    setMarkingUpdated((m) => ({ ...m, [id]: false }));\n"
    "    if (result.error) { setError(result.error); return; }\n"
    "    load();\n"
    "  }\n"
    "\n"
    "  async function handleShip(id) {"
))

# 5. Render the section, right after the shippable AdminCard block closes
replacements.append((
    "      <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Needs Review ({needsReview.length})</h3>",
    "      {needsEditorial.length > 0 && (\n"
    "        <details style={{ marginBottom: 20 }}>\n"
    "          <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#f5a623', marginBottom: 10 }}>\n"
    "            \u270f\ufe0f Needs Article Update ({needsEditorial.length})\n"
    "          </summary>\n"
    "          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>\n"
    "            {needsEditorial.map((c) => (\n"
    "              <AdminCard key={c.id} style={{ border: '1px solid #f5a623', background: 'rgba(245,166,35,0.05)' }}>\n"
    "                <div style={{ fontWeight: 700, fontSize: 13 }}>\n"
    "                  {c.tool_slug} \u2014 {CATEGORY_LABELS[c.change_category] || c.change_category}\n"
    "                </div>\n"
    "                <div style={{ color: '#8ba3ca', fontSize: 11, margin: '4px 0' }}>\n"
    "                  Confirmed {c.reviewed_at ? new Date(c.reviewed_at).toLocaleDateString() : ''} \u00b7 longDesc/article not yet updated\n"
    "                </div>\n"
    "                {c.affected_article_slugs?.length > 0 && (\n"
    "                  <div style={{ color: '#6b82a8', fontSize: 11, marginBottom: 8 }}>\n"
    "                    Linked articles: {c.affected_article_slugs.join(', ')}\n"
    "                  </div>\n"
    "                )}\n"
    "                <Button variant=\"secondary\" onClick={() => handleMarkEditorialUpdated(c.id)} disabled={markingUpdated[c.id]} style={{ fontSize: 11, padding: '5px 9px' }}>\n"
    "                  {markingUpdated[c.id] ? 'Saving\u2026' : 'Mark Updated'}\n"
    "                </Button>\n"
    "              </AdminCard>\n"
    "            ))}\n"
    "          </div>\n"
    "        </details>\n"
    "      )}\n"
    "\n"
    "      <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Needs Review ({needsReview.length})</h3>"
))

for old, new in replacements:
    n = content.count(old)
    if n != 1:
        print(f"SKIP (found {n} times, expected 1): {old[:70]!r}...")
        continue
    content = content.replace(old, new)

with io.open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Done. Review with: git diff pages/admin/monitoring/index.js")
