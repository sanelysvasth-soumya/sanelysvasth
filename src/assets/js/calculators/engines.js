/**
 * Svasth calculation engines — PURE FUNCTIONS, NO DOM.
 *
 * ============================ CONTRACT ============================
 * Every formula, constant, threshold, rounding step and comparison
 * operator below is transcribed VERBATIM from the legacy inline
 * <script> blocks (preserved in _archive/legacy/). This module is a
 * behavioural mirror, not a reimplementation.
 *
 * Deliberately preserved quirks — do NOT "fix" without an explicit
 * decision, they are covered by regression tests in test/:
 *
 *  Q1  BMI/WHR/WHtR categorise on the UNROUNDED value while
 *      DISPLAYING the rounded one. A BMI of 22.96 displays "23.0"
 *      but categorises as "Normal Weight" (since 22.96 < 23).
 *  Q2  IBW below 152.4cm applies the Broca index (already kg) and
 *      then divides by 2.2 again. Suspected legacy bug; preserved.
 *  Q3  Protein "maintenance" factor is 0.8 — lower than fat_loss
 *      (1.1) and muscle_gain (1.2). Preserved as authored.
 *  Q4  Protein meal split shows round(total/4) four times, so the
 *      four parts need not sum to the total. Preserved.
 *  Q5  HOMA-IR glucose in mmol/L is passed through unchanged while
 *      mg/dL is divided by 18. Preserved.
 *  Q6  QUICKI uses log10(insulin)+log10(glucose); non-positive
 *      inputs yield -Infinity/NaN exactly as before.
 *  Q7  Water intake is capped at 4000ml BEFORE deriving litres and
 *      glasses. Preserved.
 * ==================================================================
 */

/* ---------- shared rounding helpers (match legacy exactly) ---------- */
const round1 = (n) => Math.round(n * 10) / 10;
const round2 = (n) => Math.round(n * 100) / 100;
const round4 = (n) => Math.round(n * 10000) / 10000;

/* ============================== BMI ============================== */
/** Legacy: bmiCalculator.html */
export function calculateBMI({ heightCm, weightKg, ageYears }) {
  if (ageYears < 18) {
    return {
      ok: false,
      error:
        "BMI calculator is not applicable for individuals under 18 years of age.",
    };
  }

  const height = heightCm / 100; // cm -> m
  const bmi = weightKg / (height * height);
  const roundedBMI = round1(bmi);

  // NOTE (Q1): banding uses the UNROUNDED bmi.
  let category, message;
  if (bmi < 16.5) {
    category = "Severely Underweight";
    message =
      "You are severely underweight and undernourished. Please consult a healthcare professional.";
  } else if (bmi < 18.5) {
    category = "Underweight";
    message =
      "You are underweight and at risk of malnutrition. Consider consulting a nutritionist.";
  } else if (bmi < 23) {
    category = "Normal Weight";
    message =
      "You have a healthy body weight. Keep maintaining a balanced diet and regular exercise.";
  } else if (bmi < 25) {
    category = "Overweight";
    message =
      "You are overweight and at risk for metabolic conditions. Consider lifestyle modifications.";
  } else if (bmi < 30) {
    category = "Obesity Class I";
    message =
      "You are in the obesity range, which increases risk of metabolic syndrome and cardiovascular diseases.";
  } else {
    category = "Obesity Class II";
    message =
      "You are in the high obesity range. Please consult a healthcare professional for guidance.";
  }

  return { ok: true, value: roundedBMI, raw: bmi, category, message };
}

/* ============================== BMR ============================== */
/** Legacy: bmrCalculator.html — Harris-Benedict (original 1919 constants) */
export const BMR_ACTIVITY_MULTIPLIERS = Object.freeze({
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  veryActive: 1.725,
  extraActive: 1.9,
});

