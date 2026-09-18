import io

path = "components/home/Hero/Hero.jsx"
with io.open(path, "r", encoding="utf-8") as f:
    content = f.read()

replacements = []

# 1. Eyebrow text — reflect monitoring, not just "discovery"
replacements.append((
    "        <p className={`${styles.eyebrow} ${styles.reveal}`} style={{ '--reveal-delay': '0.12s' }}>\n"
    "          The Ultimate 2026 AI Discovery Platform\n"
    "        </p>",
    "        <p className={`${styles.eyebrow} ${styles.reveal}`} style={{ '--reveal-delay': '0.12s' }}>\n"
    "          AI Tools Discovered, Reviewed & Monitored Daily\n"
    "        </p>"
))

# 2. Subhead — add one honest sentence about automated monitoring
replacements.append((
    "        <p className={`${styles.subhead} ${styles.reveal}`} style={{ '--reveal-delay': '0.24s' }}>\n"
    "          Compare, review, and explore the world&rsquo;s top AI tools for writing, coding,\n"
    "          productivity, design, video, automation, and more.\n"
    "        </p>",
    "        <p className={`${styles.subhead} ${styles.reveal}`} style={{ '--reveal-delay': '0.24s' }}>\n"
    "          Compare, review, and explore the world&rsquo;s top AI tools for writing, coding,\n"
    "          productivity, design, video, automation, and more. Every listing is automatically\n"
    "          monitored for pricing and feature changes, so you&rsquo;re never looking at stale data.\n"
    "        </p>"
))

# 3. Second trust badge, reusing the same component (no new CSS, no new component)
replacements.append((
    "      <div className={styles.reveal} style={{ '--reveal-delay': '0.6s' }}>\n"
    "        <MobilePerformanceBadge />\n"
    "      </div>",
    "      <div className={styles.reveal} style={{ '--reveal-delay': '0.6s' }}>\n"
    "        <MobilePerformanceBadge />\n"
    "      </div>\n"
    "      <div className={styles.reveal} style={{ '--reveal-delay': '0.66s' }}>\n"
    "        <MobilePerformanceBadge label=\"Automated Change Monitoring\" />\n"
    "      </div>"
))

for old, new in replacements:
    n = content.count(old)
    if n != 1:
        print(f"SKIP (found {n} times, expected 1): {old[:60]!r}...")
        continue
    content = content.replace(old, new)

with io.open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Done. Review with: git diff components/home/Hero/Hero.jsx")
