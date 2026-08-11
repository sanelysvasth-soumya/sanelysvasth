/**
 * Contact form.
 *
 * ⚠️ DATA CONTRACT — PRESERVED EXACTLY FROM THE LEGACY IMPLEMENTATION.
 * Do not "modernise" the transport. The Google Apps Script endpoint does
 * not send CORS headers, so a plain fetch() would be blocked. The legacy
 * page worked around this by POSTing a synthesised form from a hidden
 * iframe, and that mechanism is reproduced verbatim here:
 *
 *   endpoint : script.google.com/macros/s/AKfycbz…/exec
 *   payload  : sheetName="Leads", Name, Contact, Subject, Message
 *   response : unreadable (opaque cross-origin) — success is optimistic
 *
 * The tab was renamed Sheet4 -> Leads in the spreadsheet; only the
 * sheetName value changed, the field names are unchanged.
 *
 * Only the surrounding UX changed: real inline validation, a proper
 * button loading state, and a success panel that replaces the form.
 */

import { validatePhone, attachPhoneInput } from "./phone.js";

const ENDPOINT =
  "https://script.google.com/macros/s/AKfycbzWpa98yHvCTYfp0aiOrScOgGhXxZ5EXR6v2cSUtTnhEQpj9fzYhyOWlIacKgxA53vGBA/exec";
const SHEET_NAME = "Leads";

/* ---------------- validation ---------------- */
const RULES = [
  { name: "Name", id: "cf-name", message: "Enter your name." },
  {
    name: "Contact",
    id: "cf-contact",
    message: "Enter a contact number we can reach you on.",
    // Shared international rule — see assets/js/phone.js
    validate: (v) => validatePhone(v),
  },
  { name: "Subject", id: "cf-subject", message: "Add a subject." },
  {
    name: "Message",
    id: "cf-message",
    message: "Write your message.",
    valid: (v) => v.length >= 10,
    invalidMessage: "Your message is a little short — add a bit more detail.",
  },
];

function setError(form, rule, message) {
  const field = form.elements[rule.name]?.closest(".field");
  if (!field) return;
  field.dataset.invalid = "true";
  const slot = document.getElementById(`${rule.id}-error`);
  if (slot) slot.textContent = message;
  form.elements[rule.name]?.setAttribute("aria-invalid", "true");
}

function clearError(form, rule) {
  const field = form.elements[rule.name]?.closest(".field");
  if (!field) return;
  delete field.dataset.invalid;
  form.elements[rule.name]?.removeAttribute("aria-invalid");
}

function validate(form) {
  const errors = [];
  for (const rule of RULES) {
    clearError(form, rule);
    const value = (form.elements[rule.name]?.value ?? "").trim();
    if (!value) {
      setError(form, rule, rule.message);
      errors.push(rule.message);
    } else if (rule.validate) {
      const result = rule.validate(value);
      if (!result.ok) {
        setError(form, rule, result.error);
        errors.push(result.error);
      }
    } else if (rule.valid && !rule.valid(value)) {
      setError(form, rule, rule.invalidMessage);
      errors.push(rule.invalidMessage);
    }
  }
  return errors;
}

/* ---------------- submission (legacy transport) ---------------- */
function postViaIframe(data) {
  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  document.body.appendChild(iframe);

  const form = document.createElement("form");
  form.method = "POST";
  form.action = ENDPOINT;

  for (const [key, value] of Object.entries(data)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = value;
    form.appendChild(input);
  }

  iframe.contentDocument.body.appendChild(form);
  form.submit();

  // Matches the legacy 2s settle before the iframe is torn down.
  return new Promise((resolve) =>
    setTimeout(() => {
      iframe.remove();
      resolve();
    }, 2000)
  );
}

/* ---------------- wiring ---------------- */
function initContactForm() {
  const form = document.getElementById("contactForm");
  const success = document.getElementById("formStatus");
  const btn = document.getElementById("submitBtn");
  const summary = form?.querySelector("[data-form-summary]");
  if (!form || !btn) return;

  // Clear a field's error as soon as it is edited
  form.addEventListener("input", (e) => {
    const field = e.target.closest(".field");
    if (field?.dataset.invalid) {
      delete field.dataset.invalid;
      e.target.removeAttribute("aria-invalid");
    }
  });

  attachPhoneInput(document.getElementById("cf-contact"));

  // Live character counter
  const counter = document.querySelector("[data-char-counter]");
  const message = document.getElementById("cf-message");
  if (counter && message) {
    const max = message.getAttribute("maxlength") ?? 1500;
    message.addEventListener("input", () => {
      counter.textContent = `${message.value.length} / ${max}`;
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const errors = validate(form);
    if (errors.length) {
      if (summary) {
        summary.innerHTML =
          errors.length === 1
            ? `<p>${errors[0]}</p>`
            : `<p>Please fix the following:</p><ul>${errors.map((m) => `<li>${m}</li>`).join("")}</ul>`;
        summary.dataset.visible = "true";
      }
      form.querySelector('[data-invalid="true"] .control')?.focus();
      return;
    }
    if (summary) summary.dataset.visible = "false";

    btn.dataset.loading = "true";
    btn.disabled = true;

    // Payload shape is part of the contract — sheetName first, then fields.
    const payload = { sheetName: SHEET_NAME };
    for (const [key, value] of new FormData(form).entries()) payload[key] = value;

    try {
      await postViaIframe(payload);
    } finally {
      delete btn.dataset.loading;
      btn.disabled = false;
    }

    form.hidden = true;
    if (success) {
      success.hidden = false;
      success.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    form.reset();
    if (counter) counter.textContent = "0 / 1500";
  });

  document.querySelector("[data-send-another]")?.addEventListener("click", () => {
    if (success) success.hidden = true;
    form.hidden = false;
    form.elements.Name?.focus();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initContactForm);
} else {
  initContactForm();
}
