/**
 * FUNCTIONAL BASELINE — calculator regression suite.
 *
 * Strategy: DIFFERENTIAL TESTING.
 *   `legacy` below is the original logic transcribed a second time,
 *   independently, straight from _archive/legacy/*.html. Each case runs
 *   BOTH the legacy function and the new engine and asserts they agree.
 *   A transcription slip in engines.js therefore fails the suite rather
 *   than silently shipping.
 *
 * Plus explicit GOLDEN assertions on hand-computed values, so the suite
 * still fails if BOTH implementations were to drift together.
 *
 * These expected outputs are the contract the redesigned UI must honour.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import * as E from "../src/assets/js/calculators/engines.js";

/* ============ LEGACY REFERENCE IMPLEMENTATIONS (verbatim) ============ */
const legacy = {
  bmi(heightCm, weightKg, age) {
    if (age < 18) return { blocked: true };
    const height = heightCm / 100;
    const bmi = weightKg / (height * height);
    const roundedBMI = Math.round(bmi * 10) / 10;
    let category;
    if (bmi < 16.5) category = "Severely Underweight";
    else if (bmi < 18.5) category = "Underweight";
    else if (bmi < 23) category = "Normal Weight";
    else if (bmi < 25) category = "Overweight";
    else if (bmi < 30) category = "Obesity Class I";
    else category = "Obesity Class II";
    return { roundedBMI, category };
  },
  bmr(weight, height, age, gender) {
    if (weight < 30 || weight > 300) return { blocked: true };
    if (height < 120 || height > 250) return { blocked: true };
    if (age < 15 || age > 120) return { blocked: true };
    const bmr =
      gender === "male"
        ? 66.5 + 13.75 * weight + 5.003 * height - 6.75 * age
        : 655.1 + 9.563 * weight + 1.85 * height - 4.676 * age;
    return { rounded: Math.round(bmr), sedentary: Math.round(bmr * 1.2) };
  },
  homa(insulin, insulinUnit, glucose, glucoseUnit) {
    const i = insulinUnit === "pmol" ? insulin / 6 : insulin;
    const g = glucoseUnit === "mmol" ? glucose : glucose / 18;
    const homa_ir = Math.round(((i * g) / 22.5) * 100) / 100;
    const quicki =
      Math.round((1 / (Math.log10(i) + Math.log10(g))) * 10000) / 10000;
    return { homa_ir, quicki };
  },
  ibw(height, gender, age) {
    if (age < 18) return { blocked: true };
    let ibw;
    if (height >= 152.4) {
      const h = (height - 152.4) / 2.54;
      ibw = gender === "male" ? (106 + 6 * h) / 2.2 : (100 + 5 * h) / 2.2;
    } else {
      const a = height - 100;
      ibw = gender === "male" ? a - 0.1 * a : a - 0.15 * a;
      ibw /= 2.2;
    }
    return { ibw: Math.round(ibw * 10) / 10 };
  },
  protein(weight, height, age, goal, activity) {
    if (weight < 30 || weight > 300) return { blocked: true };
    if (height < 120 || height > 250) return { blocked: true };
    if (age < 15 || age > 120) return { blocked: true };
    const af = { sedentary: 1.2, lightly: 1.375, moderately: 1.55, very: 1.725 };
    const gf = { fat_loss: 1.1, maintenance: 0.8, muscle_gain: 1.2 };
    return { rounded: Math.round(weight * af[activity] * gf[goal]) };
  },
  water(weight, height, age, environment, activity) {
    if (weight < 30 || weight > 300) return { blocked: true };
    if (height < 120 || height > 250) return { blocked: true };
    if (age < 15 || age > 120) return { blocked: true };
    const af = { sedentary: 1.2, lightly: 1.3, moderately: 1.5, very: 1.7 };
    const ef = { hot: 1.2, cold: 0.9, humid: 1.1, normal: 1.0 };
    let w = weight * 30 * af[activity] * ef[environment];
    if (w > 4000) w = 4000;
    const r = Math.round(w);
    return {
      ml: r,
      litres: (r / 1000).toFixed(1),
      glasses: Math.round(r / 250),
    };
  },
  whr(waist, hip, gender) {
    const whr = waist / hip;
    const t = gender === "female" ? 0.8 : 0.9;
    return {
      rounded: Math.round(whr * 100) / 100,
      category: whr > t ? "Increased Risk" : "Normal",
    };
  },
  whtr(waist, height, gender) {
    if (waist < 40 || waist > 200) return { blocked: true };
    if (height < 120 || height > 250) return { blocked: true };
    const whtr = waist / height;
    let category;
    if (gender === "male") {
      if (whtr > 0.63) category = "Highly Obese";
      else if (whtr > 0.58) category = "Extremely Overweight";
      else if (whtr > 0.53) category = "Overweight";
      else if (whtr > 0.46) category = "Healthy";
      else if (whtr > 0.43) category = "Slender & Healthy";
      else if (whtr > 0.35) category = "Extremely Slim";
      else category = "Abnormally Slim";
    } else {
      if (whtr > 0.58) category = "Highly Obese";
      else if (whtr > 0.54) category = "Extremely Overweight";
      else if (whtr > 0.49) category = "Overweight";
      else if (whtr > 0.46) category = "Healthy";
      else if (whtr > 0.42) category = "Slender & Healthy";
      else if (whtr > 0.35) category = "Extremely Slim";
      else category = "Abnormally Slim";
    }
    return { rounded: Math.round(whtr * 100) / 100, category };
  },
  jumpRope: (w, met, d) => Math.round(((met * w * 7) / 400) * d * 10) / 10,
  burpees: (w, b) => Math.round((w / 68) * 0.5 * b * 10) / 10,
};

