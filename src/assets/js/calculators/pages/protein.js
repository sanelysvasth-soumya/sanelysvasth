import { calculateProtein } from "../engines.js";
import { createCalculator, el } from "../calculator-ui.js";

createCalculator({
  formId: "protein-form",
  resultId: "protein-result",
  statusMessage: "Your protein target has been calculated.",

  fields: [
    { name: "weight", type: "number", label: "Weight", requiredMessage: "Enter your weight in kilograms." },
    { name: "height", type: "number", label: "Height", requiredMessage: "Enter your height in centimetres." },
    { name: "age", type: "int", label: "Age", requiredMessage: "Enter your age in years." },
    { name: "gender", type: "radio", label: "Gender", optional: true },
    { name: "goal", type: "select", label: "Fitness goal", requiredMessage: "Choose a fitness goal." },
    { name: "activity", type: "select", label: "Activity level", requiredMessage: "Choose an activity level." },
  ],

  compute: ({ weight, height, age, goal, activity }) => {
    const result = calculateProtein({ weightKg: weight, heightCm: height, ageYears: age, goal, activity });
    return result;
  },

  render(result, root) {
    const body = root.querySelector("[data-result-body]");
    body.replaceChildren(
      el("p", { class: "result__label" }, "Daily protein target"),
      el("p", { class: "result__value" }, String(result.value),
        el("span", { class: "result__unit" }, "g/day")),
      el("div", { class: "result__detail" },
        el("p", {}, "A practical way to spread this across the day:"),
        el("ul", {},
          el("li", {}, `${result.split.breakfast} g at breakfast`),
          el("li", {}, `${result.split.lunch} g at lunch`),
          el("li", {}, `${result.split.dinner} g at dinner`),
          el("li", {}, `${result.split.snacks} g from snacks`)))
    );
  },
});
