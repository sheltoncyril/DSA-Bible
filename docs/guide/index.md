# How this book works

This site is built from plain Markdown files in the `docs/` folder with [MkDocs Material](https://squidfunk.github.io/mkdocs-material/). Every push to the default branch rebuilds it and publishes it to GitHub Pages.

## Adding a chapter

The quickest way: open a Claude Code session on this repo and say something like

> I'm confused about **\<topic\>**, specifically **\<the part that confuses me\>**. Add a chapter.

The repo's `CLAUDE.md` describes the house style (big idea first, derive before stating, demo, misconceptions, check-yourself), so new chapters stay consistent with the existing ones.

By hand:

1. Copy `templates/chapter.md` into the right folder under `docs/` (make a new folder for a new part, e.g. `docs/graphs/`).
2. Add it to the `nav:` section of `mkdocs.yml`.
3. Preview locally (below).

## Previewing locally

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
mkdocs serve            # http://127.0.0.1:8000, reloads on save
mkdocs build --strict   # same check CI runs; fails on broken links
```

## Publishing

`.github/workflows/deploy.yml` builds with `mkdocs build --strict` and deploys to GitHub Pages on every push to the repository's default branch. One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

## Writing conventions

- **One confusing idea per chapter.** Put the idea in a `big-idea` box at the top.
- **Derive, don't state.** Show *why* the base case is what it is, don't just assert it.
- **Demo before details.** Give the reader something to poke as early as you can.
- **Name the confusions.** A "questions that usually cause the confusion" section, written the way a confused person would actually ask them.
- **Check yourself** at the end, answers in collapsible `??? question` blocks.

Useful Markdown features (all enabled):

```markdown
<div class="big-idea"><strong>Big idea:</strong> …</div>

!!! tip "Title"          (also: note, warning, example, question)
    Indented body.

??? question "Collapsed question"
    Hidden answer.

=== "Python"
    ```python
    ...
    ```
=== "Java"
    ```java
    ...
    ```
```

See the [demo reference](demos.md) for the interactive widgets.