/* ========================== BMI ========================== */
describe("BMI — legacy: bmiCalculator.html", () => {
  const cases = [
    { n: "normal adult", h: 170, w: 70, a: 30, bmi: 24.2, cat: "Overweight" },
    { n: "severely underweight", h: 170, w: 45, a: 30, bmi: 15.6, cat: "Severely Underweight" },
    { n: "underweight", h: 170, w: 50, a: 30, bmi: 17.3, cat: "Underweight" },
    { n: "normal weight", h: 170, w: 60, a: 30, bmi: 20.8, cat: "Normal Weight" },
    { n: "obesity I", h: 170, w: 80, a: 30, bmi: 27.7, cat: "Obesity Class I" },
    { n: "obesity II", h: 170, w: 95, a: 30, bmi: 32.9, cat: "Obesity Class II" },
    // 22.9866… displays as 23.0 but bands as Normal Weight — quirk Q1 in the wild
    { n: "decimal inputs", h: 172.5, w: 68.4, a: 29, bmi: 23, cat: "Normal Weight" },
    { n: "min age boundary (18)", h: 170, w: 70, a: 18, bmi: 24.2, cat: "Overweight" },
    { n: "very large weight", h: 170, w: 300, a: 40, bmi: 103.8, cat: "Obesity Class II" },
    { n: "very small weight", h: 170, w: 1, a: 40, bmi: 0.3, cat: "Severely Underweight" },
  ];
  for (const c of cases) {
    test(c.n, () => {
      const got = E.calculateBMI({ heightCm: c.h, weightKg: c.w, ageYears: c.a });
      const ref = legacy.bmi(c.h, c.w, c.a);
      assert.equal(got.ok, true);
      assert.equal(got.value, c.bmi, "golden value");
      assert.equal(got.category, c.cat, "golden category");
      assert.equal(got.value, ref.roundedBMI, "differential vs legacy");
      assert.equal(got.category, ref.category, "differential vs legacy");
    });
  }

  test("QUIRK Q1 — categorises on unrounded, displays rounded", () => {
    // 66.36 / 1.7^2 = 22.9584… -> displays 23.0 but is still "Normal Weight"
    const r = E.calculateBMI({ heightCm: 170, weightKg: 66.36, ageYears: 30 });
    assert.equal(r.value, 23);
    assert.equal(r.category, "Normal Weight");
    assert.equal(r.category, legacy.bmi(170, 66.36, 30).category);
  });

  test("under-18 is blocked", () => {
    const r = E.calculateBMI({ heightCm: 170, weightKg: 70, ageYears: 17 });
    assert.equal(r.ok, false);
    assert.match(r.error, /not applicable for individuals under 18/);
    assert.equal(legacy.bmi(170, 70, 17).blocked, true);
  });

  test("empty / invalid input yields NaN (legacy parity)", () => {
    const r = E.calculateBMI({ heightCm: NaN, weightKg: NaN, ageYears: 30 });
    assert.equal(r.ok, true);
    assert.ok(Number.isNaN(r.value));
  });

  test("zero height yields Infinity (legacy parity)", () => {
    const r = E.calculateBMI({ heightCm: 0, weightKg: 70, ageYears: 30 });
    assert.equal(r.value, Infinity);
    assert.equal(r.category, "Obesity Class II");
  });
});

