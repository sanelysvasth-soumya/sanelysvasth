/**
 * Shared multi-step questionnaire controller — PRESENTATION ONLY.
 *
 * Drives both the gut and PCOS assessments so there is one implementation
 * of the flow, not two. Scoring stays in the per-questionnaire engines.
 *
 * Flow: details -> one question per step -> review -> result.
 * Supports branching (PCOS skips a block when Q21 is "No"), so progress
 * is computed from the questions actually reachable, not the raw count.
 */

import { validatePhone, attachPhoneInput } from "../phone.js";

const ENDPOINT =
  "https://script.google.com/macros/s/AKfycbzWpa98yHvCTYfp0aiOrScOgGhXxZ5EXR6v2cSUtTnhEQpj9fzYhyOWlIacKgxA53vGBA/exec";

/**
 * Legacy transport, preserved: the endpoint sends no CORS headers, so a
 * fetch() would be blocked. POST a synthesised form from a hidden iframe.
 */
export function postViaIframe(data, settleMs = 5000) {
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
  setTimeout(() => iframe.remove(), settleMs);
}

/**
 * @param {object} cfg
 * @param {Array}    cfg.questions   [{ id, text, ... }]
 * @param {Function} cfg.optionsFor  (question) => [{ score, label, sublabel? }]
 * @param {Function} [cfg.nextIndex] (currentIndex, answers) => number
 * @param {Function} [cfg.isSkipped] (question, answers) => boolean
 * @param {Function} cfg.onSubmit    ({ name, contact, answers }) => resultHTML
 */
