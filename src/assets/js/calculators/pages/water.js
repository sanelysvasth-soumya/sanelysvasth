import { calculateWater } from "../engines.js";
import { createCalculator, el } from "../calculator-ui.js";

createCalculator({
  formId: "water-form",
  resultId: "water-result",
  statusMessage: "Your fluid target has been calculated.",

  fields: [
    { name: "weight", type: "number", label: "Weight", requiredMessage: "Enter your weight in kilograms." },
    { name: "height", type: "number", label: "Height", requiredMessage: "Enter your height in centimetres." },
    { name: "age", type: "int", label: "Age", requiredMessage: "Enter your age in years." },
    { name: "gender", type: "radio", label: "Gender", optional: true },
    { name: "activity", type: "select", label: "Activity level", requiredMessage: "Choose an activity level." },
    { name: "environment", type: "select", label: "Environment", requiredMessage: "Choose an environment." },
  ],

  compute: ({ weight, height, age, environment, activity }) => {
    const result = calculateWater({ weightKg: weight, heightCm: height, ageYears: age, environment, activity });
    return result;
  },

  render(result, root) {
    const body = root.querySelector("[data-result-body]");
    const parts = [
      el("p", { class: "result__label" }, "Daily fluid target"),
      el("p", { class: "result__value" }, String(result.valueMl),
        el("span", { class: "result__unit" }, "ml")),
      el("div", { class: "result__detail" },
        el("ul", {},
          el("li", {}, `${result.litres} litres per day`),
          el("li", {}, `About ${result.glasses} glasses (250 ml each)`)))
    ];
    if (result.showBifurcation) {
      parts.push(el("div", { class: "result__detail" },
        el("p", {}, "We recommend dividing your daily fluid intake approximately as follows:"),
        el("ol", {},
          el("li", {}, el("strong", {}, "Water (plain drinking water): "), "about 50% of total intake"),
          el("li", {}, el("strong", {}, "Fluids from other drinks (juices, buttermilk, coconut water): "), "about 30%"),
          el("li", {}, el("strong", {}, "Fluids from food (fruits, vegetables, soups): "), "about 20%"))));
    }
    body.replaceChildren(...parts);
  },
});
