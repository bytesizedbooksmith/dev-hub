#!/usr/bin/env node
/* ============================================================
   sync-notion.js
   Build-time sync: fetches Published entries from the Notion
   "Book Machine Journal" database and writes them to
   data/entries.json, which the static site reads.

   The Notion token stays in an environment variable and is
   NEVER written into the site, so the published site has no secret.

   Usage:
     NOTION_TOKEN=secret_xxx node scripts/sync-notion.js

   Requires Node 18+ (uses the built-in global fetch).
   ============================================================ */

const fs = require("fs");
const path = require("path");

// --- config ---------------------------------------------------
const NOTION_TOKEN = process.env.NOTION_TOKEN;
// Database (not data source) id of "Book Machine Journal".
const DATABASE_ID = process.env.NOTION_DATABASE_ID || "ef77c7904a4643c7a91b97d1e29c9d55";
const NOTION_VERSION = "2022-06-28";
const OUT_FILE = path.join(__dirname, "..", "data", "entries.json");

if (!NOTION_TOKEN) {
  console.error("\nMissing NOTION_TOKEN environment variable.");
  console.error("Run like:  NOTION_TOKEN=secret_xxx node scripts/sync-notion.js\n");
  process.exit(1);
}

// --- helpers --------------------------------------------------
function plain(richArr) {
  if (!Array.isArray(richArr)) return "";
  return richArr.map((r) => r.plain_text || "").join("");
}

function firstFileUrl(filesProp) {
  if (!filesProp || !Array.isArray(filesProp.files) || !filesProp.files.length) return "";
  const f = filesProp.files[0];
  if (f.type === "external") return f.external.url;
  if (f.type === "file") return f.file.url; // note: Notion-hosted file URLs expire (~1h)
  return "";
}

function getSelect(prop) {
  return prop && prop.select ? prop.select.name : "";
}

async function queryDatabase() {
  const url = `https://api.notion.com/v1/databases/${DATABASE_ID}/query`;
  const results = [];
  let cursor = undefined;

  do {
    const body = {
      page_size: 100,
      filter: { property: "Status", select: { equals: "Published" } },
      sorts: [{ property: "Date", direction: "descending" }],
    };
    if (cursor) body.start_cursor = cursor;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${NOTION_TOKEN}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Notion API ${res.status}: ${text}`);
    }
    const json = await res.json();
    results.push(...json.results);
    cursor = json.has_more ? json.next_cursor : undefined;
  } while (cursor);

  return results;
}

function mapPage(page) {
  const p = page.properties || {};
  return {
    id: page.id,
    title: plain(p.Title && p.Title.title) || "(untitled)",
    date: (p.Date && p.Date.date && p.Date.date.start) || "",
    project: getSelect(p.Project),
    type: getSelect(p.Type) || "Journal",
    body: plain(p.Body && p.Body.rich_text),
    screenshot: firstFileUrl(p.Screenshot),
    link: (p.Link && p.Link.url) || "",
    notionUrl: page.url || "",
  };
}

// --- main -----------------------------------------------------
(async function main() {
  try {
    console.log("Fetching Published entries from Notion…");
    const pages = await queryDatabase();
    const entries = pages.map(mapPage);

    const out = {
      generatedAt: new Date().toISOString().slice(0, 10),
      entries,
    };

    fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
    fs.writeFileSync(OUT_FILE, JSON.stringify(out, null, 2) + "\n", "utf8");

    console.log(`Wrote ${entries.length} entr${entries.length === 1 ? "y" : "ies"} to data/entries.json`);
    if (entries.some((e) => e.screenshot && e.screenshot.includes("amazonaws"))) {
      console.log(
        "\nNote: one or more screenshots are Notion-hosted files whose URLs expire after ~1 hour.\n" +
          "For permanent images, either (a) re-run this sync as part of every deploy, or\n" +
          "(b) paste an external image URL into the Screenshot field instead."
      );
    }
  } catch (err) {
    console.error("\nSync failed:", err.message);
    process.exit(1);
  }
})();
