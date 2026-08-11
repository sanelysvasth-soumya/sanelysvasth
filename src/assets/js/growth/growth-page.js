/**
 * Growth chart page controller — PRESENTATION ONLY.
 * Percentile logic lives in growth-engine.js; drawing in growth-chart.js.
 */

import { classify } from "./growth-engine.js";
import { renderGrowthChart } from "./growth-chart.js";

function toneFor(percentile) {
  if (/above 97th|below (1st|3rd)/.test(percentile)) return "warning";
  if (/50th|75th-90th|25th-50th/.test(percentile)) return "success";
  return "info";
}

async function init() {
  const root = document.querySelector("[data-growth]");
  if (!root) return;

  const key = root.dataset.growth;
  const chart = window.__GROWTH_CHARTS__?.[key];
  const canvas = root.querySelector("[data-growth-canvas]");
  const form = root.querySelector("[data-growth-form]");
  const result = root.querySelector("[data-growth-result]");
  const resultBody = root.querySelector("[data-growth-result-body]");
  const status = root.querySelector("[data-growth-status]");
  if (!chart || !canvas || !form) return;

  renderGrowthChart(canvas, chart);

  const showError = (field, message) => {
    const wrap = form.elements[field]?.closest(".field");
    if (!wrap) return;
    wrap.dataset.invalid = "true";
    wrap.querySelector(".field__error").textContent = message;
    form.elements[field].setAttribute("aria-invalid", "true");
  };
  const clearErrors = () => {
    for (const wrap of form.querySelectorAll('[data-invalid="true"]')) {
      delete wrap.dataset.invalid;
      wrap.querySelector(".control")?.removeAttribute("aria-invalid");
    }
    const summary = form.querySelector("[data-form-summary]");
    if (summary) summary.dataset.visible = "false";
  };

  form.addEventListener("input", (e) => {
    const wrap = e.target.closest(".field");
    if (wrap?.dataset.invalid) {
      delete wrap.dataset.invalid;
      e.target.removeAttribute("aria-invalid");
    }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    clearErrors();

    const age = parseFloat(form.elements.age.value);
    const height = parseFloat(form.elements.height.value);
    const errors = [];

    if (!Number.isFinite(age)) {
      const m = `Enter an age in ${chart.ageUnit}.`;
      showError("age", m);
      errors.push(m);
    } else if (age < chart.ageMin || age > chart.ageMax) {
      const m = `This chart covers ${chart.ageMin}–${chart.ageMax} ${chart.ageUnit}.`;
      showError("age", m);
      errors.push(m);
    }
    if (!Number.isFinite(height)) {
      const m = "Enter a measurement in centimetres.";
      showError("height", m);
      errors.push(m);
    } else if (height <= 0 || height > 250) {
      const m = "Enter a measurement between 1 and 250 cm.";
      showError("height", m);
      errors.push(m);
    }

    if (errors.length) {
      const summary = form.querySelector("[data-form-summary]");
      if (summary) {
        summary.innerHTML =
          errors.length === 1
            ? `<p>${errors[0]}</p>`
            : `<p>Please fix the following:</p><ul>${errors.map((m) => `<li>${m}</li>`).join("")}</ul>`;
        summary.dataset.visible = "true";
      }
      form.querySelector('[data-invalid="true"] .control')?.focus();
      result.hidden = true;
      return;
    }

    const outcome = classify(chart, age, height);
    renderGrowthChart(canvas, chart, { point: { age, height } });

    resultBody.innerHTML = `
      <p class="result__label">Percentile</p>
      <p class="result__value">${outcome.percentile}</p>
      <div class="result__detail">
        <p>${outcome.sentence}</p>
        ${
          outcome.offChart
            ? `<p class="growth-note">That age sits outside this chart's plotted range, so the percentile could not be determined.</p>`
            : ""
        }
      </div>`;

    const badge = document.createElement("span");
    badge.className = `badge badge--${toneFor(outcome.percentile)}`;
    badge.textContent = `${chart.measureLabel} at ${age} ${chart.ageUnit}`;
    resultBody.querySelector(".result__value")?.after(badge);

    result.hidden = false;
    result.dataset.revealed = "true";
    if (status) status.textContent = `Result: ${outcome.sentence}`;

    if (window.matchMedia("(max-width: 899px)").matches) {
      result.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  form.addEventListener("reset", () => {
    clearErrors();
    result.hidden = true;
    renderGrowthChart(canvas, chart);
    if (status) status.textContent = "";
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
