import { calculateBurpeesCalories } from "../engines.js";
import { createCalculator, el } from "../calculator-ui.js";

createCalculator({
  formId: "burpees-form",
  resultId: "burpees-result",
  statusMessage: "Calories burned have been calculated.",

  fields: [
    { name: "weight", type: "number", label: "Body weight", requiredMessage: "Enter your weight in kilograms." },
    { name: "burpees", type: "int", label: "Repetitions completed", requiredMessage: "Enter the number of burpees completed." },
  ],

  compute: ({ weight, burpees }) => {
    const result = calculateBurpeesCalories({ weightKg: weight, burpees });
    return result;
  },

  render(result, root) {
    const body = root.querySelector("[data-result-body]");
    body.replaceChildren(
      el("p", { class: "result__label" }, "Estimated calories burned"),
      el("p", { class: "result__value" }, String(result.value),
        el("span", { class: "result__unit" }, "kcal"))
    );
  },
});
