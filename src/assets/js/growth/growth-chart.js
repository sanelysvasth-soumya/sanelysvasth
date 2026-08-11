/**
 * Growth chart renderer — inline SVG, no charting library.
 *
 * Replaces Chart.js 3.9.1 (boys charts) and Highcharts + 4 modules
 * (girls charts), both loaded from CDNs. Those were ~600KB combined for
 * what is, in the end, seven polylines and a marker. This module is ~6KB
 * and has no third-party dependency or licence obligation.
 *
 * Accessibility: the SVG is labelled and marked `role="img"`, and every
 * page also renders the same numbers as a real <table>, so the data is
 * reachable without seeing the graphic.
 */

const NS = "http://www.w3.org/2000/svg";

/** Percentile line colours — brand-neutral, consistent across all charts. */
const BAND_COLORS = {
  "1st": "#B4573F", "3rd": "#B4573F", "5th": "#BE7A46",
  "10th": "#BE7A46", "15th": "#A98C3F", "25th": "#8A9350",
  "50th": "#1E2429", "75th": "#4E8A86", "85th": "#4A7FA0",
  "90th": "#4A7FA0", "95th": "#6A6FA8", "97th": "#7C5F9E",
  "99th": "#7C5F9E",
};

const el = (name, attrs = {}) => {
  const node = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
};

/** Nice round tick values covering [min, max]. */
function ticks(min, max, count = 6) {
  const span = max - min;
  if (span <= 0) return [min];
  const raw = span / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? mag * 10;
  const start = Math.ceil(min / step) * step;
  const out = [];
  for (let v = start; v <= max + 1e-9; v += step) out.push(Math.round(v * 100) / 100);
  return out;
}

export function renderGrowthChart(container, chart, { point = null } = {}) {
  const W = 760;
  const H = 460;
  const M = { top: 16, right: 18, bottom: 46, left: 52 };
  const plotW = W - M.left - M.right;
  const plotH = H - M.top - M.bottom;

  const xs = chart.xValues;
  const xMin = xs[0];
  const xMax = xs[xs.length - 1];

  let yMin = Infinity;
  let yMax = -Infinity;
  for (const values of Object.values(chart.bands)) {
    for (const v of values) {
      if (v < yMin) yMin = v;
      if (v > yMax) yMax = v;
    }
  }
  if (point) {
    yMin = Math.min(yMin, point.height);
    yMax = Math.max(yMax, point.height);
  }
  const pad = (yMax - yMin) * 0.06 || 1;
  yMin -= pad;
  yMax += pad;

  const sx = (v) => M.left + ((v - xMin) / (xMax - xMin)) * plotW;
  const sy = (v) => M.top + plotH - ((v - yMin) / (yMax - yMin)) * plotH;

  const svg = el("svg", {
    viewBox: `0 0 ${W} ${H}`,
    class: "growth-chart__svg",
    role: "img",
    "aria-label": `${chart.chartTitle}. Percentile curves from the 3rd to the 97th, plotted against ${chart.xLabel.toLowerCase()}.`,
    preserveAspectRatio: "xMidYMid meet",
  });

  /* ---- grid + axes ---- */
  const grid = el("g", { class: "growth-chart__grid" });
  for (const t of ticks(yMin, yMax)) {
    grid.append(el("line", { x1: M.left, x2: M.left + plotW, y1: sy(t), y2: sy(t) }));
    const label = el("text", {
      x: M.left - 8, y: sy(t), class: "growth-chart__tick", "text-anchor": "end",
      "dominant-baseline": "middle",
    });
    label.textContent = t;
    svg.append(label);
  }
  const xTickValues = xs.length > 14 ? xs.filter((_, i) => i % Math.ceil(xs.length / 12) === 0) : xs;
  for (const t of xTickValues) {
    grid.append(el("line", {
      x1: sx(t), x2: sx(t), y1: M.top, y2: M.top + plotH, class: "growth-chart__grid-v",
    }));
    const label = el("text", {
      x: sx(t), y: M.top + plotH + 18, class: "growth-chart__tick", "text-anchor": "middle",
    });
    label.textContent = t;
    svg.append(label);
  }
  svg.prepend(grid);

  // axis titles
  const xTitle = el("text", {
    x: M.left + plotW / 2, y: H - 6, class: "growth-chart__axis-title", "text-anchor": "middle",
  });
  xTitle.textContent = chart.xLabel;
  const yTitle = el("text", {
    x: 12, y: M.top + plotH / 2, class: "growth-chart__axis-title", "text-anchor": "middle",
    transform: `rotate(-90 12 ${M.top + plotH / 2})`,
  });
  yTitle.textContent = chart.yLabel;
  svg.append(xTitle, yTitle);

  /* ---- percentile curves ---- */
  for (const [band, values] of Object.entries(chart.bands)) {
    const d = values.map((y, i) => `${i ? "L" : "M"}${sx(xs[i]).toFixed(1)},${sy(y).toFixed(1)}`).join(" ");
    svg.append(el("path", {
      d,
      fill: "none",
      stroke: BAND_COLORS[band] ?? "#888",
      "stroke-width": band === "50th" ? 2.4 : 1.3,
      "stroke-dasharray": band === "50th" ? "" : "4 3",
      "stroke-linejoin": "round",
      class: "growth-chart__line",
      "data-band": band,
    }));

    // end-of-line band label
    const last = values[values.length - 1];
    const text = el("text", {
      x: M.left + plotW + 2, y: sy(last), class: "growth-chart__band-label",
      fill: BAND_COLORS[band] ?? "#888", "dominant-baseline": "middle",
    });
    text.textContent = band;
    if (Object.keys(chart.bands).length <= 7) svg.append(text);
  }

  /* ---- plotted child ---- */
  if (point && Number.isFinite(point.age) && Number.isFinite(point.height)) {
    const cx = sx(point.age);
    const cy = sy(point.height);
    svg.append(el("line", {
      x1: cx, x2: cx, y1: M.top, y2: M.top + plotH, class: "growth-chart__marker-guide",
    }));
    svg.append(el("circle", { cx, cy, r: 7, class: "growth-chart__marker-halo" }));
    svg.append(el("circle", { cx, cy, r: 4.5, class: "growth-chart__marker" }));
  }

  container.replaceChildren(svg);
  return svg;
}

export { BAND_COLORS };
