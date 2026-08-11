/**
 * Global site data. Content values are carried over verbatim from the
 * legacy nav.html / footer.html / index.html — no copy has been rewritten.
 *
 * ⚠️ CONTENT DISCREPANCY CARRIED FORWARD (needs a decision from Soumya,
 * NOT something this migration should silently pick a side on):
 *   The legacy footer displays "sanelysvasth@gmail.com" but its mailto:
 *   points at "info.svasth@gmail.com". Both values are preserved exactly
 *   as they were. See `contact.emailDisplay` vs `contact.emailHref`.
 */

export default {
  name: "Svasth by Soumya",
  tagline: "Rediscover Your Health",
  description:
    "Integrative health dietitian in Bengaluru — sports nutrition, gut health, metabolic and pediatric nutrition.",
  url: "https://sanelysvasth.com",
  locale: "en",

  /**
   * Brand assets are vector traces of the original artwork
   * (img/new_logo.png, img/font_new.png), generated once and committed.
   * They render identically but scale cleanly, stay sharp on high-DPI
   * screens, and weigh 55KB instead of 1.9MB.
   *
   * The wordmark is traced rather than set in a typeface because the
   * original is a dry-brush script with bristle texture: the font file is
   * not in the repo, and no webfont reproduces that texture. Tracing keeps
   * the exact letterforms instead of approximating them.
   */
  brand: {
    logo: "/assets/brand/logo-mark.svg",
    logoWidth: 594,
    logoHeight: 521,
    wordmark: "/assets/brand/wordmark.svg",
    wordmarkWidth: 1880,
    wordmarkHeight: 544,
    favicon: "/img/other4.png",
  },

  contact: {
    // Preserved exactly as authored — see discrepancy note above.
    emailDisplay: "sanelysvasth@gmail.com",
    emailHref: "info.svasth@gmail.com",
    phoneDisplay: "+91 98451 88112",
    phoneHref: "+919845188112",
    location: "Bengaluru, India",
    whatsapp: "https://wa.me/message/U43IYBJMJDQAD1",
  },

  footer: {
    blurb: "Fixing root causes, not symptoms.",
    copyright: "Copyright © 2024. All rights reserved.",
    strapline: "Svasth by Soumya - Dietitian in Bengaluru",
  },

  designer: {
    name: "Sumant Hipparagi",
    shortName: "H. Sumant",
    profession: "Software Engineer",
    email: "h.sumant.2000@gmail.com",
    phoneDisplay: "+91 80880 14580",
    phoneHref: "+918088014580",
    photo: "/img/Sumant.jpeg",
  },

  /**
   * Primary navigation — same eight destinations, same order, as legacy.
   *
   * MIGRATION STATE: entries still pointing at a `.html` path are pages
   * that have not been rebuilt yet and are served by the passthrough
   * bridge in eleventy.config.js. When one is migrated, change its `url`
   * here to the clean path AND add a redirect in legacyRedirects.js.
   * Until then these must stay as-is, or every rebuilt page ships a
   * broken nav link.
   */
  nav: [
    { text: "Home", url: "/" },
    { text: "Services", url: "/services/" },
    { text: "Assessment", url: "/questionnaire/" },
    { text: "Blogs", url: "/blogs/" },
    { text: "Recipes", url: "/recipes/" },
    { text: "Calculators", url: "/calculators/" },
    { text: "About", url: "/about/" },
    { text: "Contact", url: "/contact/" },
  ],

  footerLinks: [
    { text: "Home", url: "/" },
    { text: "About", url: "/about/" },
    { text: "Services", url: "/services/" },
    { text: "Blogs", url: "/blogs/" },
  ],

  /**
   * Calculator registry — categories match the legacy calculators.html
   * groupings exactly. Drives both the hub page and the nav sub-menu,
   * so a new calculator is registered in one place only.
   */
  calculatorGroups: [
    {
      title: "Workout",
      items: [
        { text: "Jump Rope Calories", url: "/calculators/jump-rope/" },
        { text: "Burpee Calories", url: "/calculators/burpees/" },
      ],
    },
    {
      title: "Body Measurements",
      items: [
        { text: "BMI Calculator", url: "/calculators/bmi/" },
        { text: "Ideal Body Weight", url: "/calculators/ideal-body-weight/" },
        { text: "Waist to Hip Ratio", url: "/calculators/waist-to-hip/" },
        { text: "Waist to Height Ratio", url: "/calculators/waist-to-height/" },
      ],
    },
    {
      title: "Nutrition & Metabolism",
      items: [
        { text: "BMR Calculator", url: "/calculators/bmr/" },
        { text: "Protein Intake", url: "/calculators/protein/" },
        { text: "Water Intake", url: "/calculators/water/" },
      ],
    },
    {
      title: "Paediatric",
      items: [
        { text: "Growth Charts (Boys & Girls)", url: "/growth-charts/" },
      ],
    },
    {
      title: "Clinical",
      items: [
        { text: "HOMA-IR & QUICKI", url: "/calculators/homa-ir/" },
        { text: "Diabetic Ketoacidosis", url: "/calculators/dka/" },
      ],
    },
  ],
};
