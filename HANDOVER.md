# Handover — Dev Hub site

_Last updated: 2026-05-23_

A running context doc so work can continue cleanly in a new chat. Only the **dev-hub**
folder (`D:\code\dev-hub`) needs to be connected to Cowork going forward.

## What this project is

A small, simple static site to share what Angie is building in public — the Book Machine,
Seedsmith, and other tools — alongside the FFA crew building their own machines on
different schemas (F1, Spices, Author Workbench, Investigation, Star Trek, commercial
kitchen, NASA mission control, etc.).

Three pages: **Home**, **Updates/Journal** (synced from Notion), and **Resources**.
Aesthetic matches the existing "Backroom" HTML files: wine / cream / gold, Georgia serif,
editorial feel.

## Key decisions (already made)

- **Hosting:** static pages, free on **GitHub Pages**. Also Railway-compatible.
- **Notion is the source of truth** for journal entries. Angie writes in Notion; the site reads from it.
- **Single author** — only Angie ever posts. Public-facing, not multi-user.
- **Updates feed = journal entries + screenshots** (no % bars or phase trackers).
- **Sync method = build-time sync** (chosen over a live Railway backend): a script pulls
  Notion entries into `data/entries.json` so the token never lands in the public site.
- Only entries with **Status = Published** appear on the site.

## Current state — what's built and verified

Everything below was built and tested (pages serve 200, JSON parses, feed renders 2 entries
with formatted dates + chips). The whole hub was **moved** from `the-backroom\hub` into
`D:\code\dev-hub` (cut-and-paste — the original no longer exists, nothing to clean up).

Files in `D:\code\dev-hub`:

| File | Purpose |
|------|---------|
| `index.html` | Home page (shows latest 3 entries) |
| `updates.html` | Full journal feed with per-project filter buttons |
| `resources.html` | Build docs & references; has a placeholder card for the Seedsmith build doc |
| `styles.css` | Shared wine/cream/gold styling |
| `feed.js` | Loads `data/entries.json`, renders the feed (compact + full modes) |
| `data/entries.json` | Synced journal data (currently 2 seed entries) |
| `scripts/sync-notion.js` | Node 18+ script; fetches Published entries from Notion → entries.json |
| `.github/workflows/sync-and-deploy.yml` | Optional auto-sync + deploy on GitHub (daily + on push) |
| `.gitignore` | Excludes `.env`, node_modules |
| `README.md` | Full setup/sync/deploy instructions |
| `dev-docs/the-backroom/` | Book Machine reference docs (see below) |

### dev-docs/the-backroom/
Generated Book Machine artifacts, in build order:
1. `FAMILY-MACHINE-visual-spec.html` — visual of the build spec
2. `BUILD-REVIEW.html` — what was actually built
3. `TEST-PLAN.html` — the test plan (Angie was running this as of this handover)

## The Notion database (already created + seeded)

- **Name:** "Book Machine Journal"
- **Database ID:** `ef77c7904a4643c7a91b97d1e29c9d55`
- **Data source ID:** `9b04d39c-310f-4888-a2f4-a1fb456c6db3`
- **Properties:** Title, Date, Body, Project (select: Book Machine, Seedsmith, F1, Spices,
  Author Workbench, Investigation, Star Trek, Commercial Kitchen, NASA Mission Control,
  General), Type (Journal/Milestone/Screenshot/Resource), Status (Published/Draft),
  Screenshot (files), Link (url).
- **Seeded with 2 published entries** ("Kicking off the hub", "Why Notion is the source of truth").

## Not done yet / open items

- [ ] **Disconnect the other folders** (the-backroom, Book Machine) in Cowork — manual step for Angie. Connect only dev-hub.
- [ ] **Create a Notion integration token** (notion.so/my-integrations) and connect the
      integration to the "Book Machine Journal" database, then run the first real sync:
      `NOTION_TOKEN=... node scripts/sync-notion.js`
- [ ] **Push to GitHub** and turn on Pages (or use the included Action with a `NOTION_TOKEN` repo secret).
- [ ] **Build out Resources** — link the real Seedsmith build doc; possibly surface the
      dev-docs (Family Machine spec / Build Review / Test Plan).
- [ ] Possible future: GitHub Action subfolder paths are noted in the workflow if the site
      ever lives in a subfolder (currently it's at repo root level inside dev-hub).

## Gotcha worth remembering

Screenshots attached directly to the Notion Screenshot field get Notion-hosted URLs that
**expire after ~1 hour**. Either re-sync on every deploy (the GitHub Action does this) or
paste a permanent external image URL into the Screenshot field.

## Suggested next steps for the new chat

1. Confirm dev-hub is the only connected folder.
2. Decide between: (a) wiring the Notion token + first real sync, (b) pushing to GitHub Pages,
   or (c) building out the Resources page with the dev-docs / Seedsmith build doc.