export function calculateBMR({ weightKg, heightCm, ageYears, gender }) {
  if (weightKg < 30 || weightKg > 300) {
    return { ok: false, error: "Please enter a valid weight (30-300 kg)" };
  }
  if (heightCm < 120 || heightCm > 250) {
    return { ok: false, error: "Please enter a valid height (120-250 cm)" };
  }
  if (ageYears < 15 || ageYears > 120) {
    return { ok: false, error: "Please enter a valid age (15-120 years)" };
  }

  const bmr =
    gender === "male"
      ? 66.5 + 13.75 * weightKg + 5.003 * heightCm - 6.75 * ageYears
      : 655.1 + 9.563 * weightKg + 1.85 * heightCm - 4.676 * ageYears;

  return {
    ok: true,
    value: Math.round(bmr),
    raw: bmr,
    activityLevels: {
      sedentary: Math.round(bmr * 1.2),
      light: Math.round(bmr * 1.375),
      moderate: Math.round(bmr * 1.55),
      veryActive: Math.round(bmr * 1.725),
      extraActive: Math.round(bmr * 1.9),
    },
  };
}

/* ============================ HOMA-IR ============================ */
/** Legacy: homaIR.html */
export function calculateHomaIR({
  insulin,
  insulinUnit, // "uIU" | "pmol"
  glucose,
  glucoseUnit, // "mmol" | "mg"
}) {
  // NOTE (Q5): mmol passes through untouched; mg/dL divided by 18.
  const insulinConverted = insulinUnit === "pmol" ? insulin / 6 : insulin;
  const glucoseConverted = glucoseUnit === "mmol" ? glucose : glucose / 18;

  const homaIR = round2((insulinConverted * glucoseConverted) / 22.5);

  // NOTE (Q6): log10 of a non-positive value yields -Infinity / NaN.
  const quicki = round4(
    1 / (Math.log10(insulinConverted) + Math.log10(glucoseConverted))
  );

  const homaInterpretation =
    homaIR > 2
      ? "You might have insulin resistance."
      : "Your insulin resistance level is normal.";

  const quickiInterpretation =
    quicki > 0.45
      ? "You are probably healthy."
      : quicki >= 0.3
        ? "You might be insulin resistant."
        : "You might be diabetic.";

  return {
    ok: true,
    homaIR,
    quicki,
    homaInterpretation,
    quickiInterpretation,
  };
}

/* ============================== IBW ============================== */
/** Legacy: ibwCalculator.html — Hamwi above 5ft, Broca below */
export function calculateIBW({ heightCm, gender, ageYears }) {
  if (ageYears < 18) {
    return {
      ok: false,
      error:
        "IBW calculator is not applicable for individuals under 18 years of age.",
    };
  }

  let ibw;
  if (heightCm >= 152.4) {
    const inchesAbove5ft = (heightCm - 152.4) / 2.54;
    if (gender === "male") {
      ibw = (106 + 6 * inchesAbove5ft) / 2.2;
    } else {
      ibw = (100 + 5 * inchesAbove5ft) / 2.2;
    }
  } else {
    // NOTE (Q2): suspected legacy bug — Broca result is already kg,
    // yet the legacy code divides by 2.2 again. Preserved verbatim.
    const adjustedHeight = heightCm - 100;
    if (gender === "male") {
      ibw = adjustedHeight - 0.1 * adjustedHeight;
    } else {
      ibw = adjustedHeight - 0.15 * adjustedHeight;
    }
    ibw /= 2.2;
  }

  ibw = round1(ibw);
  return {
    ok: true,
    value: ibw,
    rangeLow: round1(ibw - 1.5),
    rangeHigh: round1(ibw + 1.5),
    range: `${round1(ibw - 1.5)} to ${round1(ibw + 1.5)}`,
  };
}

/* ============================ PROTEIN ============================ */
/** Legacy: proteinCalculator.html */
export const PROTEIN_ACTIVITY_FACTORS = Object.freeze({
  sedentary: 1.2,
  lightly: 1.375,
  moderately: 1.55,
  very: 1.725,
});
// NOTE (Q3): maintenance is intentionally the lowest factor, as authored.
export const PROTEIN_GOAL_FACTORS = Object.freeze({
  fat_loss: 1.1,
  maintenance: 0.8,
  muscle_gain: 1.2,
});

