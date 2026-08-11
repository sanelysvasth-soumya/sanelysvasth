# Functional Baseline — Svasth by Soumya

Captured before the Stage 3 rebuild. This document plus
`test/calculators.baseline.test.js` define the behaviour the redesigned
site must reproduce. **Deviating from this is a regression unless the
deviation is an explicitly agreed bug fix.**

Snapshot of the pre-migration implementation: `_archive/legacy/` (127 files).

---

## 1. Routes

### Rebuilt (new IA, live)

| New URL | Legacy URL | Redirect stub |
|---|---|---|
| `/` | `index.html` | n/a — same output path |
| `/calculators/` | `calculators.html` | ✅ |
| `/calculators/bmi/` | `bmiCalculator.html` | ✅ |
| `/calculators/bmr/` | `bmrCalculator.html` | ✅ |
| `/calculators/protein/` | `proteinCalculator.html` | ✅ |
| `/calculators/water/` | `waterCalculator.html` | ✅ |
| `/calculators/ideal-body-weight/` | `ibwCalculator.html` | ✅ |
| `/calculators/waist-to-hip/` | `whrCalculator.html` | ✅ |
| `/calculators/waist-to-height/` | `whtrCalculator.html` | ✅ |
| `/calculators/homa-ir/` | `homaIR.html` | ✅ |
| `/calculators/jump-rope/` | `jumpRopeCalorie.html` | ✅ |
| `/calculators/burpees/` | `burpeesCalorie.html` | ✅ |
| `/calculators/dka/` | `diabeticKetoacidosis.html` | ✅ |
| `/404.html`, `/sitemap.xml`, `/robots.txt` | — | new |

### Carried through unchanged (not yet migrated)

**None — migration is complete as of Stage 6.** The `legacy/` directory
and the strangler-fig passthrough bridge in `eleventy.config.js` have both
been removed. Every page is now built from `src/`.

### Removed

| File(s) | Reason |
|---|---|
| `premium_3d_index.html`, `portfolio.html`, `template.html` | Abandoned drafts (Stage 3) |
| `girlsHeightForAge.html` | Unreferenced prototype — no percentile data, no site chrome (Stage 5) |
| `habit_tracker.html`, `tracker.html` | Confirmed no longer used (Stage 6) |
| `nav.html`, `footer.html` | Fragments only the legacy pages loaded via `$.load()` |
| jQuery 1.11.1, Bootstrap 3 CSS, Font Awesome 4 | Last consumers deleted |

All recoverable from `_archive/legacy/`.

**Note:** `/habit_tracker.html` and `/tracker.html` now return 404 by
design — they were genuinely retired, not moved, so a redirect would be a
soft-404. Every *migrated* page keeps a redirect stub at its old URL.

---

## 2. Calculators — inputs, outputs, formulas

All formulas transcribed verbatim into
`src/assets/js/calculators/engines.js`. **100 regression tests pass.**

| Calculator | Inputs | Output | Formula |
|---|---|---|---|
| BMI | height cm, weight kg, age | value 1dp + category + message | `kg / m²` |
| BMR | weight, height, age, gender | kcal int + 5 activity levels | Harris-Benedict |
| Protein | weight, height, age, gender, goal, activity | g/day int + 4-way split | `kg × activity × goal` |
| Water | weight, height, age, gender, activity, environment | ml, litres, glasses | `kg × 30 × activity × env`, capped 4000 |
| IBW | height, age, gender | kg 1dp + ±1.5 range | Hamwi ≥152.4cm, Broca below |
| WHR | waist, hip, gender | ratio 2dp + category | `waist / hip` |
| WHtR | waist, height, gender | ratio 2dp + 7 bands | `waist / height` |
| HOMA-IR | insulin+unit, glucose+unit | HOMA-IR 2dp, QUICKI 4dp | `(ins × glu) / 22.5` |
| Jump rope | weight, MET, minutes | kcal 1dp | `(MET × kg × 7 / 400) × min` |
| Burpees | weight, reps | kcal 1dp | `(kg / 68) × 0.5 × reps` |
| DKA | 6 clinical selects | count of 6 + severity | ≥3 criteria = severe |

### Validation rules (unchanged)

