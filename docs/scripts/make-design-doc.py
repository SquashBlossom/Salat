"""Builds the "Design Documents" Google Doc (as HTML) from the repo's design files.

Run from the repo root:  python3 docs/scripts/make-design-doc.py OUT.html
Needs the `markdown` package (pip install --target <dir> markdown; then PYTHONPATH=<dir>).
Sources: DESIGN.md, docs/RESOURCES.md (sections 1-4), docs/DESIGN-REFERENCES.md, docs/design-decisions.md.
Upload OUT.html to Google Drive as text/html titled "Design Documents" (see CLAUDE.md for the update rule)."""
import re
import sys
from datetime import date
import markdown

def read(p): return open(p, encoding='utf-8').read()
def section(s, start, end=None):
    a = s.index(start); b = s.index(end, a + 1) if end else len(s); return s[a:b]
def demote(s, n=1): return re.sub(r'^(#+)', lambda m: m.group(1) + '#' * n, s, flags=re.M)

design = re.sub(r'\A---\n.*?\n---\n', '', read('DESIGN.md'), flags=re.S)
res = read('docs/RESOURCES.md')
refs = read('docs/DESIGN-REFERENCES.md').split('\n', 1)[1]
refs = refs.replace("\nTo let Claude browse them, add their domains under the session's Allowed domains.", '')
decisions = read('docs/design-decisions.md')

md = f"""# Design Documents

**Salat** · prayer-times app · design reference

This document gathers every design decision, rule and reference for Salat in one place, so anyone joining can get up to speed.

- **Live app:** https://squashblossom.github.io/Salat/
- **Living design kit** (every colour, size, icon, component and motion, shown for real): https://squashblossom.github.io/Salat/kit.html
- **Source of truth in code:** `DESIGN.md` and `app/src/styles/tokens.css` in the GitHub repository SquashBlossom/Salat. If this document and the code ever disagree, the code wins.

## Design is for the look, not for control

The design galleries, skills and guidelines in this document are used **only for how Salat looks and feels**: its screens, buttons, menus, colours, type and motion.

They do **not** control the app's AI. The AI is controlled separately, in code, with **Lacuna Scheme**: the model proposes one short command, the code checks it against an allowed list, and only then does it run. Nothing in this document changes what the AI is allowed to do.

## Roles

- **The owner is the designer.** She decides how Salat looks, using the names in this document.
- **Claude is the engineer.** It builds exactly what is named, from the kit, and changes nothing else without asking.

{demote(section(res, '## 1. How to work', '## 2.')).replace('### 1. How to work', '## How to work')}
# Part 1 · The design language

{demote(design)}
# Part 2 · Apple's rules we follow

{demote(section(res, '## 2. Apple', '## 3.')).replace("### 2. Apple's rules we follow (Human Interface Guidelines)", '')}
{demote(section(res, '## 3. Motion rules', '## 4.')).replace('### 3. Motion rules', '## Motion rules')}
# Part 3 · Design galleries and skills

These came from two videos the owner shared. They are references for **visual elements** (what good screens, menus, buttons and posts look like), kept for when each piece of Salat is designed.

## Design galleries
{demote(refs)}
{demote(section(res, '## 4. Design skills', '## 5.')).replace('### 4. Design skills we looked at', '## Design skills we looked at')}
# Part 4 · Decisions on record

{decisions}
"""
# Markdown needs a blank line before a list
out = []
for line in md.split('\n'):
    if re.match(r'^(\d+\.|-) ', line) and out and out[-1].strip() and not re.match(r'^(\d+\.|-) |^\s', out[-1]) and not out[-1].startswith('|'):
        out.append('')
    out.append(line)
body = markdown.markdown('\n'.join(out), extensions=['tables', 'sane_lists'])
html = ('<!DOCTYPE html><html><head><meta charset="utf-8"><title>Design Documents</title><style>body{font-family:Arial,sans-serif} '
        'table{border-collapse:collapse} td,th{border:1px solid #bbb;padding:4px 8px;vertical-align:top} th{background:#eef2f7}</style></head>'
        f'<body>{body}</body></html>')
html = re.sub(r'>\s*\n\s*<', '><', html)
# Reader-facing wording: the Doc is read by people, not by Claude in the repo
for old, new in [
    ('· design reference</p>', f'· design reference · updated {date.today():%B} {date.today().day}, {date.today().year}</p>'),
    ('This file and the kit page', 'This document and the kit page'),
    ('(on the live site, or <code>npm run dev</code> then http://localhost:5173/kit.html)', 'on the live site'),
    ('(digest in <code>docs/RESOURCES.md</code> §2)', '(see Part 2)'),
    ('Rules that protect your design', 'Rules that protect the design'),
    ('marked <code>lang="ar"</code>; when Arabic shares a line with English or numbers, it is wrapped in isolates (<code>\u2068…\u2069</code>).',
     'marked as Arabic; when Arabic shares a line with English or numbers, it is wrapped in Unicode isolates so the order never breaks.'),
    ('(run <code>npm run tokens:swift -w app</code> after changing tokens)', '(made from the tokens)'),
    ('(yours to decide)', "(the owner's to decide)"),
    ('sources and her imam', "sources and a person's own imam"),
]:
    html = html.replace(old, new)
html = re.sub(r'<p>Design skills mentioned alongside.*?</p>', '', html, flags=re.S)
open(sys.argv[1], 'w', encoding='utf-8').write(html)
print(f'{len(html)} bytes, {html.count("<table")} tables')
