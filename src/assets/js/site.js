/**
 * Site-wide behaviour. Vanilla ES modules — no jQuery.
 *
 * Replaces, with one accessible implementation each:
 *   - the mobile nav toggle previously duplicated in nav.html + 50 pages
 *   - three separate modal scripts (designer profile, image lightbox,
 *     service "View Steps") that had no keyboard handling at all
 *   - animate.css scroll effects
 */

/* ==================== HEADER: compress on scroll ==================== */
function initHeader() {
  const header = document.querySelector("[data-site-header]");
  if (!header) return;

  const update = () => {
    header.dataset.scrolled = String(window.scrollY > 12);
  };
  update();
  window.addEventListener("scroll", update, { passive: true });
}

/* ==================== MOBILE NAV DRAWER ==================== */
function initNavDrawer() {
  const toggle = document.querySelector("[data-nav-toggle]");
  const drawer = document.querySelector("[data-nav-drawer]");
  if (!toggle || !drawer) return;

  const FOCUSABLE =
    'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';
  let lastFocused = null;

  const open = () => {
    lastFocused = document.activeElement;
    drawer.hidden = false;
    // Force a style flush so the slide-in transition has a "from" state,
    // then set the open flag synchronously. Doing this via rAF alone is
    // unreliable — rAF does not fire in non-rendering contexts (a
    // background tab, a zero-height viewport), which would leave the
    // drawer permanently stuck closed.
    void drawer.offsetWidth;
    drawer.dataset.open = "true";
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close navigation menu");
    document.body.classList.add("is-scroll-locked");
    drawer.querySelector(FOCUSABLE)?.focus();
  };

  const close = () => {
    drawer.dataset.open = "false";
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open navigation menu");
    document.body.classList.remove("is-scroll-locked");
    lastFocused?.focus();
    // hide only after the slide-out finishes
    setTimeout(() => {
      if (drawer.dataset.open === "false") drawer.hidden = true;
    }, 400);
  };

  toggle.addEventListener("click", () =>
    drawer.dataset.open === "true" ? close() : open()
  );

  // Close on link tap
  drawer.addEventListener("click", (e) => {
    if (e.target.closest("a")) close();
  });

  // Escape closes; Tab is trapped inside the drawer while open
  document.addEventListener("keydown", (e) => {
    if (drawer.dataset.open !== "true") return;
    if (e.key === "Escape") {
      close();
      return;
    }
    if (e.key !== "Tab") return;

    const items = [...drawer.querySelectorAll(FOCUSABLE)];
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  // Reset when crossing to desktop layout
  const mq = window.matchMedia("(min-width: 900px)");
  mq.addEventListener("change", (e) => {
    if (e.matches && drawer.dataset.open === "true") close();
  });
}

/* ==================== MODALS ====================
   Native <dialog> gives us focus trapping, Escape handling and focus
   restoration for free — the three legacy modal scripts had none. */
function initModals() {
  document.addEventListener("click", (e) => {
    const opener = e.target.closest("[data-modal-open]");
    if (opener) {
      const dialog = document.getElementById(opener.dataset.modalOpen);
      if (dialog?.showModal) {
        dialog.showModal();
        document.body.classList.add("is-scroll-locked");
      }
      return;
    }

    const closer = e.target.closest("[data-modal-close]");
    if (closer) {
      closer.closest("dialog")?.close();
      return;
    }

    // Backdrop click — the dialog element itself is the backdrop area
    if (e.target.tagName === "DIALOG") e.target.close();
  });

  document.addEventListener("close", (e) => {
    if (e.target.tagName === "DIALOG" && !document.querySelector("dialog[open]")) {
      document.body.classList.remove("is-scroll-locked");
    }
  }, true);
}

/* ==================== IMAGE LIGHTBOX ==================== */
function initLightbox() {
  const lightbox = document.getElementById("lightbox");
  const target = lightbox?.querySelector("[data-lightbox-target]");
  if (!lightbox || !target) return;

  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-lightbox-src]");
    if (!trigger) return;
    e.stopPropagation();
    target.src = trigger.dataset.lightboxSrc;
    target.alt = trigger.alt || "";
    target.hidden = false;
    lightbox.showModal();
  });
}

/* ==================== SCROLL REVEAL ====================
   One shared IntersectionObserver replaces the 72KB animate.css. */
function initReveal() {
  // Signals to CSS that JS is live, which is what arms the hidden state.
  // Set before observing so nothing flashes visible then hides.
  document.documentElement.setAttribute("data-js-ready", "");

  const items = document.querySelectorAll("[data-reveal]");
  if (!items.length) return;

  if (
    !("IntersectionObserver" in window) ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    items.forEach((el) => (el.dataset.revealed = "true"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.dataset.revealed = "true";
        io.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
  );
  items.forEach((el) => io.observe(el));

  // Failsafe: content must never be left invisible. If the observer has
  // not fired within 2s — zero-height viewport, an odd embedding context,
  // a print request — reveal everything unconditionally. An animation
  // that does not play is a cosmetic loss; unreadable health content is
  // not an acceptable failure mode.
  setTimeout(() => {
    for (const el of items) {
      if (el.dataset.revealed !== "true") el.dataset.revealed = "true";
    }
  }, 2000);
}

/* ==================== DISCLOSURE ("Read More") ==================== */
function initDisclosure() {
  for (const btn of document.querySelectorAll("[data-disclosure]")) {
    const panel = document.getElementById(btn.getAttribute("aria-controls"));
    if (!panel) continue;

    const collapse = () => {
      panel.style.height = panel.scrollHeight + "px";
      requestAnimationFrame(() => (panel.style.height = "0px"));
    };
    panel.style.overflow = "hidden";
    panel.style.transition = "height var(--duration-slow) var(--ease-out)";
    if (btn.getAttribute("aria-expanded") !== "true") panel.style.height = "0px";

    btn.addEventListener("click", () => {
      const isOpen = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!isOpen));
      btn.textContent = isOpen ? btn.dataset.labelClosed : btn.dataset.labelOpen;

      if (isOpen) {
        collapse();
      } else {
        panel.style.height = panel.scrollHeight + "px";
        panel.addEventListener(
          "transitionend",
          () => {
            if (btn.getAttribute("aria-expanded") === "true")
              panel.style.height = "auto";
          },
          { once: true }
        );
      }
    });
  }
}

/* ==================== BOOT ==================== */
function boot() {
  initHeader();
  initNavDrawer();
  initModals();
  initLightbox();
  initReveal();
  initDisclosure();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