export function calculateProtein({
  weightKg,
  heightCm,
  ageYears,
  goal,
  activity,
}) {
  if (weightKg < 30 || weightKg > 300) {
    return { ok: false, error: "Please enter a valid weight (30-300 kg)" };
  }
  if (heightCm < 120 || heightCm > 250) {
    return { ok: false, error: "Please enter a valid height (120-250 cm)" };
  }
  if (ageYears < 15 || ageYears > 120) {
    return { ok: false, error: "Please enter a valid age (15-120 years)" };
  }

  const proteinIntake =
    weightKg * PROTEIN_ACTIVITY_FACTORS[activity] * PROTEIN_GOAL_FACTORS[goal];
  const rounded = Math.round(proteinIntake);

  // NOTE (Q4): each slot is round(total/4); parts need not sum to total.
  const perMeal = Math.round(rounded / 4);

  return {
    ok: true,
    value: rounded,
    raw: proteinIntake,
    split: {
      breakfast: perMeal,
      lunch: perMeal,
      dinner: perMeal,
      snacks: perMeal,
    },
  };
}

/* ============================= WATER ============================= */
/** Legacy: waterCalculator.html */
export const WATER_ACTIVITY_FACTORS = Object.freeze({
  sedentary: 1.2,
  lightly: 1.3,
  moderately: 1.5,
  very: 1.7,
});
export const WATER_ENVIRONMENT_FACTORS = Object.freeze({
  hot: 1.2,
  cold: 0.9,
  humid: 1.1,
  normal: 1.0,
});

export function calculateWater({
  weightKg,
  heightCm,
  ageYears,
  environment,
  activity,
}) {
  if (weightKg < 30 || weightKg > 300) {
    return { ok: false, error: "Please enter a valid weight (30-300 kg)" };
  }
  if (heightCm < 120 || heightCm > 250) {
    return { ok: false, error: "Please enter a valid height (120-250 cm)" };
  }
  if (ageYears < 15 || ageYears > 120) {
    return { ok: false, error: "Please enter a valid age (15-120 years)" };
  }

  let waterIntake =
    weightKg *
    30 *
    WATER_ACTIVITY_FACTORS[activity] *
    WATER_ENVIRONMENT_FACTORS[environment];

  // NOTE (Q7): cap applied BEFORE deriving litres/glasses.
  if (waterIntake > 4000) waterIntake = 4000;

  const roundedWater = Math.round(waterIntake);

  return {
    ok: true,
    valueMl: roundedWater,
    litres: (roundedWater / 1000).toFixed(1),
    glasses: Math.round(roundedWater / 250),
    showBifurcation: roundedWater > 2800,
  };
}

/* ============================== WHR ============================== */
/** Legacy: whrCalculator.html */
export function calculateWHR({ waistCm, hipCm, gender }) {
  const whr = waistCm / hipCm;
  const rounded = round2(whr);
  const threshold = gender === "female" ? 0.8 : 0.9;

  // NOTE (Q1): comparison uses the UNROUNDED ratio.
  const increased = whr > threshold;

  return {
    ok: true,
    value: rounded,
    raw: whr,
    threshold,
    category: increased ? "Increased Risk" : "Normal",
    message: increased
      ? "Your WHR indicates an increased risk for cardiovascular diseases and metabolic syndrome. Consider consulting sanely svasth for personalized advice."
      : "Your WHR is within the normal range. Keep maintaining a healthy lifestyle with regular exercise and balanced diet.",
  };
}

