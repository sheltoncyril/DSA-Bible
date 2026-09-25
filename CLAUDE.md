# DSA Bible: notes for Claude

This repo is a personal, interactive DSA textbook published with MkDocs Material to GitHub Pages.
The owner adds a chapter whenever a concept doesn't click. Typical request: "I'm confused about X, add a chapter."

## Layout

- `docs/` holds the site. Each part is a folder (`docs/trees/`), and each part has an `index.md` overview.
- `docs/assets/js/tree-lab.js` holds the interactive tree widgets (`tree-lab`, `tree-ask`, `tree-measure`). Reference: `docs/guide/demos.md`.
- `docs/assets/css/` holds `book.css` (site-wide) and `tree-lab.css` (widgets).
- `templates/chapter.md` is the skeleton for new chapters.
- `mkdocs.yml`: **every new page must be added to `nav:`**.
- `.github/workflows/deploy.yml` builds with `--strict` and deploys on pushes to the default branch.

## Writing a chapter

Goal: build *intuition*, not just a reference. The owner wants to understand, not memorise.

1. Open with a `<div class="big-idea">` that states the whole idea in one or two sentences.
2. Say why it's confusing. Name the wrong mental model people usually have.
3. **Derive, don't assert.** For example, the height chapter derives the `-1` base case from "a leaf must be 0".
4. Give a concrete analogy (the org-chart manager, rulers for edges vs nodes).
5. Put an **interactive demo** early. Reuse the existing widgets; add a new problem to `PROBLEMS` if needed; write a new `*-lab.js` for a new topic.
6. Show code in tabs (Python first; add Java/C++/JS for core algorithms).
7. Include a "questions that usually cause the confusion" section as `??? question` blocks, phrased the way a confused person would ask them.
8. Add a common-bugs table (bug | symptom | fix) and a cost section (time and space, with the reason).
9. End with "Check yourself" `??? question` blocks.
10. Link back to earlier chapters instead of re-explaining them. Link forward when a later chapter goes deeper.

Style: second person, short paragraphs, plain words. Bold the one phrase per paragraph that matters. No filler intros.

## Demos

- Trees use LeetCode level order (`[A,B,null,C]`). Use **letter labels** when the demo computes numbers, so labels are never mistaken for answers.
- New widget scripts: plain ES5-style JS, no dependencies, no build step. Initialise on `document$` (Material) with a DOMContentLoaded fallback. Colours come from CSS variables with a `[data-md-color-scheme="slate"]` override.
- Don't make widgets depend on network access or external libraries.

## Checking your work

```bash
pip install -r requirements.txt
mkdocs build --strict      # must pass: CI runs the same thing
```

For demo changes, also load the built page in a headless browser (Playwright/Chromium), check for console errors, and step a widget through to the end.