/* ========================== BMR ========================== */
describe("BMR — legacy: bmrCalculator.html", () => {
  const cases = [
    { n: "male normal", w: 70, h: 170, a: 30, g: "male", v: 1677 },
    { n: "female normal", w: 60, h: 165, a: 30, g: "female", v: 1394 },
    { n: "male min bounds", w: 30, h: 120, a: 15, g: "male", v: 978 },
    { n: "male max bounds", w: 300, h: 250, a: 120, g: "male", v: 4632 },
    { n: "female min bounds", w: 30, h: 120, a: 15, g: "female", v: 1094 },
    { n: "decimal inputs", w: 72.5, h: 168.5, a: 34, g: "male", v: 1677 },
  ];
  for (const c of cases) {
    test(c.n, () => {
      const got = E.calculateBMR({ weightKg: c.w, heightCm: c.h, ageYears: c.a, gender: c.g });
      const ref = legacy.bmr(c.w, c.h, c.a, c.g);
      assert.equal(got.ok, true);
      assert.equal(got.value, c.v, "golden value");
      assert.equal(got.value, ref.rounded, "differential vs legacy");
      assert.equal(got.activityLevels.sedentary, ref.sedentary);
    });
  }

  test("activity multipliers preserved", () => {
    const r = E.calculateBMR({ weightKg: 70, heightCm: 170, ageYears: 30, gender: "male" });
    assert.equal(r.activityLevels.sedentary, Math.round(1677.01 * 1.2));
    assert.equal(r.activityLevels.light, Math.round(1677.01 * 1.375));
    assert.equal(r.activityLevels.moderate, Math.round(1677.01 * 1.55));
    assert.equal(r.activityLevels.veryActive, Math.round(1677.01 * 1.725));
    assert.equal(r.activityLevels.extraActive, Math.round(1677.01 * 1.9));
  });

  const rejects = [
    ["weight below min", { weightKg: 29.9, heightCm: 170, ageYears: 30, gender: "male" }, /30-300 kg/],
    ["weight above max", { weightKg: 300.1, heightCm: 170, ageYears: 30, gender: "male" }, /30-300 kg/],
    ["height below min", { weightKg: 70, heightCm: 119.9, ageYears: 30, gender: "male" }, /120-250 cm/],
    ["height above max", { weightKg: 70, heightCm: 250.1, ageYears: 30, gender: "male" }, /120-250 cm/],
    ["age below min", { weightKg: 70, heightCm: 170, ageYears: 14, gender: "male" }, /15-120 years/],
    ["age above max", { weightKg: 70, heightCm: 170, ageYears: 121, gender: "male" }, /15-120 years/],
    ["zero weight", { weightKg: 0, heightCm: 170, ageYears: 30, gender: "male" }, /30-300 kg/],
  ];
  for (const [n, input, re] of rejects) {
    test(`rejects ${n}`, () => {
      const r = E.calculateBMR(input);
      assert.equal(r.ok, false);
      assert.match(r.error, re);
    });
  }
});

