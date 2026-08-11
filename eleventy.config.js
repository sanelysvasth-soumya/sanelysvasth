import fs from "node:fs";
import path from "node:path";

/**
 * Eleventy configuration for Svasth by Soumya.
 *
 * Output is plain static HTML — the same deployment model as before.
 * No client-side framework, no hydration. Eleventy exists only to remove
 * the duplication (nav/footer/page shell were previously copy-pasted
 * across 50+ files) and to give calculators one shared template.
 */

/** CSS partials, concatenated in cascade order into one main.css. */
const CSS_PARTIALS = [
  "01-tokens.css",
  "02-base.css",
  "03-layout.css",
  "04-components.css",
  "05-content.css",
  "06-pages.css",
  "07-growth.css",
  "08-chrome.css",
  "09-surfaces.css",
];

export default function (eleventyConfig) {
  /* ---------------- passthrough assets ---------------- */
  eleventyConfig.addPassthroughCopy({ img: "img" });
  eleventyConfig.addPassthroughCopy({ fonts: "fonts" });
  eleventyConfig.addPassthroughCopy("src/assets/js");
  eleventyConfig.addPassthroughCopy("src/assets/brand");
  eleventyConfig.addPassthroughCopy({ CNAME: "CNAME" });

  /* ---------------- MIGRATION COMPLETE ----------------
     The strangler-fig bridge that carried un-migrated legacy pages
     through the build has been removed — every page is now rebuilt from
     src/. With it went the whole legacy dependency surface: jQuery 1.11,
     Bootstrap 3 CSS, Font Awesome 4, Chart.js and Highcharts.

     Legacy URLs are still served: src/_data/legacyRedirects.js generates
     a redirect stub for every one of them. */

  /* ---------------- watch targets ---------------- */
  eleventyConfig.addWatchTarget("./src/assets/css/");
  eleventyConfig.addWatchTarget("./src/assets/js/");

  /* ---------------- CSS bundle ----------------
     Concatenated at build time so the browser makes one request
     while the source stays split into maintainable partials. */
  eleventyConfig.on("eleventy.after", async ({ dir }) => {
    const srcDir = path.join("src", "assets", "css");
    const banner =
      "/* Svasth design system — generated bundle. Edit the partials in src/assets/css/, not this file. */\n";
    const css = CSS_PARTIALS.map((f) =>
      fs.readFileSync(path.join(srcDir, f), "utf8")
    ).join("\n");
    const outDir = path.join(dir.output, "assets", "css");
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, "main.css"), banner + css);
  });

  /* ---------------- filters ---------------- */
  eleventyConfig.addFilter("readableDate", (value) => {
    if (!value) return "";
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
  });

  eleventyConfig.addFilter("isoDate", (value) => {
    if (!value) return "";
    const d = value instanceof Date ? value : new Date(value);
    return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
  });

  /** Strip HTML and clamp — used for meta descriptions. */
  eleventyConfig.addFilter("excerpt", (content, length = 155) => {
    if (!content) return "";
    const text = String(content)
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return text.length <= length
      ? text
      : text.slice(0, text.lastIndexOf(" ", length)) + "…";
  });

  /* ---------------- collections ---------------- */
  eleventyConfig.addCollection("posts", (api) =>
    api
      .getFilteredByGlob("src/blog/*.njk")
      .sort((a, b) => (a.data.title > b.data.title ? 1 : -1))
  );
  eleventyConfig.addCollection("recipes", (api) =>
    api
      .getFilteredByGlob("src/recipes/*.njk")
      .sort((a, b) => (a.data.title > b.data.title ? 1 : -1))
  );

  /** Category facets for the blog hub filter, derived from post meta. */
  eleventyConfig.addFilter("categoryOf", (meta) => {
    if (!Array.isArray(meta)) return "";
    // post-meta reads [date, read time, category]
    return meta.find((m) => !/\d{4}|min read/.test(m)) ?? "";
  });

  eleventyConfig.addFilter("readTimeOf", (meta) =>
    Array.isArray(meta) ? (meta.find((m) => /min read/.test(m)) ?? "") : ""
  );

  eleventyConfig.addFilter("dateOf", (meta) =>
    Array.isArray(meta) ? (meta.find((m) => /\d{4}/.test(m)) ?? "") : ""
  );

  /** Unique, sorted list of values — used to build filter chips. */
  eleventyConfig.addFilter("unique", (arr) =>
    [...new Set((arr || []).filter(Boolean))].sort()
  );

  /**
   * Distinct categories across a post collection, for the hub filter.
   * Nunjucks has no `map` filter, so this does the projection server-side.
   */
  eleventyConfig.addFilter("categoriesIn", (posts) => {
    const cats = (posts || []).map((p) => {
      const meta = p.data?.meta;
      if (!Array.isArray(meta)) return "";
      return meta.find((m) => !/\d{4}|min read/.test(m)) ?? "";
    });
    return [...new Set(cats.filter(Boolean))].sort();
  });

  /** Object key list — Nunjucks has no equivalent built-in. */
  eleventyConfig.addFilter("keys", (o) => Object.keys(o || {}));

  /** Slugify for filter data attributes. */
  eleventyConfig.addFilter("slug", (s) =>
    String(s || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  );

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["njk", "md", "html"],
  };
}
