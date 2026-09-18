import io

path = "components/home/Hero/Hero.jsx"
with io.open(path, "r", encoding="utf-8") as f:
    content = f.read()

old = "Compare, review, and explore the world&rsquo;s top AI tools for writing, coding,"
new = "Compare, review, and explore leading AI tools for writing, coding,"

n = content.count(old)
if n != 1:
    print(f"SKIP (found {n} times, expected 1) -- do not push, investigate manually.")
else:
    content = content.replace(old, new)
    with io.open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Done. Review with: git diff components/home/Hero/Hero.jsx")
