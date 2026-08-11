import { calculateIBW } from "../engines.js";
import { createCalculator, el } from "../calculator-ui.js";

createCalculator({
  formId: "ideal-body-weight-form",
  resultId: "ideal-body-weight-result",
  statusMessage: "Your ideal body weight has been calculated.",

  fields: [
    { name: "height", type: "number", label: "Height", requiredMessage: "Enter your height in centimetres." },
    { name: "age", type: "int", label: "Age", requiredMessage: "Enter your age in years." },
    { name: "gender", type: "select", label: "Gender", requiredMessage: "Choose a gender." },
  ],

  compute: ({ height, age, gender }) => {
    const result = calculateIBW({ heightCm: height, gender, ageYears: age });
    return result.ok ? result : { ...result, field: "age" };
  },

  render(result, root) {
    const body = root.querySelector("[data-result-body]");
    body.replaceChildren(
      el("p", { class: "result__label" }, "Ideal body weight"),
      el("p", { class: "result__value" }, String(result.value),
        el("span", { class: "result__unit" }, "kg")),
      el("div", { class: "result__detail" },
        el("p", {}, `Reference range: ${result.range} kg`))
    );
  },
});
