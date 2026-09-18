import io

path = "pages/admin/monitoring/index.js"
with io.open(path, "r", encoding="utf-8") as f:
    content = f.read()

replacements = []

# 1. Import Link + listTools
replacements.append((
    "import { useEffect, useState, useCallback } from 'react';\n"
    "import AdminLayout from '../../../components/admin/AdminLayout';",
    "import { useEffect, useState, useCallback } from 'react';\n"
    "import Link from 'next/link';\n"
    "import AdminLayout from '../../../components/admin/AdminLayout';"
))
replacements.append((
    "import { listPendingChanges, listAllChanges, reviewChange, listRecentAuditLog, skipShip, markEditorialUpdated } from '../../../lib/cms/monitoring';",
    "import { listPendingChanges, listAllChanges, reviewChange, listRecentAuditLog, skipShip, markEditorialUpdated } from '../../../lib/cms/monitoring';\n"
    "import { listTools } from '../../../lib/cms/tools';"
))

# 2. Add state for the slug -> id map
replacements.append((
    "  const [needsEditorial, setNeedsEditorial] = useState([]);",
    "  const [needsEditorial, setNeedsEditorial] = useState([]);\n"
    "  const [toolIdBySlug, setToolIdBySlug] = useState({});"
))

# 3. Fetch tools alongside the other load() calls and build the map
replacements.append((
    "    const [changesRes, auditRes, confirmedRes] = await Promise.all([\n"
    "      listPendingChanges({ lim: 50 }),\n"
    "      listRecentAuditLog({ lim: 20 }),\n"
    "      listAllChanges({ status: 'confirmed', lim: 50 }),\n"
    "    ]);",
    "    const [changesRes, auditRes, confirmedRes, toolsRes] = await Promise.all([\n"
    "      listPendingChanges({ lim: 50 }),\n"
    "      listRecentAuditLog({ lim: 20 }),\n"
    "      listAllChanges({ status: 'confirmed', lim: 50 }),\n"
    "      listTools({ lim: 200 }),\n"
    "    ]);\n"
    "    const idMap = {};\n"
    "    for (const t of toolsRes.data || []) idMap[t.slug] = t.id;\n"
    "    setToolIdBySlug(idMap);"
))

# 4. Render the Edit link inside the Needs Article Update card, next to Mark Updated
replacements.append((
    "                <Button variant=\"secondary\" onClick={() => handleMarkEditorialUpdated(c.id)} disabled={markingUpdated[c.id]} style={{ fontSize: 11, padding: '5px 9px' }}>\n"
    "                  {markingUpdated[c.id] ? 'Saving\u2026' : 'Mark Updated'}\n"
    "                </Button>",
    "                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>\n"
    "                  {toolIdBySlug[c.tool_slug] && (\n"
    "                    <Link href={`/admin/tools/${toolIdBySlug[c.tool_slug]}`} style={{ textDecoration: 'none' }}>\n"
    "                      <Button variant=\"secondary\" style={{ fontSize: 11, padding: '5px 9px' }}>Edit {c.tool_slug} \u2192</Button>\n"
    "                    </Link>\n"
    "                  )}\n"
    "                  <Button variant=\"secondary\" onClick={() => handleMarkEditorialUpdated(c.id)} disabled={markingUpdated[c.id]} style={{ fontSize: 11, padding: '5px 9px' }}>\n"
    "                    {markingUpdated[c.id] ? 'Saving\u2026' : 'Mark Updated'}\n"
    "                  </Button>\n"
    "                </div>"
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
