import { calculateBMR } from "../engines.js";
import { createCalculator, el } from "../calculator-ui.js";

createCalculator({
  formId: "bmr-form",
  resultId: "bmr-result",
  statusMessage: "Your BMR has been calculated.",

  fields: [
    { name: "weight", type: "number", label: "Weight", requiredMessage: "Enter your weight in kilograms." },
    { name: "height", type: "number", label: "Height", requiredMessage: "Enter your height in centimetres." },
    { name: "age", type: "int", label: "Age", requiredMessage: "Enter your age in years." },
    { name: "gender", type: "radio", label: "Gender", requiredMessage: "Select a gender." },
  ],

  compute: ({ weight, height, age, gender }) => {
    const result = calculateBMR({ weightKg: weight, heightCm: height, ageYears: age, gender });
    return result;
  },

  render(result, root) {
    const body = root.querySelector("[data-result-body]");
    body.replaceChildren(
      el("p", { class: "result__label" }, "Your BMR"),
      el("p", { class: "result__value" }, String(result.value),
        el("span", { class: "result__unit" }, "kcal/day")),
      el("div", { class: "result__detail" },
        el("p", {}, "This is the energy your body burns at complete rest. To estimate total daily needs, use the activity level closest to your routine:"),
        el("ul", {},
          el("li", {}, `Sedentary (little or no exercise): ${result.activityLevels.sedentary} calories`),
          el("li", {}, `Light activity (1-3 days/week): ${result.activityLevels.light} calories`),
          el("li", {}, `Moderate activity (3-5 days/week): ${result.activityLevels.moderate} calories`),
          el("li", {}, `Very active (6-7 days/week): ${result.activityLevels.veryActive} calories`),
          el("li", {}, `Extra active (very intense exercise): ${result.activityLevels.extraActive} calories`)))
    );
  },
});
