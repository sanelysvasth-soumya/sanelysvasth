import { calculateBMI } from "../engines.js";
import { createCalculator, el, toneForCategory } from "../calculator-ui.js";

createCalculator({
  formId: "bmi-form",
  resultId: "bmi-result",
  statusMessage: "Your BMI has been calculated.",

  fields: [
    { name: "height", type: "number", label: "Height", requiredMessage: "Enter your height in centimetres." },
    { name: "weight", type: "number", label: "Weight", requiredMessage: "Enter your weight in kilograms." },
    { name: "age", type: "int", label: "Age", requiredMessage: "Enter your age in years." },
  ],

  compute: ({ height, weight, age }) => {
    const result = calculateBMI({
      heightCm: height,
      weightKg: weight,
      ageYears: age,
    });
    // Surface the under-18 rejection against the age field specifically.
    return result.ok ? result : { ...result, field: "age" };
  },

  render(result, root) {
    const body = root.querySelector("[data-result-body]");
    body.replaceChildren(
      el("p", { class: "result__label" }, "Your BMI"),
      el(
        "p",
        { class: "result__value" },
        String(result.value)
      ),
      el(
        "p",
        { style: "margin-top:var(--space-2xs)" },
        el(
          "span",
          { class: `badge badge--${toneForCategory(result.category) || "accent"}` },
          result.category
        )
      ),
      el(
        "div",
        { class: "result__detail" },
        el("p", {}, result.message)
      )
    );
  },
});
