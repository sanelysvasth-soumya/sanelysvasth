import { calculateWHR } from "../engines.js";
import { createCalculator, el, toneForCategory } from "../calculator-ui.js";

createCalculator({
  formId: "waist-to-hip-form",
  resultId: "waist-to-hip-result",
  statusMessage: "Your waist to hip ratio has been calculated.",

  fields: [
    { name: "waist", type: "number", label: "Waist circumference", requiredMessage: "Enter your waist measurement." },
    { name: "hip", type: "number", label: "Hip circumference", requiredMessage: "Enter your hip measurement." },
    { name: "gender", type: "radio", label: "Gender", requiredMessage: "Select a gender." },
  ],

  compute: ({ waist, hip, gender }) => {
    const result = calculateWHR({ waistCm: waist, hipCm: hip, gender });
    return result;
  },

  render(result, root) {
    const body = root.querySelector("[data-result-body]");
    body.replaceChildren(
      el("p", { class: "result__label" }, "Your waist to hip ratio"),
      el("p", { class: "result__value" }, String(result.value)),
      el("p", { style: "margin-top:var(--space-2xs)" },
        el("span", { class: `badge badge--${toneForCategory(result.category) || "accent"}` }, result.category)),
      el("div", { class: "result__detail" }, el("p", {}, result.message))
    );
  },
});
