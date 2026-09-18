import io

path = "components/home/Hero/Hero.jsx"
with io.open(path, "r", encoding="utf-8") as f:
    content = f.read()

old = """        <p className={`${styles.subhead} ${styles.reveal}`} style={{ '--reveal-delay': '0.24s' }}>
          Compare, review, and explore the world&rsquo;s top AI tools for writing, coding,
          productivity, design, video, automation, and more. Every listing is automatically
          monitored for pricing and feature changes, so you&rsquo;re never looking at stale data.
        </p>"""

new = """        <p className={`${styles.subhead} ${styles.reveal}`} style={{ '--reveal-delay': '0.24s' }}>
          Compare, review, and explore the world&rsquo;s top AI tools for writing, coding,
          productivity, design, video, automation, and more. Every listing is automatically
          monitored for pricing and feature changes, then verified by our editorial team
          before you see it.
        </p>"""

n = content.count(old)
if n != 1:
    print(f"SKIP (found {n} times, expected 1) -- do not push, investigate manually.")
else:
    content = content.replace(old, new)
    with io.open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Done. Review with: git diff components/home/Hero/Hero.jsx")