/* ======================== HOMA-IR ======================== */
describe("HOMA-IR / QUICKI — legacy: homaIR.html", () => {
  test("uIU + mg/dL — insulin resistant", () => {
    const got = E.calculateHomaIR({ insulin: 10, insulinUnit: "uIU", glucose: 90, glucoseUnit: "mg" });
    const ref = legacy.homa(10, "uIU", 90, "mg");
    assert.equal(got.homaIR, 2.22);
    assert.equal(got.quicki, 0.5886);
    assert.equal(got.homaIR, ref.homa_ir);
    assert.equal(got.quicki, ref.quicki);
    assert.equal(got.homaInterpretation, "You might have insulin resistance.");
    assert.equal(got.quickiInterpretation, "You are probably healthy.");
  });

  test("pmol conversion divides insulin by 6", () => {
    const got = E.calculateHomaIR({ insulin: 60, insulinUnit: "pmol", glucose: 90, glucoseUnit: "mg" });
    const same = E.calculateHomaIR({ insulin: 10, insulinUnit: "uIU", glucose: 90, glucoseUnit: "mg" });
    assert.equal(got.homaIR, same.homaIR);
    assert.equal(got.homaIR, legacy.homa(60, "pmol", 90, "mg").homa_ir);
  });

  test("QUIRK Q5 — mmol/L passes through unconverted", () => {
    const got = E.calculateHomaIR({ insulin: 10, insulinUnit: "uIU", glucose: 5, glucoseUnit: "mmol" });
    assert.equal(got.homaIR, 2.22);
    assert.equal(got.homaIR, legacy.homa(10, "uIU", 5, "mmol").homa_ir);
  });

  test("normal range below threshold 2", () => {
    const got = E.calculateHomaIR({ insulin: 5, insulinUnit: "uIU", glucose: 85, glucoseUnit: "mg" });
    assert.equal(got.homaIR, 1.05);
    assert.equal(got.homaInterpretation, "Your insulin resistance level is normal.");
  });

  test("boundary — HOMA exactly 2 is NOT flagged", () => {
    const got = E.calculateHomaIR({ insulin: 9, insulinUnit: "uIU", glucose: 90, glucoseUnit: "mg" });
    assert.equal(got.homaIR, 2);
    assert.equal(got.homaInterpretation, "Your insulin resistance level is normal.");
  });

  test("QUICKI insulin-resistant band (0.30 <= q <= 0.45)", () => {
    const got = E.calculateHomaIR({ insulin: 30, insulinUnit: "uIU", glucose: 200, glucoseUnit: "mg" });
    assert.equal(got.quicki, 0.3964);
    assert.equal(got.quickiInterpretation, "You might be insulin resistant.");
  });

  test("QUICKI diabetic band (q < 0.30)", () => {
    const got = E.calculateHomaIR({ insulin: 100, insulinUnit: "uIU", glucose: 400, glucoseUnit: "mg" });
    assert.ok(got.quicki < 0.3);
    assert.equal(got.quickiInterpretation, "You might be diabetic.");
  });

  test("QUIRK Q6 — zero insulin: log10(0) drives QUICKI to -0", () => {
    const got = E.calculateHomaIR({ insulin: 0, insulinUnit: "uIU", glucose: 90, glucoseUnit: "mg" });
    assert.equal(got.homaIR, 0);
    assert.ok(Object.is(got.quicki, -0), "1/-Infinity rounds to -0");
    assert.equal(got.quickiInterpretation, "You might be diabetic.");
  });
});

