/**
 * Global theme control — one state, one control, every page.
 *
 * The initial value is applied by a tiny blocking snippet in <head>
 * (see layouts/base.njk) so the correct theme is on <html> before first
 * paint and there is no flash. This module only handles the toggle and
 * persistence afterwards.
 *
 * Resolution order: saved choice → system preference → light.
 */
const KEY = "svasth:theme";

export function getStored() {
  try {
    const v = localStorage.getItem(KEY);
    return v === "dark" || v === "light" ? v : null;
  } catch {
    return null;
  }
}

export function systemPref() {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function current() {
  return document.documentElement.dataset.theme || getStored() || systemPref();
}

export function apply(theme, { persist = true } = {}) {
  document.documentElement.dataset.theme = theme;
  if (persist) {
    try {
      localStorage.setItem(KEY, theme);
    } catch {
      /* private mode — the choice just won't survive the session */
    }
  }
  for (const btn of document.querySelectorAll("[data-theme-toggle]")) {
    btn.setAttribute("aria-pressed", String(theme === "dark"));
    btn.setAttribute(
      "aria-label",
      theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
    );
    const label = btn.querySelector("[data-theme-label]");
    if (label) label.textContent = theme === "dark" ? "Light" : "Dark";
  }
  window.dispatchEvent(new CustomEvent("themechange", { detail: { theme } }));
}

function init() {
  // sync control state with whatever the head snippet resolved
  apply(current(), { persist: false });

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-theme-toggle]");
    if (!btn) return;
    apply(current() === "dark" ? "light" : "dark");
  });

  // follow the system only while the user has not chosen for themselves
  window.matchMedia?.("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    if (!getStored()) apply(e.matches ? "dark" : "light", { persist: false });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
