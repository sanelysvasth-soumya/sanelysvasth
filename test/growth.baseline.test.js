/**
 * FUNCTIONAL BASELINE — growth chart percentiles.
 *
 * Boys charts (A, B): asserted to match legacy behaviour exactly.
 * Girls charts (C): assert the CORRECTED behaviour, and separately
 * demonstrate the legacy bug so the intentional change is documented in
 * code rather than only in prose.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { classify, interpolateAt, yExtent } from "../src/assets/js/growth/growth-engine.js";

const CHARTS = JSON.parse(
  readFileSync(new URL("../src/_data/growthCharts.json", import.meta.url))
);

/* ---------- legacy reference implementations (verbatim) ---------- */
const legacy = {
  // boys0to2LFA
  A(chart, age, height) {
    let percentile = "below 1st";
    for (const [label, data] of Object.entries(chart.bands)) {
      if (height >= data[age]) percentile = label;
      else break;
    }
    return percentile;
  },
  // boys2to5LFA / boys5to18HFA
  B(chart, age, height) {
    const b = chart.bands;
    const i = chart.xValues.indexOf(age);
    if (i === -1) return "below 3rd";
    if (height >= b["97th"][i]) return "above 97th";
    if (height >= b["90th"][i]) return "90th-97th";
    if (height >= b["75th"][i]) return "75th-90th";
    if (height >= b["50th"][i]) return "50th-75th";
    if (height >= b["25th"][i]) return "25th-50th";
    if (height >= b["10th"][i]) return "10th-25th";
    if (height >= b["3rd"][i]) return "3rd-10th";
    return "below 3rd";
  },
  /** The BUGGY girls lookup — kept only to prove what the fix changed. */
  C_buggy(chart, age, height) {
    const floor = Math.floor(age);
    const ceil = Math.ceil(age);
    const frac = age - floor;
    const at = {};
    for (const p of Object.keys(chart.bands)) {
      const d = chart.bands[p];
      at[p] = floor === ceil ? d[floor] : d[floor] + (d[ceil] - d[floor]) * frac;
    }
    if (height >= at["97th"]) return "above 97th";
    if (height >= at["90th"]) return "90th-97th";
    if (height >= at["75th"]) return "75th-90th";
    if (height >= at["50th"]) return "50th-75th";
    if (height >= at["25th"]) return "25th-50th";
    if (height >= at["10th"]) return "10th-25th";
    if (height >= at["3rd"]) return "3rd-10th";
    return "below 3rd";
  },
};

/* ================= data integrity ================= */
describe("Growth data — extracted from legacy", () => {
  test("all six charts present", () => {
    assert.deepEqual(Object.keys(CHARTS).sort(), [
      "boys-0-2", "boys-2-5", "boys-5-18",
      "girls-0-2", "girls-2-5", "girls-5-18",
    ]);
  });

  test("boys 0-2 carries 13 bands over 25 monthly points", () => {
    const c = CHARTS["boys-0-2"];
    assert.equal(Object.keys(c.bands).length, 13);
    assert.equal(c.bands["1st"].length, 25);
    assert.deepEqual(c.bands["1st"].slice(0, 5), [45.5, 50.2, 53.8, 56.7, 59]);
  });

  test("seven-band charts all carry the same band set", () => {
    for (const key of ["boys-2-5", "boys-5-18", "girls-0-2", "girls-2-5", "girls-5-18"]) {
      assert.deepEqual(
        Object.keys(CHARTS[key].bands).sort(),
        ["10th", "25th", "3rd", "50th", "75th", "90th", "97th"],
        key
      );
    }
  });

  test("every band has one value per plotted age", () => {
    for (const [key, c] of Object.entries(CHARTS)) {
      for (const [band, values] of Object.entries(c.bands)) {
        assert.equal(values.length, c.xValues.length, `${key} ${band}`);
      }
    }
  });

  test("bands are monotonically increasing at every age", () => {
    for (const [key, c] of Object.entries(CHARTS)) {
      const order = Object.keys(c.bands);
      for (let i = 0; i < c.xValues.length; i++) {
        for (let b = 1; b < order.length; b++) {
          assert.ok(
            c.bands[order[b]][i] >= c.bands[order[b - 1]][i],
            `${key} at x=${c.xValues[i]}: ${order[b]} < ${order[b - 1]}`
          );
        }
      }
    }
  });
});

/* ================= algorithm A ================= */
describe("Boys 0-2 (algorithm A) — single band, matches legacy", () => {
  const c = CHARTS["boys-0-2"];
  const cases = [
    { age: 0, h: 49.9, want: "50th" },
    { age: 0, h: 45.0, want: "below 1st" },
    { age: 12, h: 75.7, want: "50th" },
    { age: 24, h: 87.8, want: "50th" },
    { age: 24, h: 95.0, want: "99th" },
    { age: 6, h: 67.6, want: "50th" },
  ];
  for (const t of cases) {
    test(`age ${t.age}mo, ${t.h}cm -> ${t.want}`, () => {
      const got = classify(c, t.age, t.h);
      assert.equal(got.percentile, t.want, "golden");
      assert.equal(got.percentile, legacy.A(c, t.age, t.h), "differential vs legacy");
    });
  }

  test("returns a single band label, not a range", () => {
    assert.equal(classify(c, 12, 75.7).kind, "band");
  });

  test("sentence uses the legacy 'approximately the Nth percentile' phrasing", () => {
    assert.match(classify(c, 12, 75.7).sentence, /approximately the 50th percentile\.$/);
    assert.match(classify(c, 12, 75.7).sentence, /^At age 12 months, a length of/);
  });
});