/* ========================== IBW ========================== */
describe("IBW — legacy: ibwCalculator.html", () => {
  const cases = [
    { n: "male 175cm", h: 175, g: "male", v: 72.4 },
    { n: "female 165cm", h: 165, g: "female", v: 56.7 },
    { n: "male at 5ft boundary (152.4)", h: 152.4, g: "male", v: 48.2 },
    { n: "female at 5ft boundary (152.4)", h: 152.4, g: "female", v: 45.5 },
    { n: "male tall 200cm", h: 200, g: "male", v: 99.3 },
    { n: "decimal height", h: 168.3, g: "female", v: 59.7 },
  ];
  for (const c of cases) {
    test(c.n, () => {
      const got = E.calculateIBW({ heightCm: c.h, gender: c.g, ageYears: 30 });
      assert.equal(got.value, c.v, "golden value");
      assert.equal(got.value, legacy.ibw(c.h, c.g, 30).ibw, "differential vs legacy");
    });
  }

  test("QUIRK Q2 — sub-152.4cm double-divides (suspected legacy bug, preserved)", () => {
    const got = E.calculateIBW({ heightCm: 150, gender: "female", ageYears: 30 });
    assert.equal(got.value, 19.3); // implausible in kg; matches legacy exactly
    assert.equal(got.value, legacy.ibw(150, "female", 30).ibw);

    const male = E.calculateIBW({ heightCm: 150, gender: "male", ageYears: 30 });
    assert.equal(male.value, 20.5);
    assert.equal(male.value, legacy.ibw(150, "male", 30).ibw);
  });

  test("range is value +/- 1.5", () => {
    const got = E.calculateIBW({ heightCm: 175, gender: "male", ageYears: 30 });
    assert.equal(got.rangeLow, 70.9);
    assert.equal(got.rangeHigh, 73.9);
    assert.equal(got.range, "70.9 to 73.9");
  });

  test("under-18 is blocked", () => {
    const r = E.calculateIBW({ heightCm: 175, gender: "male", ageYears: 17 });
    assert.equal(r.ok, false);
    assert.match(r.error, /not applicable for individuals under 18/);
  });
});

/* ======================== PROTEIN ======================== */
describe("Protein — legacy: proteinCalculator.html", () => {
  const cases = [
    { n: "moderate + muscle gain", w: 70, act: "moderately", goal: "muscle_gain", v: 130 },
    { n: "sedentary + maintenance", w: 70, act: "sedentary", goal: "maintenance", v: 67 },
    { n: "very active + fat loss", w: 70, act: "very", goal: "fat_loss", v: 133 },
    { n: "lightly + fat loss", w: 60, act: "lightly", goal: "fat_loss", v: 91 },
    { n: "min weight 30", w: 30, act: "sedentary", goal: "maintenance", v: 29 },
    { n: "max weight 300", w: 300, act: "very", goal: "muscle_gain", v: 621 },
    { n: "decimal weight", w: 72.4, act: "moderately", goal: "fat_loss", v: 123 },
  ];
  for (const c of cases) {
    test(c.n, () => {
      const got = E.calculateProtein({ weightKg: c.w, heightCm: 170, ageYears: 30, goal: c.goal, activity: c.act });
      assert.equal(got.value, c.v, "golden value");
      assert.equal(got.value, legacy.protein(c.w, 170, 30, c.goal, c.act).rounded, "differential");
    });
  }

  test("QUIRK Q3 — maintenance (0.8) is lower than fat_loss (1.1)", () => {
    assert.equal(E.PROTEIN_GOAL_FACTORS.maintenance, 0.8);
    assert.ok(E.PROTEIN_GOAL_FACTORS.maintenance < E.PROTEIN_GOAL_FACTORS.fat_loss);
  });

  test("QUIRK Q4 — meal split need not sum to total", () => {
    const got = E.calculateProtein({ weightKg: 70, heightCm: 170, ageYears: 30, goal: "muscle_gain", activity: "moderately" });
    assert.equal(got.value, 130);
    assert.equal(got.split.breakfast, 33);
    const sum = got.split.breakfast + got.split.lunch + got.split.dinner + got.split.snacks;
    assert.equal(sum, 132); // 2g over — matches legacy display
  });

  test("rejects out-of-range weight", () => {
    assert.equal(E.calculateProtein({ weightKg: 25, heightCm: 170, ageYears: 30, goal: "fat_loss", activity: "very" }).ok, false);
  });
});

