import fs from "node:fs";
import path from "node:path";

/**
 * Redirect map for pages migrated to the new information architecture.
 *
 * Legacy URLs are live and indexed, so every migrated page leaves a
 * redirect stub behind at its old path. Without these, `/bmiCalculator.html`
 * would 404 for anyone with a bookmark or an inbound link.
 *
 * NOTE: no entry for /index.html — the rebuilt home page already writes
 * to _site/index.html, so that legacy URL resolves to the new page
 * directly. Adding a redirect there would collide with it.
 */

/** Hand-maintained: pages whose slug changed during the rebuild. */
const manual = [
  { from: "/calculators.html", to: "/calculators/" },
  { from: "/bmiCalculator.html", to: "/calculators/bmi/" },
  { from: "/bmrCalculator.html", to: "/calculators/bmr/" },
  { from: "/proteinCalculator.html", to: "/calculators/protein/" },
  { from: "/waterCalculator.html", to: "/calculators/water/" },
  { from: "/ibwCalculator.html", to: "/calculators/ideal-body-weight/" },
  { from: "/whrCalculator.html", to: "/calculators/waist-to-hip/" },
  { from: "/whtrCalculator.html", to: "/calculators/waist-to-height/" },
  { from: "/homaIR.html", to: "/calculators/homa-ir/" },
  { from: "/jumpRopeCalorie.html", to: "/calculators/jump-rope/" },
  { from: "/burpeesCalorie.html", to: "/calculators/burpees/" },
  { from: "/diabeticKetoacidosis.html", to: "/calculators/dka/" },
  { from: "/blogs.html", to: "/blogs/" },
  { from: "/recipes.html", to: "/recipes/" },
  { from: "/about.html", to: "/about/" },
  { from: "/services.html", to: "/services/" },
  { from: "/contact.html", to: "/contact/" },
  { from: "/questionnaire.html", to: "/questionnaire/" },
  { from: "/questionniareGut.html", to: "/questionnaire/gut/" },
  { from: "/questionniarePCOS.html", to: "/questionnaire/pcos/" },
  { from: "/boys0to2LFA.html", to: "/growth-charts/boys-0-2-years/" },
  { from: "/boys2to5LFA.html", to: "/growth-charts/boys-2-5-years/" },
  { from: "/boys5to18HFA.html", to: "/growth-charts/boys-5-18-years/" },
  { from: "/girls0to2LFA.html", to: "/growth-charts/girls-0-2-years/" },
  { from: "/girls2to5LFA.html", to: "/growth-charts/girls-2-5-years/" },
  { from: "/girls5to18HFA.html", to: "/growth-charts/girls-5-18-years/" },
  { from: "/girlsHeightForAge.html", to: "/growth-charts/" },
];

/**
 * Derived: one stub per migrated blog post and recipe, read straight from
 * the content directories. Generating these means a new post can never
 * ship without its legacy URL being handled, and the list can't drift out
 * of sync with what actually exists.
 */
function derive(dir, legacyDir, newBase) {
  const abs = path.join(process.cwd(), "src", dir);
  if (!fs.existsSync(abs)) return [];
  return fs
    .readdirSync(abs)
    .filter((f) => f.endsWith(".njk"))
    .map((f) => {
      const slug = f.replace(/\.njk$/, "");
      return { from: `/${legacyDir}/${slug}.html`, to: `${newBase}/${slug}/` };
    });
}

export default [
  ...manual,
  ...derive("blog", "blog-posts", "/blog"),
  ...derive("recipes", "recipies", "/recipes"),
];