/* ============================== WHtR ============================= */
/** Legacy: whtrCalculator.html */
const WHTR_BANDS = {
  male: [
    [0.63, "Highly Obese", "Your WHtR indicates a significantly elevated risk for cardiovascular diseases and metabolic syndrome. Please consult a healthcare professional."],
    [0.58, "Extremely Overweight", "Your WHtR suggests a high level of abdominal fat. Consider lifestyle modifications and consult a healthcare provider."],
    [0.53, "Overweight", "Your WHtR indicates an increased risk of metabolic syndrome. Consider adopting healthier lifestyle habits."],
    [0.46, "Healthy", "Your WHtR is within the healthy range. Maintain your balanced lifestyle with regular exercise and healthy diet."],
    [0.43, "Slender & Healthy", "Your WHtR indicates a healthy body composition. Keep maintaining your healthy lifestyle."],
    [0.35, "Extremely Slim", "Your WHtR suggests you are very slim. Ensure you're maintaining a balanced diet with adequate nutrition."],
  ],
  female: [
    [0.58, "Highly Obese", "Your WHtR indicates a significantly elevated risk for cardiovascular diseases and insulin resistance. Please consult a healthcare professional."],
    [0.54, "Extremely Overweight", "Your WHtR suggests a high level of abdominal fat. Consider lifestyle modifications and consult a healthcare provider."],
    [0.49, "Overweight", "Your WHtR indicates an increased risk of metabolic syndrome. Consider adopting healthier lifestyle habits."],
    [0.46, "Healthy", "Your WHtR is within the healthy range. Maintain your balanced lifestyle with regular exercise and healthy diet."],
    [0.42, "Slender & Healthy", "Your WHtR indicates a healthy body composition. Keep maintaining your healthy lifestyle."],
    [0.35, "Extremely Slim", "Your WHtR suggests you are very slim. Ensure you're maintaining a balanced diet with adequate nutrition."],
  ],
};
const WHTR_FLOOR = {
  male: ["Abnormally Slim", "Your WHtR indicates you may be underweight. Consider consulting sanely svasth for proper evaluation."],
  female: ["Abnormally Slim", "Your WHtR indicates you may be underweight. Consider consulting a healthcare provider for proper evaluation."],
};

export function calculateWHtR({ waistCm, heightCm, gender }) {
  if (waistCm < 40 || waistCm > 200) {
    return {
      ok: false,
      error: "Please enter a valid waist circumference (40-200 cm)",
    };
  }
  if (heightCm < 120 || heightCm > 250) {
    return { ok: false, error: "Please enter a valid height (120-250 cm)" };
  }

  const whtr = waistCm / heightCm;
  const rounded = round2(whtr);
  const bands = WHTR_BANDS[gender === "male" ? "male" : "female"];

  // NOTE (Q1): banding uses the UNROUNDED ratio.
  for (const [threshold, category, message] of bands) {
    if (whtr > threshold) {
      return { ok: true, value: rounded, raw: whtr, category, message };
    }
  }
  const [category, message] = WHTR_FLOOR[gender === "male" ? "male" : "female"];
  return { ok: true, value: rounded, raw: whtr, category, message };
}

/* ========================= JUMP ROPE ============================= */
/** Legacy: jumpRopeCalorie.html */
export function calculateJumpRopeCalories({ weightKg, met, durationMinutes }) {
  const calories = ((met * weightKg * 7) / 400) * durationMinutes;
  return { ok: true, value: round1(calories), raw: calories };
}

/* =========================== BURPEES ============================= */
/** Legacy: burpeesCalorie.html */
export function calculateBurpeesCalories({ weightKg, burpees }) {
  const calories = (weightKg / 68) * 0.5 * burpees;
  return { ok: true, value: round1(calories), raw: calories };
}

/* ============================== DKA ============================== */
/** Legacy: diabeticKetoacidosis.html — ADA criteria checklist */
export const DKA_CRITERIA_ORDER = Object.freeze([
  "glucose",
  "bicarbonate",
  "anionGap",
  "ph",
  "serumKetone",
  "urineKetone",
]);

export function evaluateDKA({
  glucose, // "yes" | "no"
  bicarbonate, // ">18" | other
  anionGap, // ">12" | other
  ph, // ">7.30" | other
  serumKetone, // "present" | other
  urineKetone, // "present" | other
}) {
  const params = {
    glucose: glucose === "yes",
    bicarbonate: bicarbonate !== ">18",
    anionGap: anionGap === ">12",
    ph: ph !== ">7.30",
    serumKetone: serumKetone === "present",
    urineKetone: urineKetone === "present",
  };

  let criteriaMet = 0;
  const lines = [];
  for (const key of DKA_CRITERIA_ORDER) {
    const label = key.replace(/([A-Z])/g, " $1");
    if (params[key]) {
      lines.push({ key, met: true, text: `${label} met criteria.` });
      criteriaMet++;
    } else {
      lines.push({ key, met: false, text: `${label} not met.` });
    }
  }

  return {
    ok: true,
    criteriaMet,
    params,
    lines,
    severe: criteriaMet >= 3,
    severeMessage:
      criteriaMet >= 3
        ? "The parameters suggest a severe form of diabetic ketoacidosis."
        : null,
  };
}