/* ========================= WATER ========================= */
describe("Water — legacy: waterCalculator.html", () => {
  const cases = [
    { n: "sedentary + normal", w: 70, act: "sedentary", env: "normal", ml: 2520, l: "2.5", gl: 10 },
    { n: "very + hot (capped)", w: 100, act: "very", env: "hot", ml: 4000, l: "4.0", gl: 16 },
    { n: "moderate + humid", w: 65, act: "moderately", env: "humid", ml: 3218, l: "3.2", gl: 13 },
    { n: "lightly + cold", w: 55, act: "lightly", env: "cold", ml: 1931, l: "1.9", gl: 8 },
    { n: "min weight 30", w: 30, act: "sedentary", env: "cold", ml: 972, l: "1.0", gl: 4 },
  ];
  for (const c of cases) {
    test(c.n, () => {
      const got = E.calculateWater({ weightKg: c.w, heightCm: 170, ageYears: 30, environment: c.env, activity: c.act });
      const ref = legacy.water(c.w, 170, 30, c.env, c.act);
      assert.equal(got.valueMl, c.ml, "golden ml");
      assert.equal(got.litres, c.l, "golden litres");
      assert.equal(got.glasses, c.gl, "golden glasses");
      assert.equal(got.valueMl, ref.ml, "differential");
      assert.equal(got.litres, ref.litres);
      assert.equal(got.glasses, ref.glasses);
    });
  }

  test("QUIRK Q7 — 4000ml cap applied before litres/glasses derived", () => {
    const got = E.calculateWater({ weightKg: 300, heightCm: 200, ageYears: 40, environment: "hot", activity: "very" });
    assert.equal(got.valueMl, 4000);
    assert.equal(got.litres, "4.0");
    assert.equal(got.glasses, 16);
  });

  test("bifurcation advice appears above 2800ml only", () => {
    assert.equal(E.calculateWater({ weightKg: 70, heightCm: 170, ageYears: 30, environment: "normal", activity: "sedentary" }).showBifurcation, false);
    assert.equal(E.calculateWater({ weightKg: 100, heightCm: 170, ageYears: 30, environment: "normal", activity: "moderately" }).showBifurcation, true);
  });
});

/* ========================== WHR ========================== */
describe("WHR — legacy: whrCalculator.html", () => {
  const cases = [
    { n: "female normal", wa: 70, hi: 95, g: "female", v: 0.74, cat: "Normal" },
    { n: "female increased risk", wa: 85, hi: 95, g: "female", v: 0.89, cat: "Increased Risk" },
    { n: "male normal", wa: 85, hi: 100, g: "male", v: 0.85, cat: "Normal" },
    { n: "male increased risk", wa: 95, hi: 100, g: "male", v: 0.95, cat: "Increased Risk" },
    { n: "decimal inputs", wa: 78.5, hi: 96.2, g: "female", v: 0.82, cat: "Increased Risk" },
  ];
  for (const c of cases) {
    test(c.n, () => {
      const got = E.calculateWHR({ waistCm: c.wa, hipCm: c.hi, gender: c.g });
      const ref = legacy.whr(c.wa, c.hi, c.g);
      assert.equal(got.value, c.v, "golden value");
      assert.equal(got.category, c.cat, "golden category");
      assert.equal(got.value, ref.rounded, "differential");
      assert.equal(got.category, ref.category, "differential");
    });
  }

  test("boundary — exactly at threshold is NOT increased risk", () => {
    const f = E.calculateWHR({ waistCm: 80, hipCm: 100, gender: "female" });
    assert.equal(f.value, 0.8);
    assert.equal(f.category, "Normal"); // 0.8 > 0.8 is false
    const m = E.calculateWHR({ waistCm: 90, hipCm: 100, gender: "male" });
    assert.equal(m.category, "Normal");
  });

  test("zero hip yields Infinity (legacy parity)", () => {
    const r = E.calculateWHR({ waistCm: 80, hipCm: 0, gender: "female" });
    assert.equal(r.raw, Infinity);
    assert.equal(r.category, "Increased Risk");
  });
});

