import { evaluateDKA } from "../engines.js";
import { createCalculator, el } from "../calculator-ui.js";

createCalculator({
  formId: "dka-form",
  resultId: "dka-result",
  statusMessage: "Criteria have been evaluated.",

  fields: [
    { name: "glucose", type: "select", label: "Plasma glucose", requiredMessage: "Choose a glucose value." },
    { name: "bicarbonate", type: "select", label: "Serum bicarbonate", requiredMessage: "Choose a bicarbonate value." },
    { name: "anionGap", type: "select", label: "Anion gap", requiredMessage: "Choose an anion gap value." },
    { name: "ph", type: "select", label: "Arterial pH", requiredMessage: "Choose a pH value." },
    { name: "serumKetone", type: "select", label: "Serum ketones", requiredMessage: "Choose a serum ketone value." },
    { name: "urineKetone", type: "select", label: "Urine ketones", requiredMessage: "Choose a urine ketone value." },
  ],

  compute: ({ glucose, bicarbonate, anionGap, ph, serumKetone, urineKetone }) => {
    const result = evaluateDKA({ glucose, bicarbonate, anionGap, ph, serumKetone, urineKetone });
    return result;
  },

  render(result, root) {
    const body = root.querySelector("[data-result-body]");
    const list = el("ul", { style: "list-style:none; padding-left:0" });
    for (const line of result.lines) {
      list.append(el("li", { style: "display:flex; gap:.5rem; align-items:flex-start" },
        el("span", { "aria-hidden": "true" }, line.met ? "\u2714\uFE0F" : "\u274C"),
        el("span", {}, line.text)));
    }
    const parts = [
      el("p", { class: "result__label" }, "ADA criteria met"),
      el("p", { class: "result__value" }, `${result.criteriaMet}`,
        el("span", { class: "result__unit" }, "of 6")),
      el("div", { class: "result__detail" },
        el("p", {}, "The patient has met the following ADA criteria for diagnosis of diabetic ketoacidosis:"),
        list)
    ];
    if (result.severe) {
      parts.push(el("div", { class: "alert alert--danger", style: "margin-top:var(--space-sm)" },
        el("div", { class: "alert__body" }, el("p", {}, result.severeMessage))));
    }
    body.replaceChildren(...parts);
  },
});
