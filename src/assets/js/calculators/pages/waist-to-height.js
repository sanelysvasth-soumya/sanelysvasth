import { calculateWHtR } from "../engines.js";
import { createCalculator, el, toneForCategory } from "../calculator-ui.js";

createCalculator({
  formId: "waist-to-height-form",
  resultId: "waist-to-height-result",
  statusMessage: "Your waist to height ratio has been calculated.",

  fields: [
    { name: "waist", type: "number", label: "Waist circumference", requiredMessage: "Enter your waist measurement." },
    { name: "height", type: "number", label: "Height", requiredMessage: "Enter your height in centimetres." },
    { name: "gender", type: "radio", label: "Gender", requiredMessage: "Select a gender." },
  ],

  compute: ({ waist, height, gender }) => {
    const result = calculateWHtR({ waistCm: waist, heightCm: height, gender });
    return result;
  },

  render(result, root) {
    const body = root.querySelector("[data-result-body]");
    body.replaceChildren(
      el("p", { class: "result__label" }, "Your waist to height ratio"),
      el("p", { class: "result__value" }, String(result.value)),
      el("p", { style: "margin-top:var(--space-2xs)" },
        el("span", { class: `badge badge--${toneForCategory(result.category) || "accent"}` }, result.category)),
      el("div", { class: "result__detail" }, el("p", {}, result.message))
    );
  },
});
