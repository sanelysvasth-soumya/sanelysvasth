/**
 * PCOS questionnaire — thin adapter over the shared quiz controller.
 * Scoring lives in pcos-engine.js; the flow lives in quiz-ui.js.
 */

import {
  scorePcos,
  nextQuestionIndex,
  skippedIds,
  buildPcosPayload,
} from "./pcos-engine.js";
import { createQuiz, postViaIframe } from "./quiz-ui.js";

const FREQUENCY = [
  { score: 1, label: "Never" },
  { score: 2, label: "Rarely" },
  { score: 3, label: "Sometimes" },
  { score: 4, label: "Often" },
  { score: 5, label: "Always" },
];

const escape = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

function init() {
  const DATA = window.__PCOS__;
  if (!DATA) return;

  createQuiz({
    questions: DATA.questions,

    optionsFor(question) {
      const binary = DATA.binaryQuestions[String(question.id)];
      if (binary) {
        return binary.map((o) => ({
          score: o.value,
          label: o.label,
          sublabel: o.sublabel,
        }));
      }
      return FREQUENCY;
    },

    // Q21 = "No" skips the Post-Birth Control block.
    nextIndex: (i, answers) => nextQuestionIndex(DATA, i, answers),
    isSkipped: (q, answers) => skippedIds(DATA, answers).includes(q.id),

    onSubmit({ name, contact, answers }) {
      const result = scorePcos(DATA, answers);

      try {
        postViaIframe(buildPcosPayload({ data: DATA, name, contact, result, answers }));
      } catch {
        /* fire-and-forget */
      }

      const rows = DATA.groups
        .map((g) => {
          const total = DATA.questions.filter(
            (q) => q.group === g.key && !DATA.binaryQuestions[String(q.id)]
          ).length;
          const score = result.scores[g.key];
          const pct = total ? Math.round((score / total) * 100) : 0;
          const isTop = g.key === result.resultKey;
          return `
            <div class="score-row${isTop ? " score-row--top" : ""}">
              <div class="score-row__head">
                <span>${escape(g.name)}</span>
                <span class="tabular">${score}/${total}</span>
              </div>
              <div class="score-row__track">
                <div class="score-row__bar" style="width:${pct}%"></div>
              </div>
            </div>`;
        })
        .join("");

      const symptomBlocks = DATA.groups
        .filter((g) => result.highSymptoms[g.key].length)
        .map(
          (g) => `
            <h4 style="margin-top:var(--space-sm)">${escape(g.name)}</h4>
            <ul>${result.highSymptoms[g.key].map((s) => `<li>${escape(s)}</li>`).join("")}</ul>`
        )
        .join("");

      return `
        <p class="result__label">Likely primary driver</p>
        <p class="result__value" style="font-size:clamp(1.75rem,5vw,2.5rem)">${escape(result.resultKey)}</p>
        <div class="result__detail">
          <div class="score-breakdown">${rows}</div>
          <div class="pcos-explanation">${result.explanation}</div>
          ${
            symptomBlocks
              ? `<h3 style="font-size:var(--text-lg); margin-top:var(--space-md)">Symptoms you reported frequently</h3>${symptomBlocks}`
              : ""
          }
          <h3 style="font-size:var(--text-lg); margin-top:var(--space-md)">Next steps</h3>
          <p>Thank you, <strong>${escape(name)}</strong>, for completing the assessment.
             PCOS rarely has a single cause — a consultation can work through the detail
             with your history and bloodwork.</p>
          <p style="margin-top:var(--space-sm)">
            <a class="btn btn--primary" href="https://wa.me/message/U43IYBJMJDQAD1"
               target="_blank" rel="noopener noreferrer">Book consultation</a>
          </p>
        </div>`;
    },
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
