import io

path = "pages/admin/monitoring/index.js"
with io.open(path, "r", encoding="utf-8") as f:
    content = f.read()

replacements = []

replacements.append((
    "  const [shipping, setShipping] = useState({});\n",
    "  const [shipping, setShipping] = useState({});\n"
    "  const [dismissingLow, setDismissingLow] = useState(false);\n"
))

replacements.append((
    "  async function handleReview(id, decision) {\n"
    "    const result = await reviewChange(id, decision);\n"
    "    if (result.error) { setError(result.error); return; }\n"
    "    load();\n"
    "  }\n",
    "  async function handleReview(id, decision) {\n"
    "    const result = await reviewChange(id, decision);\n"
    "    if (result.error) { setError(result.error); return; }\n"
    "    load();\n"
    "  }\n"
    "\n"
    "  async function handleDismissAllLowPriority() {\n"
    "    setDismissingLow(true);\n"
    "    setError(null);\n"
    "    try {\n"
    "      const supabase = getSupabaseClient();\n"
    "      const { error: rpcError } = await supabase.rpc('dismiss_all_low_priority');\n"
    "      if (rpcError) { setError(rpcError.message); return; }\n"
    "      load();\n"
    "    } catch (err) {\n"
    "      setError(err.message);\n"
    "    } finally {\n"
    "      setDismissingLow(false);\n"
    "    }\n"
    "  }\n"
))

replacements.append((
    "  return (\n"
    "    <AdminLayout title=\"Tool Monitoring\">",
    "  const needsReview = changes.filter((c) => c.priority !== 'low');\n"
    "  const lowPriority = changes.filter((c) => c.priority === 'low');\n"
    "\n"
    "  return (\n"
    "    <AdminLayout title=\"Tool Monitoring\">"
))

card_body = """              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>
                    {c.tool_slug}{' '}
                    <span style={{ fontSize: 11, fontWeight: 700, color: confidenceColor[c.confidence] || '#6b82a8' }}>
                      {CATEGORY_LABELS[c.change_category] || c.change_category} \u00b7 {c.confidence?.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ color: '#6b82a8', fontSize: 11, marginTop: 2 }}>
                    Detected {new Date(c.detected_at).toLocaleString()} \u00b7{' '}
                    <a href={c.evidence_url} target="_blank" rel="noopener noreferrer" style={{ color: '#14FFF4' }}>source</a>
                  </div>
                  {sourceTypeLabel[c.source_type] && (
                    <div style={{ color: '#f5a623', fontSize: 11, marginTop: 4 }}>
                      {sourceTypeLabel[c.source_type]}
                    </div>
                  )}
                  {c.affected_article_slugs?.length > 0 && (
                    <div style={{ color: '#6b82a8', fontSize: 11, marginTop: 4 }}>
                      Linked articles: {c.affected_article_slugs.join(', ')}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Button variant="secondary" onClick={() => handleReview(c.id, 'confirmed')} style={{ fontSize: 11, padding: '5px 9px' }}>Confirm</Button>
                  <Button variant="danger" onClick={() => handleReview(c.id, 'dismissed')} style={{ fontSize: 11, padding: '5px 9px' }}>Dismiss</Button>
                </div>
              </div>
              {c.ai_summary ? (
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: '#14FFF4', border: '1px solid #14FFF4', borderRadius: 4, padding: '2px 5px', flexShrink: 0 }}>
                    {c.classified_by === 'ai_search' ? 'AI SEARCH' : 'AI'}
                  </span>
                  <p style={{ fontSize: 13, color: '#e8f0ff', margin: 0, lineHeight: 1.4 }}>{c.ai_summary}</p>
                </div>
              ) : (
                <div style={{ marginTop: 8 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: '#6b82a8', border: '1px solid #6b82a8', borderRadius: 4, padding: '2px 5px' }}>KEYWORD</span>
                </div>
              )}
              {c.diff_excerpt && (
                <details style={{ marginTop: 8 }}>
                  <summary style={{ cursor: 'pointer', fontSize: 11, color: '#6b82a8' }}>Show raw diff</summary>
                  <pre style={{ marginTop: 8, fontSize: 12, color: '#e8f0ff', background: '#0a0e16', padding: 10, borderRadius: 8, whiteSpace: 'pre-wrap', overflowX: 'auto' }}>
                    {c.diff_excerpt}
                  </pre>
                </details>
              )}
"""

old_section = (
    "      <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Pending Review ({changes.length})</h3>\n"
    "\n"
    "      {!isSupabaseConfigured() ? (\n"
    "        <EmptyState message=\"No database connection.\" />\n"
    "      ) : loading ? (\n"
    "        <p style={{ color: '#6b82a8' }}>Loading\u2026</p>\n"
    "      ) : changes.length === 0 ? (\n"
    "        <EmptyState message=\"No pending changes.\" sub=\"Nothing flagged since the last scan.\" />\n"
    "      ) : (\n"
    "        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>\n"
    "          {changes.map((c) => (\n"
    "            <AdminCard key={c.id}>\n"
    + card_body +
    "            </AdminCard>\n"
    "          ))}\n"
    "        </div>\n"
    "      )}\n"
)

new_section = (
    "      <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Needs Review ({needsReview.length})</h3>\n"
    "\n"
    "      {!isSupabaseConfigured() ? (\n"
    "        <EmptyState message=\"No database connection.\" />\n"
    "      ) : loading ? (\n"
    "        <p style={{ color: '#6b82a8' }}>Loading\u2026</p>\n"
    "      ) : needsReview.length === 0 ? (\n"
    "        <EmptyState message=\"No pending changes.\" sub=\"Nothing flagged since the last scan.\" />\n"
    "      ) : (\n"
    "        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>\n"
    "          {needsReview.map((c) => (\n"
    "            <AdminCard key={c.id}>\n"
    + card_body +
    "            </AdminCard>\n"
    "          ))}\n"
    "        </div>\n"
    "      )}\n"
    "\n"
    "      {lowPriority.length > 0 && (\n"
    "        <details style={{ marginBottom: 28 }}>\n"
    "          <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#6b82a8', marginBottom: 10 }}>\n"
    "            Low Priority \u2014 Noise ({lowPriority.length})\n"
    "          </summary>\n"
    "          <div style={{ margin: '10px 0' }}>\n"
    "            <Button variant=\"secondary\" onClick={handleDismissAllLowPriority} disabled={dismissingLow} style={{ fontSize: 11, padding: '5px 9px' }}>\n"
    "              {dismissingLow ? 'Dismissing\u2026' : `Dismiss All Low Priority (${lowPriority.length})`}\n"
    "            </Button>\n"
    "          </div>\n"
    "          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>\n"
    "            {lowPriority.map((c) => (\n"
    "              <AdminCard key={c.id}>\n"
    + card_body.replace("\n              ", "\n                ").replace("              <div", "                <div") +
    "              </AdminCard>\n"
    "            ))}\n"
    "          </div>\n"
    "        </details>\n"
    "      )}\n"
)

replacements.append((old_section, new_section))

for old, new in replacements:
    n = content.count(old)
    if n != 1:
        print(f"SKIP (found {n} times, expected 1): {old[:60]!r}...")
        continue
    content = content.replace(old, new)

with io.open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Done. Review with: git diff pages/admin/monitoring/index.js")
