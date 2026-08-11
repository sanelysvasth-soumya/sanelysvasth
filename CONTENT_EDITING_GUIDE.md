# Content Editing Guide — Svasth by Soumya

**What this document is:** a map of where every piece of visible text, image and
style on www.sanelysvasth.in actually lives, so that changing wording never turns
into hunting through the codebase.

**Who it is for:** the site owner and any future developer making content
changes.

**Scope note:** this guide describes the project as it stands. It does not
propose changes. Every path below was verified against the current tree.

---

## 0. How the site is built (30-second version)

The site is a **static site built with [Eleventy](https://www.11ty.dev/) (11ty) v3**.
There is no React, no database, no CMS. Content is written directly into
`.njk` (Nunjucks) template files, and Eleventy turns them into plain HTML.

| Concept | Where |
|---|---|
| Source you edit | `src/` |
| Generated output (never edit) | `_site/` |
| Build configuration | `eleventy.config.js` |
| Global data (nav, contact, brand) | `src/_data/site.js` |
| Reusable page shells | `src/_includes/layouts/` |
| Reusable components | `src/_includes/components/` |
| Styles (9 partials → one bundle) | `src/assets/css/` |
| Browser JavaScript | `src/assets/js/` |
| Images | `img/` (project root, not `src/`) |

### Commands

Preview the site locally with live reload:

```bash
npm start
```

Build the production site into `_site/`:

```bash
npm run build
```

Run the regression tests that protect calculator and assessment results:

```bash
npm test
```

Build *and* test in one go — use this before publishing:

```bash
npm run check
```

### The two most important rules

1. **Never edit anything inside `_site/`.** It is regenerated from scratch on
   every build and your changes will vanish.
2. **Never edit `_site/assets/css/main.css`.** It is a concatenation of the nine
   partials in `src/assets/css/`, produced at build time. Edit the partials.

### Anatomy of a page file

Every page is one `.njk` file with two parts:

```
---
layout: layouts/base.njk          ← which shell wraps this page
permalink: /about/                ← the public URL
title: About                      ← <title> tag + page heading
description: ...                  ← Google/social preview text
eyebrow: "Who we are"             ← small label above the H1
lede: "Helping you achieve..."    ← standfirst line under the H1
---                               ← everything above is FRONT MATTER (data)

<section>...</section>            ← everything below is PAGE BODY (markup)
```

Front matter is YAML. The body is HTML with optional Nunjucks tags
(`{{ ... }}`, `{% ... %}`). **Most wording changes are either front matter or
plain text inside the body — both are safe.**

---

## 1. Full page inventory

### Global shell — applies to every page

| Item | File |
|---|---|
| HTML shell, `<head>`, meta tags, script loading | `src/_includes/layouts/base.njk` |
| Site header + navigation + theme toggle + mobile drawer | `src/_includes/components/header.njk` |
| Site footer + designer dialog + image lightbox | `src/_includes/components/footer.njk` |
| Page banner (title / eyebrow / lede / breadcrumbs) | `src/_includes/components/page-header.njk` |
| Global site data (nav, contact, brand, calculator registry) | `src/_data/site.js` |
| Site-wide JavaScript | `src/assets/js/theme.js`, `src/assets/js/site.js` |
| Stylesheet bundle | `src/assets/css/01-tokens.css` … `09-surfaces.css` |

---

### Core pages

#### Home

- **URL:** `/`
- **Main file:** `src/index.njk`
- **Layout:** `src/_includes/layouts/base.njk`
- **Nunjucks:** yes
- **Generated from a shared template:** no — hand-written, one of a kind
- **Page-specific scripts:** none beyond the global `site.js`
  (the "Read More" button uses the global `[data-disclosure]` handler in
  `src/assets/js/site.js`)
- **Page-specific CSS:** `src/assets/css/08-chrome.css` (`.page-head--hero`),
  `src/assets/css/04-components.css` (`.card--feature`)
- **Content source:** all copy is inline in `src/index.njk`
- **Notable:** opts out of the shared page header (`pageHeader: false`) and
  composes its own hero. Hero background image: `/img/soumya_adidas.jpeg`
  (set on line 14 as an inline `--head-media` custom property).
  About-preview photo: `/img/about.jpg`.

#### About

- **URL:** `/about/`
- **Main file:** `src/about.njk`
- **Layout:** `src/_includes/layouts/base.njk`
- **Nunjucks:** yes
- **Generated from a shared template:** no
- **Page-specific scripts:** none
- **Page-specific CSS:** `src/assets/css/06-pages.css` → `ABOUT` section
  (`.lede-statement`, `.credential-list`, `.credential`)
- **Content source:** inline in `src/about.njk`
- **Images used:** `/img/soumya_adidas_2.jpeg` (founder photo)

#### Contact

- **URL:** `/contact/`
- **Main file:** `src/contact.njk`
- **Layout:** `src/_includes/layouts/base.njk`
- **Nunjucks:** yes
- **Page-specific scripts:** `src/assets/js/contact.js` (declared as
  `pageScripts: ["contact"]`), which imports `src/assets/js/phone.js`
- **Page-specific CSS:** `src/assets/css/06-pages.css` → `CONTACT` section
  (`.contact-channels`, `.contact-channel`)
- **Content source:** page copy inline in `src/contact.njk`; **the actual
  phone number, email address, location and WhatsApp link come from
  `src/_data/site.js` → `contact`**
- **Components used:** `src/_includes/components/icon.njk`
- **Dependency:** the form posts to a Google Apps Script endpoint hard-coded in
  `src/assets/js/contact.js`. See §12 for why that transport must not be
  "modernised".

---

### Services

#### Services

- **URL:** `/services/`
- **Main file:** `src/services.njk`
- **Layout:** `src/_includes/layouts/base.njk`
- **Nunjucks:** yes
- **Page-specific scripts:** `src/assets/js/services.js`
  (`pageScripts: ["services"]`) — accessible tab behaviour only, no content
- **Page-specific CSS:** `src/assets/css/06-pages.css` → `SERVICES`,
  and `src/assets/css/09-surfaces.css` → `SERVICE EXPLORER`
- **Content source:** **the four services live in the `services:` array in the
  front matter of `src/services.njk`**, not in the body. The body loops over
  that array to build the tabs.
- **Individual service pages:** none. All four services are tab panels on the
  one page. There are no `/services/sports/` style URLs.

---

### Assessment

#### Assessment hub

- **URL:** `/questionnaire/`
- **Main file:** `src/questionnaire/index.njk`
- **Layout:** `src/_includes/layouts/base.njk`
- **Page-specific scripts:** none
- **Content source:** inline — two cards linking to the two assessments

#### Gut Health Assessment

- **URL:** `/questionnaire/gut/`
- **Main file:** `src/questionnaire/gut.njk`
- **Layout:** `src/_includes/layouts/base.njk`
- **Component:** `src/_includes/components/quiz.njk` (shared quiz shell)
- **Page-specific scripts:** `src/assets/js/questionnaires/gut.js`
  (`pageScripts: ["questionnaires/gut"]`)
- **Question content + scoring:** `src/assets/js/questionnaires/gut-engine.js`
  ⚠️ questions and scores live in the same file — see §13
- **Shared flow controller:** `src/assets/js/questionnaires/quiz-ui.js`
- **Page-specific CSS:** `src/assets/css/06-pages.css` → `QUESTIONNAIRE`
- **Intro text:** `quizIntro:` in the front matter of `src/questionnaire/gut.njk`

#### PCOS Root Cause Analysis

- **URL:** `/questionnaire/pcos/`
- **Main file:** `src/questionnaire/pcos.njk`
- **Layout:** `src/_includes/layouts/base.njk`
- **Component:** `src/_includes/components/quiz.njk`
- **Page-specific scripts:** `src/assets/js/questionnaires/pcos.js`
- **Question content (data):** `src/_data/pcos.json` ✅ questions are separated
  from scoring here
- **Scoring engine:** `src/assets/js/questionnaires/pcos-engine.js`
- **Intro text:** `quizIntro:` in the front matter of `src/questionnaire/pcos.njk`

---

### Calculators

#### Calculator hub

- **URL:** `/calculators/`
- **Main file:** `src/calculators/index.njk`
- **Layout:** `src/_includes/layouts/base.njk`
- **Content source:** **the calculator list is not in this file** — it loops
  over `calculatorGroups` in `src/_data/site.js`. The same array also drives
  the mobile navigation drawer.
- **Page-specific CSS:** `src/assets/css/09-surfaces.css` → `CALCULATOR / TOOL CARDS`

#### The eleven calculators

All eleven share one layout: `src/_includes/layouts/calculator.njk`.
Each page file carries its own title, lede, form fields, labels, hints and
explanatory prose in front matter + body; **the arithmetic is in a separate
file** (see §12).

| Calculator | URL | Page file (content) | Wiring module | Formula |
|---|---|---|---|---|
| BMI Calculator | `/calculators/bmi/` | `src/calculators/bmi.njk` | `src/assets/js/calculators/pages/bmi.js` | `src/assets/js/calculators/engines.js` |
| BMR Calculator | `/calculators/bmr/` | `src/calculators/bmr.njk` | `src/assets/js/calculators/pages/bmr.js` | `src/assets/js/calculators/engines.js` |
| Protein Intake | `/calculators/protein/` | `src/calculators/protein.njk` | `src/assets/js/calculators/pages/protein.js` | `src/assets/js/calculators/engines.js` |
| Water Intake | `/calculators/water/` | `src/calculators/water.njk` | `src/assets/js/calculators/pages/water.js` | `src/assets/js/calculators/engines.js` |
| Ideal Body Weight | `/calculators/ideal-body-weight/` | `src/calculators/ideal-body-weight.njk` | `src/assets/js/calculators/pages/ideal-body-weight.js` | `src/assets/js/calculators/engines.js` |
| Waist to Hip Ratio | `/calculators/waist-to-hip/` | `src/calculators/waist-to-hip.njk` | `src/assets/js/calculators/pages/waist-to-hip.js` | `src/assets/js/calculators/engines.js` |
| Waist to Height Ratio | `/calculators/waist-to-height/` | `src/calculators/waist-to-height.njk` | `src/assets/js/calculators/pages/waist-to-height.js` | `src/assets/js/calculators/engines.js` |
| HOMA-IR & QUICKI | `/calculators/homa-ir/` | `src/calculators/homa-ir.njk` | `src/assets/js/calculators/pages/homa-ir.js` | `src/assets/js/calculators/engines.js` |
| Diabetic Ketoacidosis | `/calculators/dka/` | `src/calculators/dka.njk` | `src/assets/js/calculators/pages/dka.js` | `src/assets/js/calculators/engines.js` |
| Jump Rope Calories | `/calculators/jump-rope/` | `src/calculators/jump-rope.njk` | `src/assets/js/calculators/pages/jump-rope.js` | `src/assets/js/calculators/engines.js` |
| Burpee Calories | `/calculators/burpees/` | `src/calculators/burpees.njk` | `src/assets/js/calculators/pages/burpees.js` | `src/assets/js/calculators/engines.js` |

Shared calculator plumbing: `src/assets/js/calculators/calculator-ui.js`
(DOM, validation messaging, result rendering — no arithmetic).

---

### Growth charts (paediatric tools)

#### Growth chart hub

- **URL:** `/growth-charts/`
- **Main file:** `src/growth-charts/index.njk`
- **Layout:** `src/_includes/layouts/base.njk`
- **Content source:** card titles and age ranges come from
  `src/_data/growthCharts.json`

#### The six chart pages

All six share `src/_includes/layouts/growth.njk`. Each page file is
front-matter only — it names a `chartKey` and the layout pulls everything else
from the data file.

| Page | URL | File | `chartKey` |
|---|---|---|---|
| Boys Growth Chart (0-2 Years) | `/growth-charts/boys-0-2-years/` | `src/growth-charts/boys-0-2-years.njk` | `boys-0-2` |
| Boys Growth Chart (2-5 Years) | `/growth-charts/boys-2-5-years/` | `src/growth-charts/boys-2-5-years.njk` | `boys-2-5` |
| Boys Growth Chart (5-18 Years) | `/growth-charts/boys-5-18-years/` | `src/growth-charts/boys-5-18-years.njk` | `boys-5-18` |
| Girls Growth Chart (0-2 Years) | `/growth-charts/girls-0-2-years/` | `src/growth-charts/girls-0-2-years.njk` | `girls-0-2` |
| Girls Growth Chart (2-5 Years) | `/growth-charts/girls-2-5-years/` | `src/growth-charts/girls-2-5-years.njk` | `girls-2-5` |
| Girls Growth Chart (5-18 Years) | `/growth-charts/girls-5-18-years/` | `src/growth-charts/girls-5-18-years.njk` | `girls-5-18` |

- **Data:** `src/_data/growthCharts.json` (titles, axis labels, age ranges,
  percentile datasets, curve colours)
- **Scripts:** `src/assets/js/growth/growth-page.js` (UI),
  `src/assets/js/growth/growth-chart.js` (SVG drawing),
  `src/assets/js/growth/growth-engine.js` (percentile classification — logic)
- **CSS:** `src/assets/css/07-growth.css`

---

### Recipes

#### Recipe listing

- **URL:** `/recipes/`
- **Main file:** `src/recipes-index.njk`
- **Layout:** `src/_includes/layouts/base.njk`
- **Page-specific scripts:** `src/assets/js/content.js`
  (`pageScripts: ["content"]`) — powers the search box
- **Content source:** the grid is generated automatically from the `recipes`
  collection (every `.njk` file in `src/recipes/`), defined in
  `eleventy.config.js`. Adding a recipe file adds a card here — no edit needed.
- **CSS:** `src/assets/css/05-content.css` → `COLLECTION CONTROLS`

#### Individual recipes — 30 pages

- **URL pattern:** `/recipes/<slug>/`
- **Files:** `src/recipes/*.njk` (30 files, e.g. `src/recipes/dosa.njk`)
- **Layout:** `src/_includes/layouts/recipe.njk`
- **Nunjucks:** yes
- **Generated from a shared template:** yes — the layout builds the whole page
  from front matter; recipe files usually have an **empty body**
- **Page-specific scripts:** `src/assets/js/content.js` (declared once in the
  layout) — checklists and persisted cooking progress
- **CSS:** `src/assets/css/05-content.css` → `RECIPE`
- **Components used:** `src/_includes/components/page-header.njk`,
  `src/_includes/components/cta.njk`
- **Content source:** 100% front matter — `title`, `description`, `excerpt`,
  `image`, `metaItems`, `ingredients`, `instructions`
- **Images:** 29 of 30 recipes set an `image:` path into `/img/`; the one
  without falls back to the brand mark automatically

---

### Blogs

#### Blog listing

- **URL:** `/blogs/`
- **Main file:** `src/blogs.njk`
- **Layout:** `src/_includes/layouts/base.njk`
- **Page-specific scripts:** `src/assets/js/content.js` — search + category filter
- **Content source:** generated from the `posts` collection (every `.njk` file
  in `src/blog/`), defined in `eleventy.config.js`. Filter chips are derived
  automatically from each post's `meta` array.

#### Individual blog articles — 38 pages

- **URL pattern:** `/blog/<slug>/`
- **Files:** `src/blog/*.njk` (38 files, e.g. `src/blog/creatine.njk`)
- **Layout:** `src/_includes/layouts/post.njk`
- **Nunjucks:** yes
- **Page-specific scripts:** `src/assets/js/content.js` — reading progress bar
  and auto-generated table of contents
- **CSS:** `src/assets/css/05-content.css` → `ARTICLE`
- **Components used:** `src/_includes/components/page-header.njk`,
  `src/_includes/components/cta.njk`
- **Content source:** metadata in front matter (`title`, `description`,
  `excerpt`, `meta`); **the article text itself is raw HTML in the body of the
  same file**
- **The `meta` array is significant:** `["August 22, 2025", "10 min read", "Athlete Performance, Creatine, Sports Nutrition"]`.
  Eleventy filters (`dateOf`, `readTimeOf`, `categoryOf` in
  `eleventy.config.js`) pull date, read time and category out of it by pattern.
  A date must contain a 4-digit year; a read time must contain `min read`;
  whatever remains becomes the category shown on the filter chips.
- **Table of contents:** built client-side from your `<h2>`/`<h3>` headings.
  Never maintain it by hand.

---

### Other / utility pages

| Page | URL | File | Notes |
|---|---|---|---|
| 404 | `/404.html` | `src/404.njk` | Error page copy |
| Sitemap | `/sitemap.xml` | `src/sitemap.njk` | Auto-generated, no content to edit |
| Robots | `/robots.txt` | `src/robots.njk` | Crawler rules |
| Legacy redirects | many `.html` paths | `src/redirects.njk` + `src/_data/legacyRedirects.js` | One stub page per old URL |

**There are no legal, privacy or terms pages on this site at present.**

---

## 2. Where content comes from, by storage type

| Storage | Files | What lives there |
|---|---|---|
| **`.njk` front matter (YAML)** | every page file | titles, ledes, descriptions, services array, calculator fields/labels/hints, recipe ingredients & steps, blog metadata |
| **`.njk` body (HTML)** | `src/index.njk`, `src/about.njk`, `src/services.njk`, `src/contact.njk`, `src/questionnaire/index.njk`, `src/blog/*.njk`, `src/calculators/*.njk` | prose, section headings, card copy, article text |
| **`.js` data file** | `src/_data/site.js` | brand name, contact details, navigation, footer strings, calculator registry, designer profile |
| **`.json` data files** | `src/_data/pcos.json`, `src/_data/growthCharts.json` | PCOS questions & explanations; growth chart datasets and titles |
| **`.js` application code** | `src/assets/js/questionnaires/gut-engine.js` | gut assessment questions **and** their scores (mixed — see §13) |
| **Components** | `src/_includes/components/*.njk` | header, footer, page header, CTA, quiz shell, icons |
| **Layouts** | `src/_includes/layouts/*.njk` | page shells and repeated furniture |
| **Config** | `eleventy.config.js` | URL structure, collections, date/excerpt filters |

There is **no `.md`, `.ts`, `.yaml` or `.yml` content** in this project, and no
CMS. Everything above is the complete list of content sources.

---

## 3. Key content areas, with exact locations

### Homepage hero

**File:** `src/index.njk` (lines 13–26)

| What | Where |
|---|---|
| Eyebrow ("Svasth by Soumya") | line 16, `<p class="page-head__eyebrow">` |
| Main heading ("Rediscover Your Health") | line 17, `<h1 class="page-head__title">` |
| Description line | lines 18–20, `<p class="page-head__lede">` |
| Primary CTA ("Start Assessment") | line 22 |
| Secondary CTA ("Explore Services") | line 23 |
| Background photo | line 14, `--head-media: url('/img/soumya_adidas.jpeg')` |

### Homepage — remaining sections

| Section | Location in `src/index.njk` |
|---|---|
| "Expertise" heading + subtitle | lines 32–33 |
| Two expertise cards (Sports Nutrition, Gut Health Nutrition) | lines 37–55 |
| About-preview photo | line 65 (`/img/about.jpg`) |
| "Meet Soumya" bio, short intro | lines 71–85 |
| Bio continuation (hidden behind "Read More") | lines 87–116, `<div id="full-story">` |
| "Read More" / "Read Less" button labels | lines 123–124, `data-label-open` / `data-label-closed` |
| Closing CTA band ("See Where Your Health Stands") | lines 132–140 |

### About page

| Section | Location in `src/about.njk` |
|---|---|
| Page title / eyebrow / lede (the banner) | front matter, lines 6–8 |
| Mission pull-quote | line 16, `<p class="lede-statement">` |
| "Here's how we actually work:" + two paragraphs | lines 19–28 |
| Founder photo | line 38 (`/img/soumya_adidas_2.jpeg`) |
| Founder intro paragraph | lines 46–49 |
| Three credential cards | lines 51–76, `<article class="credential">` |
| Closing CTA band | lines 82–93 |

### Services page

| Section | Location in `src/services.njk` |
|---|---|
| Page eyebrow + lede | front matter, lines 40–41 |
| **The four services** (name, summary, 4 process steps each) | front matter `services:` array, lines 7–39 |
| Tab markup (loops over the array — don't edit to change copy) | body, lines 50–97 |
| "What a consultation includes" heading + subtitle | lines 107–108 |
| Three stat cards (duration, counselling split, specialisations) | lines 111–122 |
| Counselling paragraph | lines 124–128 |
| Closing CTA band | lines 132–140 |

### Contact page

| Section | Location |
|---|---|
| Page title / eyebrow / lede | `src/contact.njk` front matter |
| Channel labels ("WhatsApp", "Phone", "Email", "Location") | `src/contact.njk`, `<h2 class="contact-channel__label">` |
| **Actual phone / email / location / WhatsApp values** | `src/_data/site.js` → `contact` object |
| Form field labels and hints | `src/contact.njk`, `<label class="field__label">` |
| Form validation messages | `src/assets/js/contact.js` |

### Footer

**Component:** `src/_includes/components/footer.njk`
**Strings:** `src/_data/site.js`

| What | Where |
|---|---|
| Brand name "Svasth by Soumya" | `site.js` → `name` |
| Blurb "Fixing root causes, not symptoms." | `site.js` → `footer.blurb` |
| Column heading "Explore" | `footer.njk` line 22 (hard-coded) |
| Link list | `site.js` → `nav` (the `/` entry is skipped) |
| Column heading "Get in touch" | `footer.njk` line 32 (hard-coded) |
| Email / phone / location | `site.js` → `contact` |
| "Book a consultation" button | `footer.njk` line 39 |
| Copyright + strapline | `site.js` → `footer.copyright`, `footer.strapline` |
| "Designed by" credit and dialog | `site.js` → `designer` |

### Header / navigation

**Component:** `src/_includes/components/header.njk`

| What | Where |
|---|---|
| Logo + wordmark images | `src/_data/site.js` → `brand` |
| Navigation items and order | `src/_data/site.js` → `nav` |
| Theme toggle label ("Dark"/"Light") | `src/assets/js/theme.js` (swapped at runtime) |
| Mobile drawer calculator groups | `src/_data/site.js` → `calculatorGroups` |

---

## 4. Shared vs page-specific content

### ⚠️ GLOBAL — changes affect the entire website

| Component / file | Controls | Pages affected |
|---|---|---|
| `src/_data/site.js` | site name, tagline, contact details, nav, footer strings, brand assets, calculator registry, designer profile | **all** |
| `src/_includes/layouts/base.njk` | HTML shell, `<head>`, meta/SEO tags, font loading, script loading, theme pre-paint snippet | **all** |
| `src/_includes/components/header.njk` | header, primary nav, theme toggle, mobile drawer | **all** |
| `src/_includes/components/footer.njk` | footer, designer dialog, image lightbox | **all** |
| `src/assets/css/01-tokens.css` | every colour, font, size, spacing and radius token; both themes | **all** |
| `src/assets/css/02-base.css` | element defaults (`body`, `h1`–`h6`, `a`, `img`, `table`) | **all** |
| `src/assets/js/theme.js` | light/dark switching and persistence | **all** |
| `src/assets/js/site.js` | header scroll behaviour, mobile nav, modals, lightbox, scroll reveal, `Read More` disclosures | **all** |
| `eleventy.config.js` | URLs, collections, date/excerpt filters, CSS bundling | **all** |

### ⚠️ SHARED — changes affect multiple pages

| Component / file | Controls | Pages affected |
|---|---|---|
| `src/_includes/components/page-header.njk` | the banner (eyebrow, H1, lede, breadcrumbs, meta row) | every page except Home and 404 |
| `src/_includes/components/cta.njk` | "Ready to take the next step?" panel | all 38 blog posts + all 30 recipes |
| `src/_includes/components/quiz.njk` | quiz shell: start screen, progress bar, review, result | both assessments |
| `src/_includes/components/icon.njk` | inline SVG icon set | Contact page |
| `src/_includes/layouts/calculator.njk` | entire calculator page structure | all 11 calculators |
| `src/_includes/layouts/post.njk` | article structure, TOC, "More reading" | all 38 blog posts |
| `src/_includes/layouts/recipe.njk` | recipe structure, checklists, print view, schema | all 30 recipes |
| `src/_includes/layouts/growth.njk` | growth chart page structure | all 6 growth chart pages |
| `src/assets/js/content.js` | reading progress, TOC, checklists, collection search/filter | blogs hub, recipes hub, all posts, all recipes |
| `src/assets/js/phone.js` | phone validation rules | contact form + both assessments |
| `src/assets/js/calculators/calculator-ui.js` | form validation and result rendering | all 11 calculators |
| `src/assets/js/calculators/engines.js` | **every calculator formula** | all 11 calculators 🔴 |
| `src/assets/js/questionnaires/quiz-ui.js` | quiz flow controller | both assessments |
| `src/assets/css/03-layout.css` | grid and container primitives | all |
| `src/assets/css/04-components.css` | buttons, cards, forms, badges, alerts, calculator shell | all |
| `src/assets/css/05-content.css` | article, recipe, CTA panel, collection controls | blogs, recipes |
| `src/assets/css/09-surfaces.css` | tool cards, calculator panels, service tabs | calculators, growth charts, services |

### 📄 PAGE-SPECIFIC — changes affect only that page

| File | Page |
|---|---|
| `src/index.njk` | Home |
| `src/about.njk` | About |
| `src/contact.njk` | Contact |
| `src/services.njk` | Services |
| `src/questionnaire/index.njk` | Assessment hub |
| `src/calculators/index.njk` | Calculator hub |
| `src/growth-charts/index.njk` | Growth chart hub |
| `src/blogs.njk` | Blog listing |
| `src/recipes-index.njk` | Recipe listing |
| `src/blog/<name>.njk` | that one article |
| `src/recipes/<name>.njk` | that one recipe |
| `src/calculators/<name>.njk` | that one calculator's wording |
| `src/404.njk` | 404 page |

**Partially page-specific:** `src/assets/css/06-pages.css` and
`src/assets/css/07-growth.css` are single files, but each is internally divided
into `SERVICES` / `ABOUT` / `CONTACT` / `QUESTIONNAIRE` blocks. Editing inside
one block affects only that page family.

---

## 5. "Where do I edit this?" lookup table

| What I want to change | File to edit | Scope |
|---|---|---|
| Homepage hero heading | `src/index.njk` (line 17) | 📄 Page-specific |
| Homepage hero description | `src/index.njk` (lines 18–20) | 📄 Page-specific |
| Homepage hero background photo | `src/index.njk` (line 14) | 📄 Page-specific |
| Homepage expertise cards | `src/index.njk` (lines 37–55) | 📄 Page-specific |
| Homepage "Meet Soumya" bio | `src/index.njk` (lines 74–116) | 📄 Page-specific |
| About page mission statement | `src/about.njk` (line 16) | 📄 Page-specific |
| About page description / banner lede | `src/about.njk` front matter | 📄 Page-specific |
| About page founder photo | `src/about.njk` (line 38) | 📄 Page-specific |
| About page credential cards | `src/about.njk` (lines 51–76) | 📄 Page-specific |
| Service name or summary | `src/services.njk` front matter `services:` | 📄 Page-specific |
| Service process step names | `src/services.njk` front matter `steps:` | 📄 Page-specific |
| Consultation stat cards | `src/services.njk` (lines 111–122) | 📄 Page-specific |
| Calculator page title / lede | that calculator's `src/calculators/<name>.njk` front matter | 📄 Specific calculator |
| Calculator field labels, units, hints | same file, `fields:` in front matter | 📄 Specific calculator |
| Calculator explanation prose | same file, body below `---` | 📄 Specific calculator |
| Calculator disclaimer | same file, `disclaimer:` in front matter | 📄 Specific calculator |
| Calculator **result numbers** | `src/assets/js/calculators/engines.js` | 🔴 Business logic |
| Calculator name in the hub + mobile menu | `src/_data/site.js` → `calculatorGroups` | ⚠️ Global |
| Recipe title / description | `src/recipes/<name>.njk` front matter | 📄 Specific recipe |
| Recipe ingredients / steps | `src/recipes/<name>.njk` front matter | 📄 Specific recipe |
| Recipe photo | `src/recipes/<name>.njk` → `image:` | 📄 Specific recipe |
| Recipe prep/cook time, servings | `src/recipes/<name>.njk` → `metaItems:` | 📄 Specific recipe |
| Blog title | `src/blog/<name>.njk` → `title:` | 📄 Specific blog |
| Blog summary shown on cards | `src/blog/<name>.njk` → `excerpt:` | 📄 Specific blog |
| Blog date / read time / category | `src/blog/<name>.njk` → `meta:` | 📄 Specific blog |
| Blog article text | `src/blog/<name>.njk` body | 📄 Specific blog |
| Assessment card copy on the hub | `src/questionnaire/index.njk` | 📄 Page-specific |
| Assessment intro text | `quizIntro:` in `src/questionnaire/gut.njk` or `pcos.njk` | 📄 Specific assessment |
| Gut assessment question wording | `src/assets/js/questionnaires/gut-engine.js` | 🔴 Content mixed with logic |
| PCOS assessment question wording | `src/_data/pcos.json` | 🟠 Content data |
| Quiz buttons ("Next", "Back", "See my result") | `src/_includes/components/quiz.njk` | ⚠️ Shared (both assessments) |
| Footer wording | `src/_data/site.js` → `footer` | ⚠️ Global |
| Footer column headings ("Explore", "Get in touch") | `src/_includes/components/footer.njk` | ⚠️ Global |
| Footer layout | `src/_includes/components/footer.njk` | ⚠️ Global |
| Header / navigation item | `src/_data/site.js` → `nav` | ⚠️ Global |
| Logo or wordmark | `src/_data/site.js` → `brand` | ⚠️ Global |
| Phone number / email / location | `src/_data/site.js` → `contact` | ⚠️ Global |
| WhatsApp booking link | `src/_data/site.js` → `contact.whatsapp` | ⚠️ Global |
| Page banner structure (all pages) | `src/_includes/components/page-header.njk` | ⚠️ Shared |
| Page banner text (one page) | that page's `title` / `eyebrow` / `lede` front matter | 📄 Page-specific |
| Shared CTA panel on blogs + recipes | `src/_includes/components/cta.njk` | ⚠️ Shared |
| Theme switcher markup | `src/_includes/components/header.njk` (lines 32–46) | ⚠️ Global |
| Theme switcher behaviour | `src/assets/js/theme.js` | ⚠️ Global |
| A global colour | `src/assets/css/01-tokens.css` | ⚠️ Global |
| Dark mode colours | `src/assets/css/01-tokens.css` → `[data-theme="dark"]` | ⚠️ Global |
| Fonts / type scale | `src/assets/css/01-tokens.css` (families) + `base.njk` (loading) | ⚠️ Global |
| Button styling | `src/assets/css/04-components.css` → `BUTTONS` | ⚠️ Global |
| Card styling | `src/assets/css/04-components.css` → `CARD` | ⚠️ Global |
| SEO description for any page | that page's `description:` front matter | 📄 Page-specific |
| 404 page copy | `src/404.njk` | 📄 Page-specific |

---

## 6. How to change wording

The rule of thumb: **look in the page's front matter first, then its body, then
`src/_data/site.js`.**

### Page titles

- **Browser tab / search result title:** `title:` in the page's front matter.
  `src/_includes/layouts/base.njk` renders it as `<title>{{ title }} | Svasth by Soumya</title>`.
- **The visible H1 on the page:** also `title:`, unless the page sets
  `pageTitle:` — which overrides the visible heading while leaving the tab
  title alone. `src/about.njk` does this: `title: About` (tab) but
  `pageTitle: "About Us"` (heading).

### Headings

- **Page H1:** front matter `title:` / `pageTitle:`.
- **Section headings (H2/H3) in the body:** edit the text between the tags
  directly in the `.njk` file. Leave the `class="..."` attributes alone.
- **The small label above the H1:** front matter `eyebrow:`.

### Subheadings and standfirsts

- **The line under the H1:** front matter `lede:`.
- **Section subtitles:** `<p class="section-subtitle">` in the page body.

### Descriptions (SEO)

`description:` in front matter. This is what Google and social previews show.
It is deliberately kept separate from `lede:` — changing one does not change
the other. If a page has no `description`, `base.njk` falls back to
`site.description` in `src/_data/site.js`.

### Paragraphs

Plain text inside `<p>` tags in the page body. Safe to edit freely.

### Buttons and CTAs

| Button | File |
|---|---|
| Homepage hero CTAs | `src/index.njk` lines 22–23 |
| "Read More" / "Read Less" | `src/index.njk` lines 123–124 (`data-label-open`, `data-label-closed`) |
| "Book a consultation" (footer) | `src/_includes/components/footer.njk` line 39 |
| "Book a consultation" (blogs/recipes CTA) | `src/_includes/components/cta.njk` line 12 |
| "Book a consultation" (services tabs) | `src/services.njk` line 92 |
| Calculator submit button | `submitLabel:` in that calculator's front matter |
| Calculator reset button | `src/_includes/layouts/calculator.njk` line 81 — ⚠️ affects all 11 |
| Quiz navigation buttons | `src/_includes/components/quiz.njk` — ⚠️ affects both assessments |
| Recipe "Clear progress" / "Print recipe" | `src/_includes/layouts/recipe.njk` — ⚠️ affects all 30 recipes |

### Labels

- **Calculator input labels:** `fields:` → `label:` in the calculator's front matter.
- **Calculator input hints:** `fields:` → `hint:`.
- **Calculator units:** `fields:` → `unit:` — ⚠️ this is a *label*, but see §12:
  changing "cm" to "inches" changes what the formula receives without changing
  the formula.
- **Contact form labels:** `src/contact.njk`.
- **Form validation messages:** `requiredMessage:` in calculator front matter,
  or `src/assets/js/contact.js` for the contact form.

### Navigation text

`src/_data/site.js` → `nav` array. Change `text:` to rename a link, `url:` to
repoint it. ⚠️ Global — appears in the desktop header, the mobile drawer, and
the footer's "Explore" column.

### Footer text

`src/_data/site.js` → `footer` object (blurb, copyright, strapline) and
`contact` object. The two column headings are hard-coded in
`src/_includes/components/footer.njk`.

### Service descriptions

`src/services.njk` front matter, `services:` array. Each entry has `id`, `name`,
`summary` and a `steps:` list. **Never edit the tab markup in the body to change
copy** — it loops over this array.

### Recipe descriptions

`src/recipes/<name>.njk` front matter. Note that `description:` (SEO) and
`excerpt:` (shown on the recipe card and as the page lede) are usually
identical — **update both** or the card and the search result will disagree.

### Blog titles and descriptions

`src/blog/<name>.njk` front matter: `title:`, `description:` (SEO),
`excerpt:` (card text and page lede). Again, keep `description` and `excerpt`
in step.

### Calculator descriptions

- Short line under the heading: `lede:` in front matter.
- Long explanation: the body below `---`, rendered into the "About this
  calculator" panel. Its heading comes from `infoTitle:`.
- Disclaimer box: `disclaimer:` in front matter.

### Assessment text

- **Intro shown before starting:** `quizIntro:` in the assessment's front matter.
- **Flow labels** ("Before we begin", "Review your answers", "Next", "Back"):
  `src/_includes/components/quiz.njk` — ⚠️ shared by both assessments.
- **Question wording:** see §13 — this differs between the two assessments.

---

## 7. How to add new content

### Homepage

**Add a new section** — open `src/index.njk` and copy the shape of an existing
section:

```html
<section class="section">
  <div class="container">
    <div class="section-header" data-reveal>
      <h2 class="section-title">Your heading</h2>
      <p class="section-subtitle">Your subtitle</p>
    </div>
    <!-- your content -->
  </div>
</section>
```

Add `class="section section--sunken"` for a tinted background, or
`section--dark` for the dark CTA treatment. `data-reveal` opts the block into
the fade-in animation handled by `src/assets/js/site.js`.

**Add a new card** — copy an existing `<article class="card card--interactive card--feature">`
block (lines 37–45) into the same `grid` container. To go from two cards to
three, change `grid--2` to `grid--3` on the wrapper.

**Change existing section wording** — edit the text in place; no other file is
involved.

### Services

**Add a new service** — add an entry to the `services:` array in the front
matter of `src/services.njk`:

```yaml
  - id: yourslug
    name: Your Service Name
    summary: One-sentence description of the service.
    steps:
      - title: First Step
      - title: Second Step
      - title: Third Step
      - title: Fourth Step
```

The tab, the panel, the process list and the CTAs are generated automatically.
`id` must be unique — it becomes the HTML `id` on the tab and panel.

**Modify an existing service** — edit `name`, `summary` or `steps` in that same
array. Do not touch the body markup.

**Note:** the four process steps carry only a `title`. The layout supports a
description slot (`src/services.njk` lines 83–85) but no service currently uses
it.

### Recipes

**Add a new recipe** — create `src/recipes/yourRecipe.njk`. The whole page is
front matter; leave the body empty:

```yaml
---
layout: layouts/recipe.njk
permalink: /recipes/your-recipe/
title: "Your Recipe Name"
description: "One-line description for search engines."
excerpt: "One-line description shown on the recipe card."
image: "/img/yourRecipe.jpg"
metaItems:
  - label: "Prep Time"
    value: "15 mins"
  - label: "Cook Time"
    value: "20 mins"
  - label: "Servings"
    value: "4"
ingredients:
  - "Ingredient one - 1 cup"
  - "Ingredient two - 2 tbsp"
instructions:
  - "First step."
  - "Second step."
---
```

The card on `/recipes/`, the checklists, the print view, the breadcrumbs and the
Recipe structured data are all generated. `image:` is optional — without it the
card falls back to the brand mark.

**Modify recipe details** — edit that file's front matter.

**Add recipe content** — add entries to the `ingredients:` or `instructions:`
lists. Order is preserved, and step numbers are generated.

### Blogs

**Add a new blog** — create `src/blog/your-slug.njk`:

```yaml
---
layout: layouts/post.njk
permalink: /blog/your-slug/
title: "Your Article Title"
description: "One-line summary for search engines."
excerpt: "One-line summary shown on the blog card."
meta: ["9 August 2026", "7 min read", "Gut Health"]
---
<p>Your first paragraph.</p>

<h2 id="section-one">A section heading</h2>
<p>More text.</p>
```

**The `meta` array matters.** The three values are pulled apart by pattern, not
by position: the entry containing a 4-digit year becomes the date, the entry
containing `min read` becomes the read time, and whatever is left becomes the
category. The category automatically becomes a filter chip on `/blogs/`. Reuse
an existing category string to file the post under an existing chip.

**Modify an existing blog** — edit its front matter (metadata) or its body
(article text).

**Add article sections/headings** — use `<h2 id="unique-id">` and
`<h3>` in the body. The sticky table of contents is generated from these by
`src/assets/js/content.js`; never write one by hand.

### Calculators

> **Read §12 before touching anything calculator-related.**

**Change calculator title/description/UI text** — everything user-visible is in
that calculator's own `.njk` file:

```yaml
title: BMI Calculator            # heading + tab title
lede: Calculate your Body...     # line under the heading
formTitle: Calculate BMI         # heading of the input panel
submitLabel: Calculate BMI       # submit button
infoTitle: About BMI             # heading of the explanation panel
disclaimer: BMI is a screening...# the info box at the bottom
fields:
  - name: height
    label: Height                # ← wording
    unit: cm                     # ← wording, but see the warning below
    hint: ...                    # ← wording
    placeholder: "170"           # ← wording
    requiredMessage: ...         # ← wording
```

Body text below `---` becomes the "About this calculator" panel.

**Add a new calculator** — this is a four-file job:

1. Add the formula to `src/assets/js/calculators/engines.js` as a pure function.
2. Add a regression test to `test/calculators.baseline.test.js`.
3. Create `src/assets/js/calculators/pages/your-calc.js` following the shape of
   `bmi.js` — it imports the engine function and describes how to render the
   result.
4. Create `src/calculators/your-calc.njk` with
   `layout: layouts/calculator.njk`, a unique `formId`, `resultId`, and
   `scriptModule: your-calc` (this must match the filename in step 3).
5. Register it in `src/_data/site.js` → `calculatorGroups` so it appears on the
   hub page and in the mobile menu.

### Assessment

See §13 for the full picture. In short:

| Task | Gut assessment | PCOS assessment |
|---|---|---|
| Change question wording | `src/assets/js/questionnaires/gut-engine.js` → `QUESTIONS` | `src/_data/pcos.json` → `questions` |
| Add a question | same file — **give it a new `id`, never reuse one** | same file — new `id`, plus a `group` |
| Remove a question | same file — delete the entry, **leave its `id` retired** | same file — same rule |
| Change answer options | `FREQUENCY_SCALE` in `gut-engine.js` 🔴 | `FREQUENCY` in `src/assets/js/questionnaires/pcos.js`, or `binaryQuestions` in `pcos.json` 🔴 |
| Change intro description | `quizIntro:` in `src/questionnaire/gut.njk` | `quizIntro:` in `src/questionnaire/pcos.njk` |
| Change hub card copy | `src/questionnaire/index.njk` | `src/questionnaire/index.njk` |

⚠️ **Adding or removing a question changes the score.** Both assessments score
as a proportion of a maximum derived from the question count, so the bands shift
for everyone. The tests in `test/questionnaire.baseline.test.js` and
`test/pcos.baseline.test.js` will fail — that failure is the guard working, not
a bug to silence.

### New page

1. Create a `.njk` file in `src/`. Its location on disk does not determine its
   URL — `permalink:` does.
2. Give it front matter:

```yaml
---
layout: layouts/base.njk
permalink: /your-page/
title: Your Page
description: One-line summary for search engines.
eyebrow: "Small label"
lede: "The line under the heading."
---
```

3. Write the body in HTML.
4. If it needs a page-specific script, add `pageScripts: ["yourscript"]` and
   create `src/assets/js/yourscript.js`.
5. To put it in the navigation, add an entry to `nav` in `src/_data/site.js`.
6. Run `npm run build`. It appears in `sitemap.xml` automatically.

---

## 8. Content data structures

| Data | File | Structure | Used by | If you change it |
|---|---|---|---|---|
| Site identity, contact, nav, footer | `src/_data/site.js` | ES module default-exporting one object | header, footer, base layout, contact page, calculator hub | ⚠️ affects every page — a typo in `nav` breaks navigation site-wide |
| Calculator registry | `src/_data/site.js` → `calculatorGroups` | array of `{ title, items: [{ text, url }] }` | `src/calculators/index.njk`, mobile drawer in `header.njk` | renames a calculator on the hub and in the menu, but **not** on its own page (that's `title:` in the page file) |
| PCOS questions | `src/_data/pcos.json` | `{ sheetName, groups[], questions[], binaryQuestions{}, ... }` | `src/assets/js/questionnaires/pcos-engine.js` via a `window.__PCOS__` injection in `src/questionnaire/pcos.njk` | wording is safe; adding/removing questions or changing `group` changes results 🔴 |
| Gut questions | `src/assets/js/questionnaires/gut-engine.js` → `QUESTIONS` | frozen array of `{ id, text }`, one with a custom scale | `src/assets/js/questionnaires/gut.js` | wording is safe; ids and count are not 🔴 |
| Growth chart datasets | `src/_data/growthCharts.json` | keyed by chart (`boys-0-2` …), each with titles, axis labels, age range, percentile bands, colours | `src/_includes/layouts/growth.njk`, `src/assets/js/growth/growth-engine.js` | titles/labels are safe; percentile arrays are clinical reference data 🔴 |
| Legacy redirects | `src/_data/legacyRedirects.js` | array of `{ from, to }` | `src/redirects.njk` | removing an entry breaks an old bookmarked URL |
| Blog collection | derived — no file | built from `src/blog/*.njk` by `eleventy.config.js` | `/blogs/`, "More reading" on articles | add a file, get a card |
| Recipe collection | derived — no file | built from `src/recipes/*.njk` by `eleventy.config.js` | `/recipes/` | add a file, get a card |

**There is no separate services data file** — the services live in the front
matter of `src/services.njk` itself.

---

## 9. Images and assets

### Where things live

| Asset type | Location | Notes |
|---|---|---|
| **All photographs** | `img/` (project root, **not** `src/`) | copied to `/img/` at build time by `eleventy.config.js` |
| Brand SVGs | `src/assets/brand/` | `logo-mark.svg`, `wordmark.svg`, `sanely-svasth.svg` |
| Fonts (webfonts) | Google Fonts CDN | Montserrat + Lato, loaded in `src/_includes/layouts/base.njk` |
| Fonts (local folder) | `fonts/` | Bootstrap 3 Glyphicons — **leftover from the retired legacy site, not used by any current page** |
| Icons | `src/_includes/components/icon.njk` | inline SVG: `chat`, `phone`, `envelope`, `pin` |

### Key images and where they are referenced

| Image | Used by | Referenced in |
|---|---|---|
| `/assets/brand/logo-mark.svg` | header emblem, recipe card placeholder, watermark | `src/_data/site.js` → `brand.logo`; `--brand-mark` in `01-tokens.css` |
| `/assets/brand/wordmark.svg` | header wordmark | `src/_data/site.js` → `brand.wordmark` |
| `/img/other4.png` | favicon | `src/_data/site.js` → `brand.favicon` |
| `/img/soumya_adidas.jpeg` | homepage hero background | `src/index.njk` line 14 |
| `/img/about.jpg` | homepage About-preview photo | `src/index.njk` line 65 |
| `/img/soumya_adidas_2.jpeg` | About page founder photo | `src/about.njk` line 38 |
| `/img/Sumant.jpeg` | designer dialog in the footer | `src/_data/site.js` → `designer.photo` |
| 29 recipe photos in `/img/` | recipe cards and recipe page headers | `image:` in each `src/recipes/*.njk` |

**Blog posts do not currently use hero images.** The layout supports one — add
`image: "/img/yourimage.jpg"` to a post's front matter and
`src/_includes/layouts/post.njk` will render it as a 16:9 hero.

**Service images:** none. The services page is typographic.

### How to replace an image safely

1. Put the new file in `img/`. **Prefer a new filename over overwriting** — the
   old file may be referenced somewhere you have not checked.
2. Find every reference before switching:

```bash
grep -rn "old-image-name" src/
```

3. Update the path in each place the grep found.
4. If the `<img>` tag carries `width` and `height` attributes, update them to
   the new image's true pixel dimensions. These reserve the correct space
   before the image loads; wrong values cause the page to jump. Check with:

```bash
sips -g pixelWidth -g pixelHeight img/your-new-image.jpg
```

5. Aim for roughly 2× the displayed size so it stays sharp on retina screens,
   and keep the file under ~300 KB.
6. Run `npm run build` and check the page.

**Global vs page-specific assets:**

- ⚠️ **Global:** `logo-mark.svg`, `wordmark.svg`, the favicon, `Sumant.jpeg` —
  all referenced from `src/_data/site.js` and appearing on every page.
- 📄 **Page-specific:** every photograph in `img/` used by exactly one page —
  recipe photos, `soumya_adidas.jpeg`, `about.jpg`, `soumya_adidas_2.jpeg`.

**Unused legacy images:** `img/` contains files from the pre-rebuild site
(`1.jpg`–`13.png`, `faq*.png`, `grass*.jpg`, `logo.png`, `new_logo.png`,
`font*.png`, `me.jpg`, `ss.png`, and the `img/clients/` folder). They are copied
into the build but not referenced by any page. Leave them alone unless you have
grepped to confirm.

---

## 10. Design and styling guide

### The nine CSS partials

They are concatenated **in this order** into `_site/assets/css/main.css` by
`eleventy.config.js`. Order is the cascade — later files override earlier ones.

| File | Contains |
|---|---|
| `src/assets/css/01-tokens.css` | **all design tokens** — every colour, font, size, space, radius, shadow; both themes |
| `src/assets/css/02-base.css` | element defaults: `body`, headings, links, `img`, `table`, focus rings |
| `src/assets/css/03-layout.css` | `.container`, `.grid`, `.grid--2/3/split`, `.cluster`, `.stack`, `.section` |
| `src/assets/css/04-components.css` | site header/nav, **buttons**, **cards**, forms, calculator shell, badges, alerts |
| `src/assets/css/05-content.css` | reading progress, article, CTA panel, recipe, collection controls |
| `src/assets/css/06-pages.css` | **services**, **about**, **contact**, **questionnaire** page patterns |
| `src/assets/css/07-growth.css` | growth chart SVG styling |
| `src/assets/css/08-chrome.css` | **page header banner**, **footer**, theme toggle, calculator surfaces |
| `src/assets/css/09-surfaces.css` | tool/calculator cards, calculator panels, service explorer tabs |

### GLOBAL DESIGN TOKENS — `src/assets/css/01-tokens.css`

This one file controls the look of the entire site. ⚠️ Every change here is global.

| What | Token(s) |
|---|---|
| Brand gold | `--primary: #c59a6d`, `--primary-dark`, `--primary-light`, `--primary-hover`, `--primary-active` |
| Brand dark | `--secondary: #1e2429`, `--secondary-light` |
| Surfaces (page/card backgrounds) | `--color-surface`, `--color-surface-sunken`, `--color-surface-raised` |
| Borders | `--color-border`, `--color-border-strong` |
| Text | `--color-heading`, `--color-text`, `--color-text-muted`, `--color-text-inverse` |
| Feature-card background | `--surface-feature` |
| Status colours | `--color-success`, `--color-warning`, `--color-danger`, `--color-info` (+ `-bg` variants) |
| Font families | `--font-heading` (Montserrat), `--font-body` (Lato), `--font-mono` |
| Font sizes | `--text-xs` → `--text-5xl` (a 1.200 modular scale; the top four are fluid `clamp()`) |
| Line heights | `--leading-tight/snug/normal/relaxed` |
| Weights | `--weight-normal/medium/semibold/bold` |
| Letter spacing | `--tracking-tight/normal/wide/wider` |
| Spacing | `--space-3xs` → `--space-3xl` |
| Section rhythm | `--section-padding-y`, `--container-max`, `--container-narrow`, `--container-pad` |
| Corner radius | `--radius-sm/md/lg/full/circle` |
| Shadows | `--shadow-sm/md/lg/glow` |
| Motion | `--duration-fast/base/slow`, `--ease-out`, `--ease-spring` |
| Layering | `--z-base` → `--z-toast` |
| Focus ring | `--focus-ring`, `--focus-offset` |
| Control sizing | `--control-height`, `--control-height-sm`, `--control-pad-x` |

**⚠️ Critical convention documented in the file itself:** the raw brand values
(`--primary`, `--secondary`) are the *same in both themes*. Only the semantic
aliases (`--color-surface`, `--color-text`, …) flip. **Components must consume
the semantic tokens, never the raw brand values, or they will not theme.**

### PAGE-SPECIFIC AND COMPONENT STYLES

| To restyle | Edit | Section |
|---|---|---|
| Buttons | `src/assets/css/04-components.css` | `BUTTONS` (~line 243) |
| Cards (all) | `src/assets/css/04-components.css` | `CARD` (~line 374) |
| Forms and inputs | `src/assets/css/04-components.css` | `FORM SYSTEM` (~line 462) |
| Calculator shell | `src/assets/css/04-components.css` | `CALCULATOR` (~line 685) |
| Badges / filter chips | `src/assets/css/04-components.css` | `BADGE / CHIP` (~line 790) |
| Alerts / info boxes | `src/assets/css/04-components.css` | `ALERT` (~line 825) |
| Site header | `src/assets/css/04-components.css` | `SITE HEADER / NAV` (~line 8) |
| Page header banner | `src/assets/css/08-chrome.css` | `PAGE HEADER` (~line 18) |
| Footer | `src/assets/css/08-chrome.css` | `FOOTER` (~line 262) |
| Theme toggle | `src/assets/css/08-chrome.css` | `THEME CONTROL` (~line 465) |
| Calculator / tool cards | `src/assets/css/09-surfaces.css` | `CALCULATOR / TOOL CARDS` (~line 31) |
| Calculator panels | `src/assets/css/09-surfaces.css` | `CALCULATOR PANELS` (~line 123) |
| Service tabs | `src/assets/css/09-surfaces.css` | `SERVICE EXPLORER` (~line 129) |
| Service page layout | `src/assets/css/06-pages.css` | `SERVICES` (~line 7) |
| About page — mission quote, credential cards | `src/assets/css/06-pages.css` | `ABOUT` (~line 100) |
| Contact channels | `src/assets/css/06-pages.css` | `CONTACT` (~line 137) |
| Quiz / assessment UI | `src/assets/css/06-pages.css` | `QUESTIONNAIRE` (~line 230) |
| Expertise cards (homepage) | `src/assets/css/04-components.css` | `.card--feature` |
| Recipe cards | `src/assets/css/05-content.css` | `RECIPE` (~line 177) |
| Blog article body | `src/assets/css/05-content.css` | `ARTICLE` (~line 31) |
| CTA panel | `src/assets/css/05-content.css` | `CTA PANEL` (~line 149) |
| Growth charts | `src/assets/css/07-growth.css` | whole file |

**Inline styles:** a handful of pages carry small `style="..."` attributes for
one-off spacing (e.g. `src/index.njk` line 21). These are page-specific and safe
to adjust. Anything reusable belongs in a partial.

---

## 11. Light mode / dark mode

### The four pieces

| Piece | File | Role |
|---|---|---|
| **Theme state** | `<html data-theme="light\|dark">` | the single source of truth; every themed rule keys off this attribute |
| **Pre-paint resolver** | `src/_includes/layouts/base.njk` lines 33–44 | a tiny inline blocking script that sets `data-theme` *before* the stylesheet applies, so there is no flash of the wrong theme |
| **Design tokens** | `src/assets/css/01-tokens.css` | defines what each theme's colours actually are |
| **Toggle behaviour + persistence** | `src/assets/js/theme.js` | click handling, `localStorage`, ARIA labels, `themechange` event |
| **Toggle markup** | `src/_includes/components/header.njk` lines 32–46 | the button, sun/moon SVGs, and label |

### Persistence

`localStorage` key **`svasth:theme`**, values `"light"` or `"dark"`, written by
`apply()` in `src/assets/js/theme.js`.

Resolution order: **saved choice → system preference → light.** If the visitor
has never used the toggle, the site follows their OS setting live. Once they
choose, their choice wins permanently.

### How the colours are defined

`src/assets/css/01-tokens.css` declares each theme **three times**, deliberately:

1. `:root { ... }` — the light-mode baseline.
2. `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { ... } }` — the system default.
3. `:root[data-theme="dark"] { ... }` and `:root[data-theme="light"] { ... }` — explicit overrides in **both** directions, so the manual toggle always beats the OS preference.

The dark palette is a warm charcoal carrying a trace of the brand gold
(`#15191c` page, `#1c2226` raised, `#f2efe9` headings) — not an inversion. The
brand gold `#c59a6d` is unchanged in dark mode and sits at 6.9:1 against those
grounds.

### To adjust a theme colour globally

- **Both themes at once** (e.g. the brand gold): change `--primary` in the
  `:root` block. It is not redeclared per theme, so one edit covers both.
- **Light mode only:** change the value in `:root { ... }` **and** in
  `:root[data-theme="light"] { ... }`. Both must match or the toggle will
  produce a different result from the initial load.
- **Dark mode only:** change it in **both** the
  `@media (prefers-color-scheme: dark)` block and
  `:root[data-theme="dark"]`. Miss one and the OS-driven and toggle-driven dark
  modes will disagree.
- **Status colours** are declared in a second pair of theme blocks further down
  the same file — same rule applies.

Always check both themes after any colour change. The toggle is in the header on
every page.

---

## 12. 🔴 Calculator safety guide

The calculators are split so that wording and arithmetic never live in the same
file. Respect the split and you cannot break a result by editing copy.

```
src/calculators/<name>.njk               ← 🟢 ALL user-visible text
src/assets/js/calculators/pages/<name>.js ← 🟠 wiring: which engine, how to render
src/assets/js/calculators/calculator-ui.js ← 🟠 shared form/validation/render plumbing
src/assets/js/calculators/engines.js      ← 🔴 EVERY FORMULA. Results live here.
test/calculators.baseline.test.js         ← 🔴 the regression net
```

### 🟢 SAFE TO CHANGE — `src/calculators/<name>.njk`

Editing any of these cannot change a computed number:

- `title:` — page heading and tab title
- `lede:` — line under the heading
- `description:` — SEO description
- `formTitle:` — heading of the input panel
- `submitLabel:` — the submit button
- `infoTitle:` — heading of the explanation panel
- `disclaimer:` — the info box
- `fields:` → `label:`, `hint:`, `placeholder:`, `requiredMessage:`
- the body below `---` — the explanatory prose and any tables

### 🔴 DO NOT CHANGE WITHOUT UNDERSTANDING

| Thing | Where | Why it is dangerous |
|---|---|---|
| Formulas | `src/assets/js/calculators/engines.js` | this is the only place a result is derived |
| Category thresholds and bands | `engines.js` | changes which label a value gets |
| Rounding | `engines.js` (`round1`, `round2`, `round4`) | affects displayed and, in places, categorised values |
| Result messages tied to bands | `engines.js` | shipped alongside the threshold logic |
| `fields:` → `unit:` | the `.njk` file | **the trap.** `unit:` is a label, but the engine assumes the unit. Changing "cm" to "inches" leaves the maths in centimetres and silently produces wrong answers. |
| `fields:` → `min:` / `max:` / `step:` | the `.njk` file | input validation bounds, not wording |
| `fields:` → `name:` | the `.njk` file | must match the field name the page module reads |
| `formId:` / `resultId:` / `scriptModule:` | the `.njk` file | wiring identifiers; a mismatch silently disables the calculator |
| `compute:` blocks | `src/assets/js/calculators/pages/<name>.js` | input transformation before the formula runs |
| Anything in `test/` | `test/` | these tests are the guard, not an obstacle |

### The preserved-quirks contract

The header comment of `src/assets/js/calculators/engines.js` documents seven
behaviours that look like bugs but are **intentionally preserved** from the
original site, each covered by a test:

- **Q1** BMI, waist-to-hip and waist-to-height categorise on the *unrounded*
  value while *displaying* the rounded one — a BMI of 22.96 shows "23.0" but
  categorises as "Normal Weight".
- **Q2** Ideal body weight below 152.4 cm applies the Broca index (already kg)
  and then divides by 2.2 again. Suspected original bug; preserved.
- **Q3** The protein "maintenance" factor (0.8) is lower than fat-loss (1.1) and
  muscle-gain (1.2).
- **Q4** The protein meal split shows `round(total/4)` four times, so the four
  parts need not sum to the total.
- **Q5** HOMA-IR passes mmol/L glucose through unchanged while dividing mg/dL by 18.
- **Q6** QUICKI uses `log10(insulin) + log10(glucose)`; non-positive inputs yield
  `-Infinity`/`NaN` exactly as before.
- **Q7** Water intake is capped at 4000 ml *before* deriving litres and glasses.

**Do not "fix" any of these without an explicit decision.** Changing them alters
results that people have already received.

### Before and after any calculator edit

```bash
npm test
```

If the tests pass, you have not changed a result. If they fail after a wording
change, you edited something that was not wording.

---

## 13. 🔴 Assessment content guide

The two assessments are structured differently. Know which one you are editing.

### Shared pieces

| Piece | File | Type |
|---|---|---|
| Quiz shell markup, all flow labels | `src/_includes/components/quiz.njk` | 🟠 shared UI text |
| Flow controller (steps, progress, branching, review) | `src/assets/js/questionnaires/quiz-ui.js` | 🔴 logic |
| Phone validation | `src/assets/js/phone.js` | 🔴 logic |

UI text inside `quiz.njk` that is safe to reword — but changes **both**
assessments: "Before we begin", "Your name", "Contact number (WhatsApp)",
"Start assessment", "Back", "Next", "Review your answers",
"See my result".

### Gut Health Assessment

⚠️ **Questions and scoring live in the same file.** Edit with care.

| What | Where | Risk |
|---|---|---|
| Question wording | `src/assets/js/questionnaires/gut-engine.js` → `QUESTIONS` array, the `text:` values | 🟢 safe |
| Question `id` values | same array | 🔴 **never renumber** — each id is a `Q<id>` column in the results spreadsheet; renumbering silently changes what every historical column means |
| Adding / removing questions | same array | 🔴 changes the maximum score and therefore everyone's band |
| Answer scale ("Never" → "Always" and their scores) | `FREQUENCY_SCALE` in the same file | 🔴 scoring |
| Q8's custom non-monotonic scale | same file | 🔴 deliberately inverted; see quirk G2 |
| Band thresholds and analysis messages | `scoreGutQuestionnaire()` in the same file | 🔴 scoring |
| Result rendering (headings, layout) | `src/assets/js/questionnaires/gut.js` | 🟠 presentation |
| Intro paragraph | `quizIntro:` in `src/questionnaire/gut.njk` | 🟢 safe |
| Page title, lede, breadcrumbs | front matter of `src/questionnaire/gut.njk` | 🟢 safe |

**Retired ids** — the file documents that ids 16, 18 and 25 belonged to removed
questions and are deliberately left unused. New questions continue from 26.

**Preserved quirks (documented in the file, covered by
`test/questionnaire.baseline.test.js`):**
- **G1** the score is a percentage of the maximum (26 × 5 = 130), so answering
  "Never" to everything scores 20%, not 0%. The best achievable band is
  "Excellent" at exactly 20%.
- **G2** Q8 ("How often do you poop?") scores `[1, 2, 5, 4, 3]` — non-monotonic,
  because "Once a day" is the healthiest answer while a higher total means worse
  gut health everywhere else.
- **G3** "high symptoms" are those answered ≥ 4.

### PCOS Root Cause Analysis

✅ **Questions are properly separated into a data file.**

| What | Where | Risk |
|---|---|---|
| Question wording | `src/_data/pcos.json` → `questions[].text` | 🟢 safe |
| Question `id` | `src/_data/pcos.json` | 🔴 same spreadsheet-column rule as the gut assessment |
| Question `group` (Insulin Resistance / Inflammatory / Post-Birth Control / Adrenal) | `src/_data/pcos.json` | 🔴 determines which root cause a question feeds |
| Group names and explanations | `src/_data/pcos.json` → `groups` | 🟠 content, but the `key` is matched in code |
| Binary answer options for specific questions | `src/_data/pcos.json` → `binaryQuestions` | 🔴 the `value` is a score |
| Default frequency scale | `FREQUENCY` in `src/assets/js/questionnaires/pcos.js` | 🔴 scoring |
| Branching (Q21 = "No" skips the Post-Birth Control block) | `nextQuestionIndex()` in `src/assets/js/questionnaires/pcos-engine.js` | 🔴 logic |
| Scoring and root-cause selection | `scorePcos()` in `pcos-engine.js` | 🔴 logic |
| Result rendering | `src/assets/js/questionnaires/pcos.js` | 🟠 presentation |
| Intro paragraph | `quizIntro:` in `src/questionnaire/pcos.njk` | 🟢 safe |
| "not a diagnosis" note | body of `src/questionnaire/pcos.njk` | 🟢 safe |

**Preserved quirk (covered by `test/pcos.baseline.test.js`):**
- **P1** a group's score is the **count** of its questions answered ≥ 4, not the
  sum. A 5 and a 4 each contribute exactly 1.

### Progress, validation and submission

| Concern | File |
|---|---|
| Progress bar percentage (computed from *reachable* questions, not raw count) | `src/assets/js/questionnaires/quiz-ui.js` |
| Name/contact validation | `src/assets/js/questionnaires/quiz-ui.js` + `src/assets/js/phone.js` |
| Review screen | `src/assets/js/questionnaires/quiz-ui.js` + `quiz.njk` |
| Submission payload (Google Sheets columns) | `buildGutPayload()` in `gut-engine.js`, `buildPcosPayload()` in `pcos-engine.js` |
| Transport (hidden-iframe POST) | `postViaIframe()` in `quiz-ui.js` |

🔴 **The payload shape is a contract with a live Google Sheet.** Changing column
names or ordering breaks historical data alignment.

### Before and after any assessment edit

```bash
npm test
```

---

## 14. Shared component map

| Component | Path | Purpose | Used by | Scope |
|---|---|---|---|---|
| **Base layout** | `src/_includes/layouts/base.njk` | HTML shell, `<head>`, SEO/OG tags, fonts, theme pre-paint, script loading | every page | ⚠️ GLOBAL |
| **Header** | `src/_includes/components/header.njk` | brand lockup, primary nav, theme toggle, mobile drawer | every page | ⚠️ GLOBAL |
| **Footer** | `src/_includes/components/footer.njk` | brand block, Explore column, contact column, legal bar, designer dialog, image lightbox | every page | ⚠️ GLOBAL |
| **Page header** | `src/_includes/components/page-header.njk` | eyebrow / H1 / lede / breadcrumbs / meta row; variants `hero`, `media`, `plain` | every page except Home and 404 (they set `pageHeader: false`) | ⚠️ SHARED |
| **Theme switcher** | markup in `header.njk`; behaviour in `src/assets/js/theme.js` | light/dark toggle + persistence | every page | ⚠️ GLOBAL |
| **CTA panel** | `src/_includes/components/cta.njk` | "Ready to take the next step?" + booking button | 38 blog posts + 30 recipes | ⚠️ SHARED |
| **Icon set** | `src/_includes/components/icon.njk` | inline SVGs: `chat`, `phone`, `envelope`, `pin` | Contact page | ⚠️ SHARED |
| **Quiz shell** | `src/_includes/components/quiz.njk` | start / questions / review / result screens | both assessments | ⚠️ SHARED |
| **Calculator layout** | `src/_includes/layouts/calculator.njk` | form panel, result panel, info panel, disclaimer | all 11 calculators | ⚠️ SHARED |
| **Article layout** | `src/_includes/layouts/post.njk` | reading progress, TOC, article body, CTA, "More reading" | all 38 blog posts | ⚠️ SHARED |
| **Recipe layout** | `src/_includes/layouts/recipe.njk` | stats, checklists, print, Recipe structured data | all 30 recipes | ⚠️ SHARED |
| **Growth layout** | `src/_includes/layouts/growth.njk` | chart figure, input form, result panel | all 6 growth chart pages | ⚠️ SHARED |
| **Cards** | `.card`, `.card--interactive`, `.card--feature`, `.card--stat` in `src/assets/css/04-components.css` | one card system, used as markup patterns rather than an include | home, blogs, recipes, calculators, growth, services, assessments | ⚠️ GLOBAL (CSS) |
| **Buttons** | `.btn`, `.btn--primary/secondary/tertiary/sm/on-dark` in `src/assets/css/04-components.css` | one button system | every page | ⚠️ GLOBAL (CSS) |
| **Forms** | `.field`, `.control`, `.choice-group` in `src/assets/css/04-components.css` | one form system | calculators, contact, assessments, growth charts | ⚠️ GLOBAL (CSS) |
| **Calculator UI controller** | `src/assets/js/calculators/calculator-ui.js` | validation messaging, result choreography — no arithmetic | all 11 calculators | ⚠️ SHARED |
| **Calculator engines** | `src/assets/js/calculators/engines.js` | all formulas | all 11 calculators | 🔴 SHARED LOGIC |
| **Quiz controller** | `src/assets/js/questionnaires/quiz-ui.js` | flow, progress, branching, submission | both assessments | ⚠️ SHARED |
| **Content behaviour** | `src/assets/js/content.js` | reading progress, TOC, checklists, collection search/filter | blogs hub, recipes hub, all posts, all recipes | ⚠️ SHARED |
| **Site behaviour** | `src/assets/js/site.js` | header scroll, mobile nav, modals, lightbox, reveal animations, disclosures | every page | ⚠️ GLOBAL |
| **Phone validation** | `src/assets/js/phone.js` | E.164-shaped validation, deliberately not India-locked | contact form + both assessments | ⚠️ SHARED |

---

## 15. File safety guide

### 🔴 HIGH RISK — changing this may affect calculations or business logic

| File | Why |
|---|---|
| `src/assets/js/calculators/engines.js` | every calculator formula, threshold and rounding rule |
| `src/assets/js/questionnaires/gut-engine.js` | gut questions, scores, bands **and** the spreadsheet payload |
| `src/assets/js/questionnaires/pcos-engine.js` | PCOS scoring, branching, payload |
| `src/assets/js/growth/growth-engine.js` | three distinct percentile classification algorithms |
| `src/_data/growthCharts.json` | clinical percentile reference datasets |
| `src/_data/pcos.json` | question ids, groups and binary scores (wording within is safe) |
| `src/assets/js/phone.js` | validation rules for three separate forms |
| `src/assets/js/contact.js` | the Google Apps Script transport; documented as "do not modernise" — the endpoint sends no CORS headers, so a plain `fetch()` would be blocked |
| `test/*.test.js` (5 files) | the regression net that proves results have not drifted |

### 🟠 SHARED — changing this affects multiple pages

| File | Affects |
|---|---|
| `src/_data/site.js` | every page |
| `src/_includes/layouts/base.njk` | every page |
| `src/_includes/components/header.njk` | every page |
| `src/_includes/components/footer.njk` | every page |
| `src/_includes/components/page-header.njk` | all but Home and 404 |
| `src/_includes/components/cta.njk` | 68 pages |
| `src/_includes/components/quiz.njk` | 2 pages |
| `src/_includes/components/icon.njk` | Contact |
| `src/_includes/layouts/calculator.njk` | 11 pages |
| `src/_includes/layouts/post.njk` | 38 pages |
| `src/_includes/layouts/recipe.njk` | 30 pages |
| `src/_includes/layouts/growth.njk` | 6 pages |
| `src/assets/css/01-tokens.css` | every page |
| `src/assets/css/02-base.css` – `09-surfaces.css` | every page (scoped by selector) |
| `src/assets/js/site.js`, `theme.js`, `content.js` | many pages |
| `src/assets/js/calculators/calculator-ui.js` | 11 pages |
| `src/assets/js/questionnaires/quiz-ui.js` | 2 pages |

### 🟢 CONTENT — safe for normal wording and content changes

| File | Note |
|---|---|
| `src/index.njk` | homepage copy |
| `src/about.njk` | about copy |
| `src/services.njk` | services copy + the services array |
| `src/contact.njk` | contact page copy |
| `src/questionnaire/index.njk` | assessment hub copy |
| `src/blog/*.njk` (38) | article metadata and text |
| `src/recipes/*.njk` (30) | recipe front matter |
| `src/calculators/*.njk` (11) | calculator wording — **except** `unit`, `min`, `max`, `name`, `formId`, `resultId`, `scriptModule` |
| `src/blogs.njk`, `src/recipes-index.njk` | hub page copy and empty states |
| `src/calculators/index.njk`, `src/growth-charts/index.njk` | hub copy |
| `src/404.njk` | error page copy |
| `src/growth-charts/*.njk` (6) | title and description only — the rest is data-driven |

### ⚙️ Build, config and routing — do not casually modify

| File | Role |
|---|---|
| `eleventy.config.js` | input/output dirs, passthrough copies, CSS bundling, collections, filters. Breaking this breaks the whole build. |
| `package.json` | dependencies and the `start` / `build` / `test` / `check` scripts |
| `package-lock.json` | never hand-edit |
| `src/_data/legacyRedirects.js` | keeps 87 old `.html` URLs alive; deleting entries produces 404s for indexed links |
| `src/redirects.njk` | generates the redirect stubs |
| `src/sitemap.njk`, `src/robots.njk` | SEO plumbing, auto-generated |
| `CNAME` | the custom domain for GitHub Pages. **Deleting this unpoints the domain.** |

### 🚫 Never edit

| Path | Why |
|---|---|
| `_site/` | build output — regenerated on every build |
| `_site/assets/css/main.css` | generated by concatenating the nine partials |
| `node_modules/` | installed dependencies |
| `_archive/` | frozen snapshot of the pre-rebuild site, kept as the reference for the preserved-behaviour contract |

### 📖 Reference documents

| File | Role |
|---|---|
| `BASELINE.md` | the functional contract captured before the rebuild: routes, legacy URL map, and the behaviours the site must reproduce. Read it before changing anything marked 🔴. |
| `CONTENT_EDITING_GUIDE.md` | this file |

---

## 16. Common editing tasks

### "Change homepage wording"

→ `src/index.njk`. Hero on lines 13–26, expertise cards on 37–55, bio on 74–116,
closing CTA on 132–140. All plain text.

### "Change About page wording"

→ `src/about.njk`. Banner text is in the front matter (`pageTitle`, `eyebrow`,
`lede`); mission quote is line 16; credential cards are lines 51–76.

### "Change a service description"

→ `src/services.njk`, the `services:` array in the **front matter** (lines 7–39).
Edit `name`, `summary` or the `steps:` list. Do not edit the tab markup in the
body — it is generated from this array.

### "Change a recipe"

→ `src/recipes/<name>.njk`. Everything is front matter: `title`, `excerpt`,
`description`, `image`, `metaItems`, `ingredients`, `instructions`. Keep
`description` and `excerpt` in step. Find the right file with:

```bash
grep -ril "recipe name" src/recipes/
```

### "Change a blog"

→ `src/blog/<name>.njk`. Metadata in front matter (`title`, `excerpt`,
`description`, `meta`); article text is raw HTML in the body. Find it with:

```bash
grep -ril "article title" src/blog/
```

### "Change calculator wording"

→ `src/calculators/<name>.njk` only. Change `title`, `lede`, `formTitle`,
`submitLabel`, `infoTitle`, `disclaimer`, the field `label`/`hint`/`placeholder`,
or the body prose. **Do not touch `unit`, `min`, `max`, `name`, `formId`,
`resultId` or `scriptModule`.** Then run `npm test` — passing tests prove no
result changed.

### "Change assessment question"

→ **Gut:** `src/assets/js/questionnaires/gut-engine.js`, the `QUESTIONS` array —
edit `text:` only, never `id:`.
→ **PCOS:** `src/_data/pcos.json`, the `questions` array — edit `text` only,
never `id` or `group`.
Run `npm test` afterwards. See §13 before adding or removing a question.

### "Change footer"

→ **Wording:** `src/_data/site.js` → `footer` (blurb, copyright, strapline) and
`contact` (email, phone, location).
→ **Column headings and layout:** `src/_includes/components/footer.njk`.
→ **Styling:** `src/assets/css/08-chrome.css`, `FOOTER` section (~line 262).
⚠️ Global — verify one page in each theme afterwards.

### "Change header/navigation"

→ **Link text, order or destinations:** `src/_data/site.js` → `nav` array.
This drives the desktop header, the mobile drawer and the footer's Explore
column simultaneously.
→ **Header markup:** `src/_includes/components/header.njk`.
→ **Header styling:** `src/assets/css/04-components.css`, `SITE HEADER / NAV`.
⚠️ Global.

### "Change a global color"

→ `src/assets/css/01-tokens.css`. Brand colours (`--primary`, `--secondary`) are
declared once in `:root` and cover both themes. Theme-dependent colours
(`--color-surface`, `--color-text`, …) are declared **three times** — see §11 for
which blocks to update together. Always check both light and dark afterwards.

### "Change Light/Dark mode"

→ **Colours:** `src/assets/css/01-tokens.css` (the `@media (prefers-color-scheme: dark)`,
`:root[data-theme="dark"]` and `:root[data-theme="light"]` blocks).
→ **Toggle behaviour or persistence:** `src/assets/js/theme.js`
(`localStorage` key `svasth:theme`).
→ **Toggle button markup:** `src/_includes/components/header.njk` lines 32–46.
→ **Flash-prevention snippet:** `src/_includes/layouts/base.njk` lines 33–44 —
if you change the storage key, change it here too.

### "Add a new page"

→ Create a `.njk` file anywhere in `src/`, set `permalink:` to the URL you want,
`layout: layouts/base.njk`, plus `title`, `description`, `eyebrow` and `lede`.
Write the body in HTML. Add it to `nav` in `src/_data/site.js` if it should
appear in the menu. Full recipe in §7.

### "Add a new blog post" / "Add a new recipe"

→ Drop a new `.njk` file into `src/blog/` or `src/recipes/`. The listing page
picks it up automatically via the collections defined in `eleventy.config.js` —
no hub edit required. Templates in §7.

### "Update the phone number, email or WhatsApp link"

→ `src/_data/site.js` → `contact`. One edit updates the header, footer, contact
page and every "Book a consultation" button.

> **Known discrepancy, carried over deliberately from the original site and
> documented in `src/_data/site.js`:** the footer *displays*
> `sanelysvasth@gmail.com` but the `mailto:` link points at
> `info.svasth@gmail.com` (`contact.emailDisplay` vs `contact.emailHref`). Both
> values are preserved exactly as they were. Reconciling them is a decision for
> the site owner, not an accidental fix.

### "I changed something — how do I check it?"

```bash
npm run check
```

That runs the tests and a full production build. Then `npm start` and look at
the page in both light and dark mode, at desktop and phone width.

### "I can't find where a piece of text lives"

Search the source tree — never `_site/`:

```bash
grep -rn "the exact text you see" src/
```

Add `img/` or `eleventy.config.js` to the search if it looks like an asset path
or a generated label.

---

## Maintenance Rule

Whenever future development changes the location, structure, architecture,
content source, or editing process of any documented page or component, update
`CONTENT_EDITING_GUIDE.md` accordingly.

The guide should remain an accurate representation of the current project.

In particular, update this document when you:

- add, remove or rename a page, and update the §1 inventory and §5 lookup table
- move content from a template into a data file, or the reverse
- add a new component to `src/_includes/components/` or a layout to `src/_includes/layouts/`
- add or split a CSS partial (and remember to register it in the `CSS_PARTIALS`
  array in `eleventy.config.js`)
- add a calculator, an assessment or a growth chart
- change how the theme system stores or resolves state
- change a URL (and add a redirect in `src/_data/legacyRedirects.js`)
- change the calculator or assessment split between content and logic

Line numbers quoted in this guide are accurate as of writing and are given as a
starting point, not an anchor — if content has shifted, search for the quoted
text instead.

---

*Last verified against the project on 10 August 2026.*