/* ========================= WHtR ========================== */
describe("WHtR — legacy: whtrCalculator.html", () => {
  const male = [
    { n: "male healthy", wa: 80, h: 170, v: 0.47, cat: "Healthy" },
    { n: "male overweight", wa: 95, h: 170, v: 0.56, cat: "Overweight" },
    { n: "male extremely overweight", wa: 102, h: 170, v: 0.6, cat: "Extremely Overweight" },
    { n: "male highly obese", wa: 115, h: 170, v: 0.68, cat: "Highly Obese" },
    { n: "male slender", wa: 75, h: 170, v: 0.44, cat: "Slender & Healthy" },
    { n: "male extremely slim", wa: 65, h: 170, v: 0.38, cat: "Extremely Slim" },
    { n: "male abnormally slim", wa: 55, h: 170, v: 0.32, cat: "Abnormally Slim" },
  ];
  for (const c of male) {
    test(c.n, () => {
      const got = E.calculateWHtR({ waistCm: c.wa, heightCm: c.h, gender: "male" });
      assert.equal(got.value, c.v, "golden value");
      assert.equal(got.category, c.cat, "golden category");
      assert.equal(got.category, legacy.whtr(c.wa, c.h, "male").category, "differential");
    });
  }

  const female = [
    { n: "female healthy", wa: 80, h: 170, v: 0.47, cat: "Healthy" },
    { n: "female overweight", wa: 88, h: 170, v: 0.52, cat: "Overweight" },
    { n: "female highly obese", wa: 105, h: 170, v: 0.62, cat: "Highly Obese" },
    { n: "female slender", wa: 74, h: 170, v: 0.44, cat: "Slender & Healthy" },
  ];
  for (const c of female) {
    test(c.n, () => {
      const got = E.calculateWHtR({ waistCm: c.wa, heightCm: c.h, gender: "female" });
      assert.equal(got.value, c.v, "golden value");
      assert.equal(got.category, c.cat, "golden category");
      assert.equal(got.category, legacy.whtr(c.wa, c.h, "female").category, "differential");
    });
  }

  test("gender bands genuinely differ at same ratio", () => {
    const ratio = { waistCm: 85, heightCm: 170 }; // exactly 0.50
    assert.equal(E.calculateWHtR({ ...ratio, gender: "male" }).category, "Healthy");
    assert.equal(E.calculateWHtR({ ...ratio, gender: "female" }).category, "Overweight");
  });

  test("rejects out-of-range waist and height", () => {
    assert.equal(E.calculateWHtR({ waistCm: 39, heightCm: 170, gender: "male" }).ok, false);
    assert.equal(E.calculateWHtR({ waistCm: 201, heightCm: 170, gender: "male" }).ok, false);
    assert.equal(E.calculateWHtR({ waistCm: 80, heightCm: 119, gender: "male" }).ok, false);
    assert.equal(E.calculateWHtR({ waistCm: 80, heightCm: 251, gender: "male" }).ok, false);
  });
});