- BMI, IBW — reject age < 18
- BMR, Protein, Water — weight 30–300 kg, height 120–250 cm, age 15–120
- WHtR — waist 40–200 cm, height 120–250 cm
- WHR, jump rope, burpees, HOMA-IR, DKA — no range validation in legacy

---

## 3. Preserved quirks

These are **intentionally reproduced**. Each has a dedicated test.

| # | Behaviour | Note |
|---|---|---|
| Q1 | BMI / WHR / WHtR band on the **unrounded** value but display the rounded one | 66.36 kg @ 170 cm shows "23" yet bands "Normal Weight" |
| Q2 | IBW below 152.4 cm divides the Broca result by 2.2 a second time | **Suspected bug.** 150 cm female → 19.3 kg. Preserved pending your decision |
| Q3 | Protein `maintenance` factor 0.8 is lower than `fat_loss` 1.1 | Looks inverted; preserved as authored |
| Q4 | Protein meal split is `round(total/4)` ×4, so parts need not sum to total | 130 g → 33+33+33+33 = 132 |
| Q5 | HOMA-IR passes mmol/L glucose through unconverted | Only mg/dL is divided by 18 |
| Q6 | QUICKI with zero insulin yields `-0` | `log10(0)` → `-Infinity` |
| Q7 | Water 4000 ml cap applied **before** deriving litres/glasses | |

---

## 4. Forms and integrations

> **CORRECTION (Stage 4).** This section previously said the forms used
> Formspree. That was wrong. Every form posts to a **Google Apps Script**
> web app. The corrected contract is below.

| Form | New location | Backend | Sheet | Status |
|---|---|---|---|---|
| Contact message | `/contact/` | Google Apps Script | `Leads` (was `Sheet4`) | Rebuilt, contract preserved |
| Gut questionnaire | `/questionnaire/gut/` | Google Apps Script | `Gut_Health` (was `Sheet1`) | Rebuilt, contract preserved |
| PCOS questionnaire | `questionniarePCOS.html` | Google Apps Script | `PCOS` (was `Sheet2`) | Legacy, unchanged |
| Habit tracker | `habit_tracker.html` | `localStorage` | — (never wrote to a sheet; retired in Stage 6) | Legacy, unchanged |

**Endpoint (all three forms):**
`https://script.google.com/macros/s/AKfycbzWpa98yHvCTYfp0aiOrScOgGhXxZ5EXR6v2cSUtTnhEQpj9fzYhyOWlIacKgxA53vGBA/exec`

**Transport — must not be "modernised".** The endpoint sends no CORS
headers, so `fetch()` is blocked. Both rebuilt forms reproduce the legacy
workaround exactly: a hidden `<iframe>` containing a synthesised `<form>`
that POSTs cross-origin. The response is opaque, so success is reported
optimistically — the legacy behaviour, preserved deliberately.

**Payload shapes (unchanged):**
- Contact — `sheetName`, `Name`, `Contact`, `Subject`, `Message`
- Gut — `sheetName`, `name`, `contact`, `score`, `category`,
  `highSymptoms` (comma-joined string), `timestamp`, `Q1`…`Q26`
  (26 questions, one field each, ids sequential — see the reset note below)

**No API integration was altered.** WhatsApp CTA
(`wa.me/message/U43IYBJMJDQAD1`) unchanged.

---

## 3b. Gut questionnaire quirks (Stage 4)

| # | Behaviour | Note |
|---|---|---|
| G1 | Score is a percentage of the **maximum** (125), so all-"Never" scores 20%, never 0% | Lowest achievable band is "Excellent" at exactly 20% |
| G2 | Question 8 uses a non-monotonic scale `[1,2,5,4,3]` — "Once a day" scores highest | Inverts the meaning of a high score for that one question |
| G3 | "High symptoms" are answers >= 4 | Sent as a comma-joined string |

(G1's denominator is 26 × 5 = **130**, not 125 — the table above predates
the current 26-question set.)

### Question-id reset — 2026-08-11 (authorised)

Ids used to be frozen across edits so historical `Q<id>` columns kept
their meaning. Retired ids 16, 18 and 25 were left unused and newer
questions ran on to 29. Result: **Q16/Q18/Q25 always empty, live answers
landing in Q27-Q29.**

