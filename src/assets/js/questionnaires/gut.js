/**
 * Gut questionnaire — thin adapter over the shared quiz controller.
 * Scoring lives in gut-engine.js; the flow lives in quiz-ui.js.
 */

import {
  QUESTIONS,
  FREQUENCY_SCALE,
  scoreGutQuestionnaire,
  buildGutPayload,
} from "./gut-engine.js";
import { createQuiz, postViaIframe } from "./quiz-ui.js";

const escape = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

function init() {
  createQuiz({
    questions: QUESTIONS,

    optionsFor(question) {
      if (question.isCustomScale) {
        return question.labels.map((label, i) => ({
          score: question.scores[i],
          label: `${label.emoji} ${label.text}`,
        }));
      }
      return FREQUENCY_SCALE.map((s) => ({ score: s.score, label: s.label }));
    },

    onSubmit({ name, contact, answers }) {
      const result = scoreGutQuestionnaire(answers);

      try {
        postViaIframe(buildGutPayload({ name, contact, result, answers }));
      } catch {
        /* fire-and-forget; the result is shown regardless */
      }

      const tone =
        result.category === "Excellent" || result.category === "Good"
          ? "success"
          : result.category === "Fair"
            ? "warning"
            : "danger";

      return `
        <p class="result__label">Your gut health score</p>
        <p class="result__value">${result.rounded}<span class="result__unit">%</span></p>
        <p style="margin-top:var(--space-2xs)">
          <span class="badge badge--${tone}">${result.category}</span>
        </p>
        <div class="result__detail">
          <h3 style="font-size:var(--text-lg)">Analysis</h3>
          <p>${result.message}</p>
          ${
            result.highSymptoms.length
              ? `<h3 style="font-size:var(--text-lg); margin-top:var(--space-md)">Symptoms to watch</h3>
                 <ul>${result.highSymptoms.map((s) => `<li>${escape(s)}</li>`).join("")}</ul>`
              : ""
          }
          <h3 style="font-size:var(--text-lg); margin-top:var(--space-md)">Next steps</h3>
          <p>Thank you, <strong>${escape(name)}</strong>, for completing the assessment.
             Based on your score, we recommend booking a consultation to discuss a
             personalized plan.</p>
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