/* ====================== JUMP ROPE ======================== */
describe("Jump rope calories — legacy: jumpRopeCalorie.html", () => {
  const cases = [
    { n: "met 10, 70kg, 30min", w: 70, met: 10, d: 30, v: 367.5 },
    { n: "met 8.8, 60kg, 15min", w: 60, met: 8.8, d: 15, v: 138.6 },
    { n: "met 12.3, 85kg, 45min", w: 85, met: 12.3, d: 45, v: 823.3 },
    { n: "zero duration", w: 70, met: 10, d: 0, v: 0 },
    { n: "decimal weight", w: 72.5, met: 10, d: 20, v: 253.8 },
    { n: "very large duration", w: 70, met: 10, d: 600, v: 7350 },
  ];
  for (const c of cases) {
    test(c.n, () => {
      const got = E.calculateJumpRopeCalories({ weightKg: c.w, met: c.met, durationMinutes: c.d });
      assert.equal(got.value, c.v, "golden value");
      assert.equal(got.value, legacy.jumpRope(c.w, c.met, c.d), "differential");
    });
  }
});

/* ======================== BURPEES ======================== */
describe("Burpee calories — legacy: burpeesCalorie.html", () => {
  const cases = [
    { n: "68kg reference, 100 reps", w: 68, b: 100, v: 50 },
    { n: "70kg, 50 reps", w: 70, b: 50, v: 25.7 },
    { n: "90kg, 200 reps", w: 90, b: 200, v: 132.4 },
    { n: "zero reps", w: 70, b: 0, v: 0 },
    { n: "single rep", w: 70, b: 1, v: 0.5 },
    { n: "very large reps", w: 70, b: 10000, v: 5147.1 },
  ];
  for (const c of cases) {
    test(c.n, () => {
      const got = E.calculateBurpeesCalories({ weightKg: c.w, burpees: c.b });
      assert.equal(got.value, c.v, "golden value");
      assert.equal(got.value, legacy.burpees(c.w, c.b), "differential");
    });
  }
});

/* ========================== DKA ========================== */
describe("DKA criteria — legacy: diabeticKetoacidosis.html", () => {
  const allMet = { glucose: "yes", bicarbonate: "<10", anionGap: ">12", ph: "<7.00", serumKetone: "present", urineKetone: "present" };
  const noneMet = { glucose: "no", bicarbonate: ">18", anionGap: "<12", ph: ">7.30", serumKetone: "absent", urineKetone: "absent" };

  test("all six criteria met is severe", () => {
    const r = E.evaluateDKA(allMet);
    assert.equal(r.criteriaMet, 6);
    assert.equal(r.severe, true);
    assert.match(r.severeMessage, /severe form of diabetic ketoacidosis/);
  });

  test("no criteria met is not severe", () => {
    const r = E.evaluateDKA(noneMet);
    assert.equal(r.criteriaMet, 0);
    assert.equal(r.severe, false);
    assert.equal(r.severeMessage, null);
  });

  test("boundary — exactly 3 criteria triggers severe", () => {
    const r = E.evaluateDKA({ ...noneMet, glucose: "yes", anionGap: ">12", serumKetone: "present" });
    assert.equal(r.criteriaMet, 3);
    assert.equal(r.severe, true);
  });

  test("boundary — 2 criteria does not trigger severe", () => {
    const r = E.evaluateDKA({ ...noneMet, glucose: "yes", anionGap: ">12" });
    assert.equal(r.criteriaMet, 2);
    assert.equal(r.severe, false);
  });

  test("bicarbonate and pH use inverted (not-equal) logic", () => {
    // bicarbonate counts as MET when it is anything other than ">18"
    assert.equal(E.evaluateDKA({ ...noneMet, bicarbonate: "10-15" }).criteriaMet, 1);
    assert.equal(E.evaluateDKA({ ...noneMet, ph: "7.00-7.24" }).criteriaMet, 1);
  });

  test("criteria order and labels preserved", () => {
    const r = E.evaluateDKA(allMet);
    assert.deepEqual(r.lines.map((l) => l.key), ["glucose", "bicarbonate", "anionGap", "ph", "serumKetone", "urineKetone"]);
    assert.equal(r.lines[2].text, "anion Gap met criteria.");
  });
});