The old Gut_Health data has been archived to a separate sheet, so that
scheme is retired. Ids are now **sequential 1..26 and equal to display
position**: question N -> payload `QN` -> column `QN`. Nothing else
changed — question wording, order, options and scoring are identical, and
`Q25` ("Eczema / Psoriasis / Rosacea / Rashes?") remains one question with
one answer in one column. `gut-engine.js` throws at import if any id ever
drifts from its position.

---

## 4b. Growth charts (Stage 5)

Six charts, three distinct percentile algorithms, all preserved:

| Algorithm | Charts | Behaviour |
|---|---|---|
| A | boys 0-2 | 13 bands; walk-and-break; returns a **single** band ("50th") or "below 1st" |
| B | boys 2-5, boys 5-18 | 7 bands; exact age match via `xValues.indexOf(age)`; returns a **range** |
| C | girls 0-2, 2-5, 5-18 | 7 bands; linearly interpolated; returns a **range** |

Quirk preserved (B): an age not exactly on the axis returns "below 3rd" —
e.g. 2.5 years on the boys 2-5 chart, whose axis is `[2, 2.4, 2.8, 3, …]`.

**Charting libraries removed.** Chart.js 3.9.1 and Highcharts (+4 modules)
were loaded from CDNs — roughly 600KB for seven polylines. Both are gone;
charts are now inline SVG rendered by `growth-chart.js` (~6KB), with the
same numbers also exposed as a real `<table>`.

### ⚠️ AUTHORISED BUG FIX — girls 2-5 and 5-18 percentile lookup

Algorithm C indexed its band arrays with `Math.floor(age)`. That is only
correct when the array is indexed by age, which held for girls 0-2 (age in
months) but not for the other two.

| Chart | Legacy behaviour | Impact |
|---|---|---|
| girls 2-5 | age 5 read the value for age **3.25** | A 109.4cm five-year-old (exactly 50th) was reported **"above 97th"** |
| girls 5-18 | age 14+ indexed past the end of the array | Every girl aged **14-18** was reported **"below 3rd"** regardless of height |

Fixed with the user's explicit approval: values are now interpolated
against the chart's own `xValues`. **Girls 0-2 output is unchanged.**
`test/growth.baseline.test.js` asserts both the corrected behaviour and
the legacy behaviour it replaced, so the change is documented in code.

---

## 4c. PCOS questionnaire (Stage 5)

37 questions, 4 root-cause groups, posting to `PCOS` (renamed from `Sheet2`). Quirks preserved:

| # | Behaviour |
|---|---|
| P1 | A group's score is the **count** of answers >= 4, not their sum — a 4 and a 5 both add 1 |
| P2 | Groups are unequally sized (13 / 7 / 10 / 7) and compared **raw**, never normalised, so Insulin Resistance has nearly double the ceiling of Inflammatory or Adrenal |
| P3 | "Mixed" is returned on a tie, on a lead of <= 1 over a non-zero runner-up, or when the top score is 0 — a clear result needs a lead of 2 |
| P4 | Q21 is Yes/No scored 2/1, so it can never reach the >= 4 threshold and never contributes to any score |
| P5 | Answering "No" to Q21 skips Q22-Q30 entirely; those stay unanswered and are omitted from the payload |
| P6 | Trailing full stops are stripped from symptom text |

Payload key `PillInducedScore` maps to the group named `Post-Birth Control`
— the mismatch is legacy and preserved.

---

## 5. Pre-existing defects found (NOT fixed — need your decision)

1. **`img/bg2.jpg` and `img/bg3.jpg` do not exist.** 15 legacy pages
   reference them and have been silently 404-ing, rendering a plain dark
   band. The rebuilt calculators hub uses a solid header to match what
   users actually see. Remaining legacy pages still carry the broken
   reference until migrated.
2. **Footer email mismatch.** Displays `sanelysvasth@gmail.com`, links to
   `mailto:info.svasth@gmail.com`. Both preserved verbatim in
   `src/_data/site.js`.
3. **IBW sub-152.4 cm double division** (Q2 above) produces implausible
   weights.
4. **Contact page address** reads "Coming Soon…!".
5. **Two site names in titles** — several legacy calculators said
   "HealthScore". Fixed on rebuilt pages only.

---

## 6. Running the baseline

```bash
npm test
```

100 tests across 11 suites. Every case runs the new engine **and** an
independently transcribed copy of the legacy formula, asserting they
agree — so a transcription error fails the build rather than shipping.
The GitHub Actions workflow runs this before every deploy.