export function createQuiz(cfg) {
  const root = document.querySelector("[data-quiz]");
  if (!root) return;

  const $ = (sel) => root.querySelector(sel);
  const startPanel = $("[data-quiz-start]");
  const questionPanel = $("[data-quiz-questions]");
  const reviewPanel = $("[data-quiz-review]");
  const resultPanel = $("[data-quiz-result]");
  const detailsForm = $("[data-quiz-details]");
  const bar = $("[data-quiz-bar]");
  const counter = $("[data-quiz-counter]");
  const percent = $("[data-quiz-percent]");
  const questionEl = $("[data-quiz-question]");
  const optionsEl = $("[data-quiz-options]");
  const backBtn = $("[data-quiz-back]");
  const nextBtn = $("[data-quiz-next]");

  // blocks letters/emoji as they are typed or pasted
  attachPhoneInput(detailsForm.elements.contact);

  const answers = {};
  /** Stack of visited indices so Back retraces the real path, not index-1. */
  const trail = [];
  let index = 0;
  let name = "";
  let contact = "";

  /* ---------------- start screen ---------------- */
  detailsForm.addEventListener("input", (e) => {
    const wrap = e.target.closest(".field");
    if (wrap?.dataset.invalid) {
      delete wrap.dataset.invalid;
      e.target.removeAttribute("aria-invalid");
    }
  });

  detailsForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const summary = detailsForm.querySelector("[data-form-summary]");
    const errors = [];

    const fail = (input, id, msg) => {
      const wrap = input.closest(".field");
      wrap.dataset.invalid = "true";
      input.setAttribute("aria-invalid", "true");
      document.getElementById(`${id}-error`).textContent = msg;
      errors.push(msg);
    };
    for (const f of ["name", "contact"]) {
      const input = detailsForm.elements[f];
      input.closest(".field").removeAttribute("data-invalid");
      input.removeAttribute("aria-invalid");
    }

    // Name: presence only.
    if (!detailsForm.elements.name.value.trim()) {
      fail(detailsForm.elements.name, "q-name", "Enter your name.");
    }
    // Contact: full international phone validation — letters, emoji and
    // out-of-range lengths are all rejected, any country code accepted.
    const phone = validatePhone(detailsForm.elements.contact.value);
    if (!phone.ok) {
      fail(detailsForm.elements.contact, "q-contact", phone.error);
    }

    if (errors.length) {
      summary.innerHTML =
        errors.length === 1
          ? `<p>${errors[0]}</p>`
          : `<p>Please fix the following:</p><ul>${errors.map((m) => `<li>${m}</li>`).join("")}</ul>`;
      summary.dataset.visible = "true";
      detailsForm.querySelector('[data-invalid="true"] .control')?.focus();
      return;
    }
    summary.dataset.visible = "false";

    name = detailsForm.elements.name.value.trim();
    // store the normalised E.164-shaped value, not the typed formatting
    contact = phone.value;
    startPanel.hidden = true;
    questionPanel.hidden = false;
    render();
    questionPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  /* ---------------- questions ---------------- */
  function answeredCount() {
    return cfg.questions.filter((q) => answers[q.id] !== undefined).length;
  }
  function reachableCount() {
    if (!cfg.isSkipped) return cfg.questions.length;
    return cfg.questions.filter((q) => !cfg.isSkipped(q, answers)).length;
  }
  function isLast(i) {
    const next = cfg.nextIndex ? cfg.nextIndex(i, answers) : i + 1;
    return next === i || next >= cfg.questions.length;
  }

  function render() {
    const question = cfg.questions[index];
    const total = reachableCount();
    const done = answeredCount();
    const pct = Math.min(100, ((done + (answers[question.id] ? 0 : 1)) / total) * 100);

    bar.style.width = `${pct}%`;
    counter.textContent = `Question ${Math.min(done + 1, total)} of ${total}`;
    percent.textContent = `${Math.round(pct)}%`;
    questionEl.textContent = question.text;

    optionsEl.replaceChildren();
    for (const opt of cfg.optionsFor(question)) {
      const label = document.createElement("label");
      label.className = "option";
      label.innerHTML = `
        <input type="radio" name="q${question.id}" value="${opt.score}"
               ${answers[question.id] === opt.score ? "checked" : ""}>
        <span>${opt.label}${opt.sublabel ? ` <span class="option__sub">${opt.sublabel}</span>` : ""}</span>`;
      optionsEl.append(label);
    }

    backBtn.disabled = trail.length === 0;
    nextBtn.textContent = isLast(index) ? "Review answers" : "Next";
    nextBtn.disabled = answers[question.id] === undefined;
    optionsEl.querySelector("input")?.focus();
  }

  optionsEl.addEventListener("change", (e) => {
    if (!e.target.matches('input[type="radio"]')) return;
    answers[cfg.questions[index].id] = Number(e.target.value);
    nextBtn.disabled = false;
    nextBtn.textContent = isLast(index) ? "Review answers" : "Next";
  });

  nextBtn.addEventListener("click", () => {
    if (answers[cfg.questions[index].id] === undefined) return;
    if (isLast(index)) return showReview();
    trail.push(index);
    index = cfg.nextIndex ? cfg.nextIndex(index, answers) : index + 1;
    render();
  });

  backBtn.addEventListener("click", () => {
    if (!trail.length) return;
    index = trail.pop();
    render();
  });

  questionPanel.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !nextBtn.disabled && e.target.matches("input")) {
      e.preventDefault();
      nextBtn.click();
    }
  });

  /* ---------------- review ---------------- */
  function labelFor(question, score) {
    return cfg.optionsFor(question).find((o) => o.score === score)?.label ?? "—";
  }

  function showReview() {
    const list = $("[data-quiz-review-list]");
    list.replaceChildren();

    cfg.questions.forEach((q, i) => {
      if (answers[q.id] === undefined) return; // skipped branch
      const row = document.createElement("div");
      row.className = "review-row";
      row.innerHTML = `<dt>${q.text}</dt><dd>${labelFor(q, answers[q.id])}</dd>`;
      row.tabIndex = 0;
      row.setAttribute("role", "button");
      row.setAttribute("aria-label", `Change answer for: ${q.text}`);
      const jump = () => {
        trail.push(index);
        index = i;
        reviewPanel.hidden = true;
        questionPanel.hidden = false;
        render();
        questionPanel.scrollIntoView({ behavior: "smooth", block: "start" });
      };
      row.addEventListener("click", jump);
      row.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); jump(); }
      });
      list.append(row);
    });

    questionPanel.hidden = true;
    reviewPanel.hidden = false;
    reviewPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  $("[data-quiz-review-back]").addEventListener("click", () => {
    reviewPanel.hidden = true;
    questionPanel.hidden = false;
    render();
  });

  /* ---------------- submit ---------------- */
  $("[data-quiz-submit]").addEventListener("click", (e) => {
    const btn = e.currentTarget;
    btn.dataset.loading = "true";
    btn.disabled = true;

    let html = "";
    try {
      html = cfg.onSubmit({ name, contact, answers });
    } finally {
      delete btn.dataset.loading;
      btn.disabled = false;
    }

    $("[data-quiz-result-body]").innerHTML = html;
    reviewPanel.hidden = true;
    resultPanel.hidden = false;
    resultPanel.dataset.revealed = "true";
    resultPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}
