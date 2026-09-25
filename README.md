# DSA Bible

A personal, interactive textbook for the data-structures & algorithms ideas that are hard to get the first time. Built with [MkDocs Material](https://squidfunk.github.io/mkdocs-material/), published to GitHub Pages.

**Read it:** https://sheltoncyril.github.io/DSA-Bible/

## Contents

- **Trees & Recursion**: thinking recursively, tree height (with a step-through call-stack visualizer), depth vs height, the one-template-many-problems catalog, and practice problems.

## Local preview

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
mkdocs serve
```

## Publishing

Pushes to the default branch run `.github/workflows/deploy.yml`, which builds the site and deploys it to GitHub Pages.
One-time setup: **Settings → Pages → Source: GitHub Actions**.

## Adding chapters

See [`docs/guide/index.md`](docs/guide/index.md) and [`CLAUDE.md`](CLAUDE.md). Start from [`templates/chapter.md`](templates/chapter.md).
