import { calculateJumpRopeCalories } from "../engines.js";
import { createCalculator, el } from "../calculator-ui.js";

createCalculator({
  formId: "jump-rope-form",
  resultId: "jump-rope-result",
  statusMessage: "Calories burned have been calculated.",

  fields: [
    { name: "weight", type: "number", label: "Body weight", requiredMessage: "Enter your weight in kilograms." },
    { name: "speed", type: "select", label: "Intensity", requiredMessage: "Choose an intensity." },
    { name: "duration", type: "number", label: "Duration", requiredMessage: "Enter the session duration in minutes." },
  ],

  compute: ({ weight, speed, duration }) => {
    const result = calculateJumpRopeCalories({ weightKg: weight, met: parseFloat(speed), durationMinutes: duration });
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
