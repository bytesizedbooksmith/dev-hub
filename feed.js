/* ============================================================
   feed.js — loads data/entries.json and renders the journal.
   Shared by index.html (compact) and updates.html (full).
   ============================================================ */
(function () {
  let cache = null;
  let activeProject = "All";

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function fmtDate(iso) {
    if (!iso) return "";
    // iso like 2026-05-23
    const parts = iso.split("-");
    if (parts.length < 3) return iso;
    const d = new Date(Date.UTC(+parts[0], +parts[1] - 1, +parts[2]));
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
  }

  function load() {
    if (cache) return Promise.resolve(cache);
    return fetch("data/entries.json", { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (json) {
        cache = json;
        return json;
      });
  }

  function entryHtml(e, compact) {
    const typeClass = "type-" + String(e.type || "journal").toLowerCase();
    const shot = e.screenshot
      ? '<div class="shot"><img src="' + escapeHtml(e.screenshot) + '" alt="' + escapeHtml(e.title) + ' screenshot" loading="lazy" /></div>'
      : "";
    let raw = String(e.body || "");
    if (compact && raw.length > 220) raw = raw.slice(0, 220).replace(/\s+\S*$/, "") + "…";
    // Split on blank lines into paragraphs; collapse single newlines to spaces.
    const body = raw
      .split(/\n{2,}/)
      .map(function (para) {
        const text = escapeHtml(para.replace(/\s*\n\s*/g, " ").trim());
        return text ? "<p>" + text + "</p>" : "";
      })
      .filter(Boolean)
      .join("");
    const link = e.link
      ? '<div class="more"><a href="' + escapeHtml(e.link) + '" target="_blank" rel="noopener">Open link &rarr;</a></div>'
      : "";
    return [
      '<article class="entry">',
      '  <div class="meta">',
      '    <span class="date">' + fmtDate(e.date) + "</span>",
      e.type ? '<span class="chip ' + typeClass + '">' + escapeHtml(e.type) + "</span>" : "",
      e.project ? '<span class="chip">' + escapeHtml(e.project) + "</span>" : "",
      "  </div>",
      "  <h3>" + escapeHtml(e.title) + "</h3>",
      '  <div class="body">' + body + "</div>",
      compact ? "" : shot,
      compact ? "" : link,
      "</article>",
    ].join("\n");
  }

  function projectsFrom(entries) {
    const set = [];
    entries.forEach(function (e) {
      if (e.project && set.indexOf(e.project) === -1) set.push(e.project);
    });
    return set.sort();
  }

  window.renderFeed = function (opts) {
    opts = opts || {};
    const target = document.getElementById(opts.target);
    if (!target) return;

    load()
      .then(function (json) {
        let entries = (json.entries || []).slice();
        // newest first
        entries.sort(function (a, b) { return (b.date || "").localeCompare(a.date || ""); });

        // optional project filter UI (full page only)
        if (opts.filters) {
          const fbox = document.getElementById(opts.filters);
          if (fbox && !fbox.dataset.built) {
            const projects = ["All"].concat(projectsFrom(entries));
            fbox.innerHTML = projects
              .map(function (p) {
                return '<button data-project="' + escapeHtml(p) + '"' + (p === "All" ? ' class="active"' : "") + ">" + escapeHtml(p) + "</button>";
              })
              .join("");
            fbox.dataset.built = "1";
            fbox.addEventListener("click", function (ev) {
              const btn = ev.target.closest("button");
              if (!btn) return;
              activeProject = btn.dataset.project;
              Array.prototype.forEach.call(fbox.querySelectorAll("button"), function (b) {
                b.classList.toggle("active", b === btn);
              });
              window.renderFeed(opts);
            });
          }
        }

        if (activeProject && activeProject !== "All") {
          entries = entries.filter(function (e) { return e.project === activeProject; });
        }
        if (opts.limit) entries = entries.slice(0, opts.limit);

        if (!entries.length) {
          target.innerHTML = '<p class="empty">No entries yet. Write one in Notion and run the sync.</p>';
          return;
        }
        target.innerHTML = entries
          .map(function (e) { return entryHtml(e, !!opts.compact); })
          .join("\n");
      })
      .catch(function (err) {
        target.innerHTML =
          '<p class="empty">Could not load entries (' + escapeHtml(err.message) +
          "). If you opened this file directly, run it through a local server &mdash; see the README.</p>";
      });
  };
})();
