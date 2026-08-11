/**
 * Accessible tabs (WAI-ARIA Authoring Practices roving tabindex).
 * Replaces the legacy "View Steps" modals, which had no keyboard support.
 */
function initTabs() {
  for (const tablist of document.querySelectorAll('[role="tablist"]')) {
    const tabs = [...tablist.querySelectorAll('[role="tab"]')];
    if (!tabs.length) continue;

    const select = (tab, { focus = true } = {}) => {
      for (const t of tabs) {
        const selected = t === tab;
        t.setAttribute("aria-selected", String(selected));
        t.tabIndex = selected ? 0 : -1;
        const panel = document.getElementById(t.getAttribute("aria-controls"));
        if (panel) panel.hidden = !selected;
      }
      if (focus) tab.focus();
      // Re-run reveal for content that was hidden when the observer first ran
      for (const el of document
        .getElementById(tab.getAttribute("aria-controls"))
        ?.querySelectorAll("[data-reveal]") ?? []) {
        el.dataset.revealed = "true";
      }
    };

    tablist.addEventListener("click", (e) => {
      const tab = e.target.closest('[role="tab"]');
      if (tab) select(tab, { focus: false });
    });

    tablist.addEventListener("keydown", (e) => {
      const i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      let next = null;
      if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
      else if (e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (e.key === "Home") next = tabs[0];
      else if (e.key === "End") next = tabs[tabs.length - 1];
      if (next) {
        e.preventDefault();
        select(next);
      }
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initTabs);
} else {
  initTabs();
}