/* ================= algorithm B ================= */
describe("Boys 2-5 / 5-18 (algorithm B) — ranges, matches legacy", () => {
  const c25 = CHARTS["boys-2-5"];
  const c518 = CHARTS["boys-5-18"];

  test("boys 2-5 at a plotted age", () => {
    const got = classify(c25, 3, c25.bands["50th"][c25.xValues.indexOf(3)]);
    assert.equal(got.percentile, "50th-75th");
    assert.equal(got.percentile, legacy.B(c25, 3, c25.bands["50th"][3]));
  });

  test("boys 2-5 above the top band", () => {
    assert.equal(classify(c25, 5, 200).percentile, "above 97th");
  });

  test("boys 2-5 below the bottom band", () => {
    assert.equal(classify(c25, 5, 50).percentile, "below 3rd");
  });

  test("QUIRK — an age not exactly on the axis falls through to 'below 3rd'", () => {
    // 2.5 is not in [2, 2.4, 2.8, 3, …]; legacy returns the default.
    const got = classify(c25, 2.5, 90);
    assert.equal(got.percentile, "below 3rd");
    assert.equal(got.offChart, true);
    assert.equal(got.percentile, legacy.B(c25, 2.5, 90));
  });

  test("boys 5-18 across every plotted age agrees with legacy", () => {
    for (const age of c518.xValues) {
      for (const h of [100, 130, 150, 170, 200]) {
        assert.equal(
          classify(c518, age, h).percentile,
          legacy.B(c518, age, h),
          `age ${age}, ${h}cm`
        );
      }
    }
  });
});

/* ================= algorithm C — the fix ================= */
describe("Girls (algorithm C) — CORRECTED age lookup", () => {
  const g02 = CHARTS["girls-0-2"];
  const g25 = CHARTS["girls-2-5"];
  const g518 = CHARTS["girls-5-18"];

  test("girls 0-2 is UNCHANGED by the fix (index and age coincide there)", () => {
    for (let age = 0; age <= 24; age++) {
      for (const h of [50, 60, 70, 80, 90]) {
        assert.equal(
          classify(g02, age, h).percentile,
          legacy.C_buggy(g02, age, h),
          `age ${age}mo, ${h}cm`
        );
      }
    }
  });

  test("FIX — girls 2-5: a 50th-percentile 5-year-old now reads 50th-75th", () => {
    const trueMedian = g25.bands["50th"][g25.xValues.indexOf(5)]; // 109.4
    assert.equal(trueMedian, 109.4);

    const fixed = classify(g25, 5, trueMedian).percentile;
    const buggy = legacy.C_buggy(g25, 5, trueMedian);

    assert.equal(fixed, "50th-75th", "corrected");
    assert.equal(buggy, "above 97th", "legacy misreported this child");
    assert.notEqual(fixed, buggy, "this is the intentional behaviour change");
  });

  test("FIX — girls 5-18: ages 14-18 no longer always report 'below 3rd'", () => {
    for (const age of [14, 15, 16, 17, 18]) {
      const median = g518.bands["50th"][g518.xValues.indexOf(age)];
      assert.equal(
        legacy.C_buggy(g518, age, median),
        "below 3rd",
        `legacy misreported age ${age}`
      );
      assert.equal(
        classify(g518, age, median).percentile,
        "50th-75th",
        `corrected at age ${age}`
      );
    }
  });

  test("girls 2-5 and 5-18 read the median correctly at every plotted age", () => {
    for (const c of [g25, g518]) {
      for (const age of c.xValues) {
        const median = c.bands["50th"][c.xValues.indexOf(age)];
        assert.equal(
          classify(c, age, median).percentile,
          "50th-75th",
          `age ${age}`
        );
      }
    }
  });

  test("interpolates between plotted ages", () => {
    // Midway between two quarter-year points should sit between their values
    const i = g25.xValues.indexOf(3);
    const lo = g25.bands["50th"][i];
    const hi = g25.bands["50th"][i + 1];
    const mid = interpolateAt(g25.xValues, g25.bands["50th"], (g25.xValues[i] + g25.xValues[i + 1]) / 2);
    assert.ok(mid > lo && mid < hi, `${lo} < ${mid} < ${hi}`);
  });

  test("ages outside the chart range are reported as off-chart", () => {
    assert.equal(classify(g25, 1, 90).offChart, true);
    assert.equal(classify(g518, 20, 160).offChart, true);
  });

  test("extreme heights land in the outer bands", () => {
    assert.equal(classify(g518, 10, 250).percentile, "above 97th");
    assert.equal(classify(g518, 10, 50).percentile, "below 3rd");
  });
});

/* ================= helpers ================= */
describe("Chart helpers", () => {
  test("interpolateAt clamps outside the range", () => {
    const x = [0, 1, 2];
    const y = [10, 20, 30];
    assert.equal(interpolateAt(x, y, -5), 10);
    assert.equal(interpolateAt(x, y, 99), 30);
    assert.equal(interpolateAt(x, y, 0.5), 15);
    assert.equal(interpolateAt(x, y, 1), 20);
  });

  test("yExtent spans every band with padding", () => {
    const c = CHARTS["boys-0-2"];
    const { min, max } = yExtent(c);
    assert.ok(min < c.bands["1st"][0]);
    assert.ok(max > c.bands["99th"][24]);
  });
});
