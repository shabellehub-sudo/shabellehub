import io

path = "components/home/Hero/Hero.module.css"
with io.open(path, "r", encoding="utf-8") as f:
    content = f.read()

old_hero = """.hero {
  position: relative;
  padding: 60px 20px 48px;
  text-align: center;
  overflow: hidden;
  isolation: isolate;
}"""

new_hero = """.hero {
  position: relative;
  padding: 60px 20px 48px;
  text-align: center;
  overflow: hidden;
  isolation: isolate;

  /* Scoped palette override -- affects only this section and its
     children (HeroVisual is nested inside), not the global tokens
     in styles/tokens.css. Moves off the cyan/violet "AI slop" duo
     toward an earthier, more specific pair: moss (verified/confirmed)
     and clay (flag/attention), matching the site's evidence-ledger
     subject matter rather than a generic SaaS gradient. */
  --accent: #8FA876;
  --accent-dim: #6B8259;
  --accent-2: #B5824A;
  --gradient-aurora: linear-gradient(135deg, rgba(143,168,118,0.16), rgba(181,130,74,0.12));
  --gradient-aurora-strong: linear-gradient(135deg, rgba(143,168,118,0.35), rgba(181,130,74,0.28));
  --glow-cyan: 0 0 40px rgba(143,168,118,0.25);
  --glow-violet: 0 0 40px rgba(181,130,74,0.25);
}"""

old_eyebrow = """.eyebrow {
  color: var(--accent);
  font-size: var(--text-caption);
  font-weight: 800;
  letter-spacing: 2.5px;
  text-transform: uppercase;
  margin-bottom: 14px;
}"""

new_eyebrow = """.eyebrow {
  color: var(--muted);
  font-size: var(--text-body-sm);
  font-weight: 600;
  letter-spacing: normal;
  text-transform: none;
  margin-bottom: 14px;
}"""

replacements = [(old_hero, new_hero), (old_eyebrow, new_eyebrow)]
for old, new in replacements:
    n = content.count(old)
    if n != 1:
        print(f"SKIP (found {n} times, expected 1): {old[:50]!r}...")
        continue
    content = content.replace(old, new)

with io.open(path, "w", encoding="utf-8") as f:
    f.write(content)
print("Hero.module.css done.")

# --- Hero.jsx: drop the trailing arrow from CTA button text ---
path2 = "components/home/Hero/Hero.jsx"
with io.open(path2, "r", encoding="utf-8") as f:
    content2 = f.read()

old_btn = "            Explore Tools →\n          </Button>"
new_btn = "            Explore Tools\n          </Button>"

n = content2.count(old_btn)
if n != 1:
    print(f"SKIP (found {n} times, expected 1) in Hero.jsx")
else:
    content2 = content2.replace(old_btn, new_btn)
    with io.open(path2, "w", encoding="utf-8") as f:
        f.write(content2)
    print("Hero.jsx done.")
