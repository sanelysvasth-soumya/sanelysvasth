import { calculateHomaIR } from "../engines.js";
import { createCalculator, el } from "../calculator-ui.js";

createCalculator({
  formId: "homa-ir-form",
  resultId: "homa-ir-result",
  statusMessage: "Your insulin sensitivity indices have been calculated.",

  fields: [
    { name: "insulin", type: "number", label: "Fasting insulin", requiredMessage: "Enter your fasting insulin value." },
    { name: "insulinUnit", type: "select", label: "Insulin unit", requiredMessage: "Choose an insulin unit." },
    { name: "glucose", type: "number", label: "Fasting glucose", requiredMessage: "Enter your fasting glucose value." },
    { name: "glucoseUnit", type: "select", label: "Glucose unit", requiredMessage: "Choose a glucose unit." },
  ],

  compute: ({ insulin, insulinUnit, glucose, glucoseUnit }) => {
    const result = calculateHomaIR({ insulin, insulinUnit, glucose, glucoseUnit });
    return result;
  },

  render(result, root) {
    const body = root.querySelector("[data-result-body]");
    body.replaceChildren(
      el("p", { class: "result__label" }, "HOMA-IR"),
      el("p", { class: "result__value" }, String(result.homaIR)),
      el("div", { class: "result__detail" },
        el("p", {}, result.homaInterpretation),
        el("p", { style: "margin-top:var(--space-sm)" },
          el("strong", {}, "QUICKI: "), String(result.quicki)),
        el("p", {}, result.quickiInterpretation))
    );
  },
});
