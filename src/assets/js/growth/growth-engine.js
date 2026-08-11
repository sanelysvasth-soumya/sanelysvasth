/**
 * Growth chart percentile engine — PURE, no DOM.
 *
 * ============================ CONTRACT ============================
 * Percentile datasets are extracted verbatim from the legacy pages into
 * src/_data/growthCharts.json. No value was retyped by hand.
 *
 * Three distinct algorithms existed in the legacy code and all three are
 * preserved, because they produce genuinely different output shapes:
 *
 *   A — boys 0-2. Thirteen bands (1st…99th). Walks the bands in order and
 *       keeps the highest one the height meets, breaking at the first
 *       miss. Returns a SINGLE band ("50th") or "below 1st".
 *
 *   B — boys 2-5, boys 5-18. Seven bands. Exact age match via
 *       xValues.indexOf(age); no interpolation. Returns a RANGE
 *       ("50th-75th"), "above 97th", or "below 3rd".
 *
 *   C — girls 0-2, 2-5, 5-18. Seven bands, linearly interpolated between
 *       neighbouring ages so fractional ages work. Returns a RANGE.
 *
 * ⚠️ INTENTIONAL BUG FIX (authorised — see BASELINE.md §5):
 * Algorithm C previously indexed its band arrays with Math.floor(age),
 * which is only correct when the array happens to be indexed by age.
 * That held for girls 0-2 (age in months, 25 entries) but NOT for:
 *   - girls 2-5, whose data is in 0.25-year steps, so age 5 read the
 *     value for age 3.25 and a 109.4cm five-year-old (true 50th) was
 *     reported "above 97th";
 *   - girls 5-18, where age 14+ indexed past the end of the array,
 *     making every comparison against `undefined` false and reporting
 *     "below 3rd" for EVERY girl aged 14-18 regardless of height.
 *
 * The fix interpolates against the chart's own xValues (the ages actually
 * plotted) rather than treating the index as an age. Girls 0-2 output is
 * unchanged by this, because there index and age coincide.
 * ==================================================================
 */

/* ---------------- shared helpers ---------------- */

/**
 * Value of one percentile band at an arbitrary age, linearly interpolated
 * between the two nearest plotted ages. Ages outside the range clamp to
 * the nearest end.
 */
export function interpolateAt(xValues, values, age) {
  const n = xValues.length;
  if (!n) return NaN;
  if (age <= xValues[0]) return values[0];
  if (age >= xValues[n - 1]) return values[n - 1];

  for (let i = 0; i < n - 1; i++) {
    const x0 = xValues[i];
    const x1 = xValues[i + 1];
    if (age >= x0 && age <= x1) {
      if (x1 === x0) return values[i];
      const t = (age - x0) / (x1 - x0);
      return values[i] + (values[i + 1] - values[i]) * t;
    }
  }
  return values[n - 1];
}

/** Band order used by the seven-band charts, lowest to highest. */
const SEVEN = ["3rd", "10th", "25th", "50th", "75th", "90th", "97th"];

/** Range labels returned by algorithms B and C, highest band first. */
const RANGE_LABELS = [
  ["97th", "above 97th"],
  ["90th", "90th-97th"],
  ["75th", "75th-90th"],
  ["50th", "50th-75th"],
  ["25th", "25th-50th"],
  ["10th", "10th-25th"],
  ["3rd", "3rd-10th"],
];

/* ---------------- algorithm A ---------------- */
/** Legacy: boys0to2LFA.html — single band, direct index by age in months. */
function algorithmA(chart, age, height) {
  const idx = Math.round(age);
  let percentile = "below 1st";

  for (const [label, values] of Object.entries(chart.bands)) {
    const at = values[idx];
    if (at === undefined) break;
    if (height >= at) percentile = label;
    else break;
  }
  return { percentile, kind: "band" };
}

/* ---------------- algorithm B ---------------- */
/** Legacy: boys2to5LFA / boys5to18HFA — exact age match, no interpolation. */
function algorithmB(chart, age, height) {
  const idx = chart.xValues.indexOf(age);
  if (idx === -1) return { percentile: "below 3rd", kind: "range", offChart: true };

  for (const [band, label] of RANGE_LABELS) {
    const at = chart.bands[band]?.[idx];
    if (at !== undefined && height >= at) return { percentile: label, kind: "range" };
  }
  return { percentile: "below 3rd", kind: "range" };
}

/* ---------------- algorithm C (fixed) ---------------- */
/** Legacy: girls charts — interpolated. See the fix note in the header. */
function algorithmC(chart, age, height) {
  if (age < chart.ageMin || age > chart.ageMax) {
    return { percentile: "below 3rd", kind: "range", offChart: true };
  }

  const at = {};
  for (const band of SEVEN) {
    const values = chart.bands[band];
    if (values) at[band] = interpolateAt(chart.xValues, values, age);
  }

  for (const [band, label] of RANGE_LABELS) {
    if (at[band] !== undefined && height >= at[band]) {
      return { percentile: label, kind: "range" };
    }
  }
  return { percentile: "below 3rd", kind: "range" };
}

/* ---------------- public API ---------------- */

const ALGORITHMS = { A: algorithmA, B: algorithmB, C: algorithmC };

/**
 * @param {object} chart  one entry from growthCharts.json
 * @param {number} age    in the chart's own unit (months or years)
 * @param {number} height in cm
 */
export function classify(chart, age, height) {
  const fn = ALGORITHMS[chart.algorithm];
  if (!fn) throw new Error(`Unknown growth algorithm: ${chart.algorithm}`);

  const result = fn(chart, age, height);
  return {
    ...result,
    age,
    height,
    ageUnit: chart.ageUnit,
    measureLabel: chart.measureLabel,
    /** Human sentence, matching the legacy phrasing for each algorithm. */
    sentence:
      result.kind === "band"
        ? `At age ${age} ${chart.ageUnit}, a ${chart.measureLabel} of ${height} cm is at approximately the ${result.percentile} percentile.`
        : `At age ${age} ${chart.ageUnit}, a ${chart.measureLabel} of ${height} cm is in the ${result.percentile} percentile range.`,
  };
}

/** Series ready for plotting: [{ band, points: [[x, y], …] }, …]. */
export function toSeries(chart) {
  return Object.entries(chart.bands).map(([band, values]) => ({
    band,
    points: values.map((y, i) => [chart.xValues[i], y]),
  }));
}

/** Y-axis extent across every band, with a little padding. */
export function yExtent(chart, pad = 0.04) {
  let min = Infinity;
  let max = -Infinity;
  for (const values of Object.values(chart.bands)) {
    for (const v of values) {
      if (typeof v !== "number") continue;
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }
  const span = max - min || 1;
  return { min: min - span * pad, max: max + span * pad };
}
