import io

path = "pages/about.js"
with io.open(path, "r", encoding="utf-8") as f:
    content = f.read()

old = """          Shabelle Hub is an independent AI tool review and comparison site built to cut through the
          noise of the fast-moving AI landscape. Every tool listed is tested hands-on and evaluated
          on technical merit, real-world utility, and honest pricing."""

new = """          Shabelle Hub is an independent AI tools platform that helps people discover and review
          AI products while continuously monitoring them for pricing and feature changes. Detected
          changes are verified before they are published. Every tool listed is tested hands-on and
          evaluated on technical merit, real-world utility, and honest pricing."""

n = content.count(old)
if n != 1:
    print(f"SKIP (found {n} times, expected 1) -- do not push, investigate manually.")
else:
    content = content.replace(old, new)
    with io.open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Done. Review with: git diff pages/about.js")
