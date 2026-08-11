/**
 * Content-page behaviour: reading progress, auto table of contents,
 * recipe checklists with persisted progress, and collection filtering.
 *
 * Loaded only on pages that need it (article, recipe, hub) rather than
 * site-wide — the legacy site shipped jQuery to every page regardless.
 */

/* ==================== READING PROGRESS ==================== */
function initReadingProgress() {
  const bar = document.querySelector("[data-reading-progress]");
  const body = document.querySelector("[data-article-body]");
  if (!bar || !body) return;

  let ticking = false;
  const update = () => {
    const rect = body.getBoundingClientRect();
    const total = rect.height - window.innerHeight;
    const scrolled = -rect.top;
    const pct = total <= 0 ? 100 : Math.min(100, Math.max(0, (scrolled / total) * 100));
    bar.style.width = pct + "%";
    ticking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true }
  );
  update();
}

/* ==================== TABLE OF CONTENTS ==================== */
function initToc() {
  const toc = document.querySelector("[data-toc]");
  const list = document.querySelector("[data-toc-list]");
  const body = document.querySelector("[data-article-body]");
  if (!toc || !list || !body) return;

  // The shared consultation CTA is appended inside the article body by
  // layouts/post.njk, but it is furniture rather than a section of the piece —
  // its heading must never become a contents entry.
  const headings = [...body.querySelectorAll("h2, h3")].filter(
    (h) => h.textContent.trim() && !h.closest(".cta-panel")
  );
  // Two sections is still worth navigating — "19 Easy Meal Ideas for Acidity
  // and Bloating Relief" has exactly two, and they are the whole structure of
  // the piece. Only a single heading (or none) is not worth a contents list.
  if (headings.length < 2) return;

  const slug = (s) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

  const used = new Set();
  for (const h of headings) {
    if (!h.id) {
      let id = slug(h.textContent);
      let n = 2;
      while (used.has(id) || document.getElementById(id)) id = `${slug(h.textContent)}-${n++}`;
      h.id = id;
    }
    used.add(h.id);

    const li = document.createElement("li");
    li.dataset.level = h.tagName === "H3" ? "3" : "2";
    const a = document.createElement("a");
    a.href = `#${h.id}`;
    a.textContent = h.textContent.trim();
    li.append(a);
    list.append(li);
  }
  toc.hidden = false;

  // Highlight the section currently in view
  const links = new Map([...list.querySelectorAll("a")].map((a) => [a.hash.slice(1), a]));
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        for (const a of links.values()) a.removeAttribute("aria-current");
        links.get(e.target.id)?.setAttribute("aria-current", "true");
      }
    },
    { rootMargin: "-10% 0px -75% 0px" }
  );
  headings.forEach((h) => io.observe(h));
}

/* ==================== RECIPE CHECKLISTS ==================== */
/**
 * Progress persists in localStorage so a half-cooked recipe survives a
 * page refresh or an accidental back-navigation.
 */
function initChecklists() {
  for (const list of document.querySelectorAll("[data-checklist]")) {
    const key = "svasth:" + list.dataset.checklist;
    const boxes = [...list.querySelectorAll("[data-checklist-item]")];
    if (!boxes.length) continue;

    const kind = list.dataset.checklist.startsWith("method") ? "method" : "ingredients";
    const readout = document.querySelector(`[data-progress-for="${kind}"]`);

    let saved = [];
    try {
      saved = JSON.parse(localStorage.getItem(key) || "[]");
    } catch {
      saved = [];
    }
    boxes.forEach((b, i) => {
      if (saved.includes(i)) b.checked = true;
    });

    const render = () => {
      const done = boxes.filter((b) => b.checked).length;
      if (readout) {
        readout.textContent = done
          ? `${done} of ${boxes.length} done`
          : `${boxes.length} ${kind === "method" ? "steps" : "items"}`;
      }
    };

    const save = () => {
      const checked = boxes.map((b, i) => (b.checked ? i : -1)).filter((i) => i >= 0);
      try {
        localStorage.setItem(key, JSON.stringify(checked));
      } catch {
        /* private mode — progress simply won't persist */
      }
      render();
    };

    list.addEventListener("change", (e) => {
      if (e.target.matches("[data-checklist-item]")) save();
    });
    render();
  }

  document.querySelector("[data-recipe-reset]")?.addEventListener("click", () => {
    for (const list of document.querySelectorAll("[data-checklist]")) {
      try {
        localStorage.removeItem("svasth:" + list.dataset.checklist);
      } catch {
        /* ignore */
      }
      list.querySelectorAll("[data-checklist-item]").forEach((b) => (b.checked = false));
      list.dispatchEvent(new Event("change", { bubbles: true }));
    }
    initChecklists();
  });
}

/* ==================== COLLECTION FILTER ==================== */
function initCollectionFilter() {
  const grid = document.querySelector("[data-collection-grid]");
  if (!grid) return;

  const items = [...grid.querySelectorAll("[data-item]")];
  const search = document.querySelector("[data-collection-search]");
  const chips = [...document.querySelectorAll("[data-filter]")];
  const count = document.querySelector("[data-collection-count]");
  const empty = document.querySelector("[data-collection-empty]");

  let term = "";
  let category = "all";

  const apply = () => {
    let shown = 0;
    for (const item of items) {
      const matchesCat = category === "all" || item.dataset.category === category;
      const matchesTerm = !term || (item.dataset.search || "").includes(term);
      const visible = matchesCat && matchesTerm;
      item.hidden = !visible;
      if (visible) shown++;
    }
    if (count) {
      count.textContent =
        shown === items.length
          ? `${items.length} ${items.length === 1 ? "item" : "items"}`
          : `${shown} of ${items.length} shown`;
    }
    if (empty) empty.hidden = shown > 0;
    grid.hidden = shown === 0;
  };

  // Debounced so typing stays smooth on the 30-item grids
  let t;
  search?.addEventListener("input", (e) => {
    clearTimeout(t);
    t = setTimeout(() => {
      term = e.target.value.trim().toLowerCase();
      apply();
    }, 120);
  });

  for (const chip of chips) {
    chip.addEventListener("click", () => {
      category = chip.dataset.filter;
      for (const c of chips) c.setAttribute("aria-pressed", String(c === chip));
      apply();
    });
  }

  document.querySelector("[data-collection-clear]")?.addEventListener("click", () => {
    term = "";
    category = "all";
    if (search) search.value = "";
    for (const c of chips) c.setAttribute("aria-pressed", String(c.dataset.filter === "all"));
    apply();
    search?.focus();
  });

  apply();
}

/* ==================== BOOT ==================== */
function boot() {
  initReadingProgress();
  initToc();
  initChecklists();
  initCollectionFilter();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
