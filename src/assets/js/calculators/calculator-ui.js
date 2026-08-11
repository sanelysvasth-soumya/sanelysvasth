/**
 * Calculator UI controller — PRESENTATION ONLY.
 *
 * Separation of concerns: this file knows about the DOM, validation
 * messaging and result choreography. It knows NOTHING about how any
 * number is derived. All arithmetic lives in engines.js, which is pure
 * and covered by test/calculators.baseline.test.js.
 *
 * One controller drives all 11 calculators; a page supplies a config
 * describing its fields and how to render its result.
 */

/* ---------------- field reading ---------------- */

function readField(form, name, type) {
  const el = form.elements[name];
  if (!el) return undefined;

  if (type === "radio") {
    const checked = form.querySelector(`input[name="${name}"]:checked`);
    return checked ? checked.value : "";
  }
  if (type === "number") {
    return el.value === "" ? NaN : parseFloat(el.value);
  }
  if (type === "int") {
    return el.value === "" ? NaN : parseInt(el.value, 10);
  }
  return el.value;
}

/* ---------------- inline validation ---------------- */

function fieldWrapper(form, name) {
  const el = form.elements[name];
  const node = el instanceof RadioNodeList ? el[0] : el;
  return node?.closest(".field") ?? null;
}

function setFieldError(form, name, message) {
  const wrap = fieldWrapper(form, name);
  if (!wrap) return;
  wrap.dataset.invalid = "true";
  const slot = wrap.querySelector(".field__error");
  if (slot) slot.textContent = message;
  const control = wrap.querySelector(".control");
  control?.setAttribute("aria-invalid", "true");
}

function clearFieldError(form, name) {
  const wrap = fieldWrapper(form, name);
  if (!wrap) return;
  delete wrap.dataset.invalid;
  wrap.querySelector(".control")?.removeAttribute("aria-invalid");
}

function clearAllErrors(form, fields) {
  for (const f of fields) clearFieldError(form, f.name);
  const summary = form.querySelector("[data-form-summary]");
  if (summary) {
    summary.dataset.visible = "false";
    summary.innerHTML = "";
  }
}

function showSummary(form, messages) {
  const summary = form.querySelector("[data-form-summary]");
  if (!summary) return;
  summary.innerHTML =
    messages.length === 1
      ? `<p>${messages[0]}</p>`
      : `<p>Please fix the following:</p><ul>${messages
          .map((m) => `<li>${m}</li>`)
          .join("")}</ul>`;
  summary.dataset.visible = "true";
}

/**
 * Presentation-level checks only: "is this field filled in and a number".
 * Domain range rules (e.g. weight 30-300kg) stay in the engine, so the
 * engine remains the single source of truth for accept/reject.
 */
function validatePresence(form, fields) {
  const errors = [];
  for (const f of fields) {
    if (f.optional) continue;
    const value = readField(form, f.name, f.type);

    const missing =
      value === "" ||
      value === undefined ||
      (typeof value === "number" && Number.isNaN(value));

    if (missing) {
      const msg = f.requiredMessage ?? `Enter ${f.label.toLowerCase()}.`;
      setFieldError(form, f.name, msg);
      errors.push(msg);
    }
  }
  return errors;
}

/* ---------------- controller ---------------- */

/**
 * @param {object} config
 * @param {string}   config.formId     id of the <form>
 * @param {string}   config.resultId   id of the result container
 * @param {Array}    config.fields     [{ name, type, label, requiredMessage?, optional? }]
 * @param {Function} config.compute    (values) => engine result object
 * @param {Function} config.render     (result, resultEl) => void
 */
export function createCalculator(config) {
  const form = document.getElementById(config.formId);
  const resultEl = document.getElementById(config.resultId);
  if (!form || !resultEl) return;

  const status = form.querySelector("[data-calc-status]");

  /* Clear a field's error as soon as the user edits it. */
  form.addEventListener("input", (e) => {
    const wrap = e.target.closest(".field");
    if (wrap?.dataset.invalid) {
      delete wrap.dataset.invalid;
      e.target.removeAttribute("aria-invalid");
    }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    clearAllErrors(form, config.fields);

    /* 1 — presence check (UI concern) */
    const presenceErrors = validatePresence(form, config.fields);
    if (presenceErrors.length) {
      showSummary(form, presenceErrors);
      form.querySelector('[data-invalid="true"] .control')?.focus();
      return;
    }

    /* 2 — collect values */
    const values = {};
    for (const f of config.fields) {
      values[f.key ?? f.name] = readField(form, f.name, f.type);
    }

    /* 3 — delegate to the pure engine (domain rules live there) */
    const result = config.compute(values);

    if (!result.ok) {
      showSummary(form, [result.error]);
      if (result.field) setFieldError(form, result.field, result.error);
      resultEl.hidden = true;
      return;
    }

    /* 4 — render */
    config.render(result, resultEl);
    resultEl.hidden = false;
    resultEl.dataset.revealed = "true";
    if (status) status.textContent = config.statusMessage ?? "Result ready.";

    /* Bring the result into view on small screens, where it sits
       below the fold under the input panel. */
    if (window.matchMedia("(max-width: 899px)").matches) {
      resultEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  /* Reset returns to a clean input state. */
  form.addEventListener("reset", () => {
    clearAllErrors(form, config.fields);
    resultEl.hidden = true;
    delete resultEl.dataset.revealed;
    if (status) status.textContent = "";
  });
}

/* ---------------- small render helpers ---------------- */

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else node.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c == null) continue;
    node.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return node;
}

/** Maps a calculator category label onto a semantic badge tone. */
export function toneForCategory(category = "") {
  const c = category.toLowerCase();
  if (/(severely|highly obese|abnormally|obesity class ii)/.test(c)) return "danger";
  if (/(under|over|obesity|extremely|increased risk|slim)/.test(c)) return "warning";
  if (/(normal|healthy|slender)/.test(c)) return "success";
  return "";
}
