# Koi Roofing & Solar — Greastro Rebuild Plan

> **Goal:** Rebuild koiroofingandsolar.com on the current Greastro engine.
> **Users must notice nothing. Developers must notice everything.**
>
> Every pixel, color, word, image, and URL that a visitor can perceive stays the
> same. Everything *behind* it — the section engine, the collection schema, the
> SEO/schema/llms layer, page generation, querying — is replaced with the
> Greastro-native equivalent.

**Status:** Planning. Project scaffolded at `2026/KoiRoofingandSolar` (duplicated from `2026/greastro`).
**Source of truth for old site:** `2026/2025-leftover/KoiRoofandSolar`
**Reference implementations:** `johns-pro-roofing` (closest analogue), `hydraIV`, `certified-bag-chasers`, `pronto-junk-removal`

---

## 1. The two codebases, side by side

Both are Astro + React + Tailwind 4 static sites driven by content collections.
The difference is *how much the framework does for you*.

| Concern | Old Koi ("pre-Greastro") | Greastro 2026 | Consequence for the port |
|---|---|---|---|
| **Section rendering** | One monolithic `Section.astro` (~470 lines) resolving a 3-tier cascade of ~15 class-slot props, plus `SectionVariants.js` with 17 visual variants | `ContentRenderer.astro` orchestrator → **Variant** (layout strategy) → **LoopComponent** (single card) → **LoopTemplate** (interactive wrapper) | Every `<Section collection=… query=…>` becomes `<ContentRenderer query={query(…)} variant=… />`. The 17 Koi variants map onto Greastro variants + a small number of new project-local variants. |
| **Data access** | String-keyed queries (`query="getAll"`, `"related"`, `"parent"`) resolved in `SectionUtils`/`CollectionQueryUtils` | Chainable `query('collection').where().orderBy().limit().withRelations()` + snippets (`related`, `children`, `roots`, `byTag`) | Replace magic strings with real query builders. Drafts auto-excluded. |
| **Collection schema** | Per-collection ad-hoc Zod; `sectionSchema` embedded in frontmatter (content carries layout config) | `baseSchema` / `metaSchema` in `src/content/schema.ts`: `seo`, `llms`, `addToMenu`, `redirectFrom`, `linkBehavior`, `hasPage`, `rootPath`, `order`, `draft`, `parent`, `tags` | Content stops carrying CSS classes. Layout lives in code; content carries *content*. |
| **Static heroes** | `variant="primaryHero"` config object + a deleted `PrimaryHero.astro` | **`FrontPageHero.astro`** and **`SecondaryHero.astro`** layouts (real components, `BackgroundMedia`, LCP `aboveTheFold`) | Homepage hero becomes `FrontPageHero`; all inner/collection pages get `SecondaryHero`. |
| **Root layout** | `ExtendedLayout` → `BaseLayout` + `AnimationLayout` + hand-rolled `HeadTags` with inline scripts | **`BaseLayout.astro`**: `Theme` (no-flash bootstrap) + `SEO` + `HeadTags` + `Header` + `BodyTags` + `Footer` + `PreferencesLayout` (consent / a11y / language / dark mode) | Big win: sticky footer, no-flash theme, markup-level a11y. (All three preference UIs — consent, language, a11y panel — are deliberately **off**; §7.6.) |
| **SEO** | `SEO.astro` with manual meta; **JSON-LD hand-pasted per page** as `<script slot="head">` | `SEO.astro` + `utils/seo.ts` fallback chain, plus **schema builders** in `utils/schema/` (`businessSchema`, `breadcrumbSchema`, `faqSchema`, `reviewSchema`, `serviceSchema`) composed into one `@graph` | Delete all hand-pasted JSON-LD. Schema becomes derived from content and *always matches what's on the page*. |
| **robots / llms.txt** | `robots.txt.ts` page; **no llms.txt at all** | `robots-llms.integration.ts` reads the `dist/__seo/*.json` manifest each page writes, then emits `robots.txt`, `llms.txt`, `llms-full.txt` | Free AI discoverability. Per-page control via `seo.robots` + `llms.addToLLMs`. |
| **Menus** | Hardcoded TS arrays (`MainNavMenu.ts`, `FooterMenu.ts`, `ContactMenu.ts`) | `menus` + `menu-items` collections; `MenuItemsLoader` merges JSON + `addToMenu`/`itemsAddToMenu` frontmatter, resolves parents, derives URLs | Menus become content. A new service auto-appears in nav. |
| **Redirects** | One catch-all trailing-slash rule in `vercel.json` | `utils/redirects/` — `redirectFrom` frontmatter + automatic bidirectional path-alias canonicalization, with circular/XSS validation | Preserves legacy URLs (§6). Note it handles `/collection/slug` ↔ `/slug` only — **not** trailing slashes (§6.1). |
| **Icons** | PNG image files used as icons (`@/assets/roofing.png`) | `react-icons` + build-time generated icon map; `icon: "fa6:..."` / `"lu:..."` | Icons become vector + themeable. |
| **Forms** | 6 form components, 6 bespoke env vars | `Formspree` via `utils/formspree.ts`, `PUBLIC_FORMSPREE_*` | Consolidate (see §7). |
| **Consent/a11y/i18n/dark mode** | None | Full preferences system | Available but **switched off** to match the legacy site (§7.6). |

### Proven conventions from `johns-pro-roofing` (the closest analogue — steal these)

Verified against that repo. It is the reference implementation for a roofing site on Greastro:
it **deletes nothing** from the template — 7 new collections, 7 new variants, ~15 new
components, and a handful of surgical in-place edits.

1. **Thin project `AGENTS.md` (133 lines) that delegates** to `../greastro/AGENTS.md` and adds
   only: a 5-point "where the brand lives" map, the sanctioned-third-party table **plus a
   rule that the CSP must be edited in the same change**, and a start-of-chat third-party
   audit ritual (with concrete greps). Koi needs exactly this — its allowlist is much bigger.
2. **Three exports in `siteData.ts`**: `siteData` (incl. `businessType`), **`businessData`**
   (licence #, insurance, warranty — interpolated into MDX copy, *never* inlined), `ctaData`.
   → Koi has real equivalents to hoist: **"50-year warranty", "$0 down financing",
   "20+ years / three generations", "veteran-owned"**, all currently retyped across pages.
3. **`ctaSchema` added to `schema.ts`** on *both* `baseSchema` and `metaSchema`
   (`{title, accent, titleAfter, description, points[], count, primary, secondary}`) so any
   page's frontmatter drives its CTA banner copy. Koi's repeated "Request Estimate" /
   Roofing+Solar button pairs fit this exactly.
4. **`<Bands>` / `<Band>`** — the service-page body primitive. Auto-alternates
   light/dark backgrounds via `:nth-of-type`; **the author never sets a color**. This is how
   Koi's alternating `media1`/`media2`/`imageCol` rhythm should be rebuilt.
5. **Hero inversion.** `CollectionLayout` is gutted to content-only; each item MDX wraps
   itself in `ServiceLayout` and fills its **`hero` slot**. That's what lets a page lead with
   a custom hero instead of the default `SecondaryHero`.
6. **Two tiny high-leverage template hooks** (already proven, port both):
   `BaseLayout` gains `<slot name="head" />` + `hideHeader`/`hideFooter`;
   `ContentRenderer` gains a **`heading` slot** passthrough so a page can hand-write its H2.
7. **Reference-derived grouping over duplicated strings** — put a service ref on
   projects/faq/types and *derive* category/placement, rather than copying a category string.
8. **Presentation-flag filtering** — `cardSize` on services as the "is top-level" filter,
   `tags: ["featured"]` on projects. Koi can use the same trick instead of new collections.
9. **Single-source-of-truth wrapper components** — `PhoneLink` (queries `contact-us`, never
   takes a number as a prop), `getServiceAreaNames()/Abbrs()`. Koi's phone number is
   currently retyped in many places; this fixes it.
10. **Menus:** `menu-items.json` holds only `home` + **URL-less grouping parents**; every real
    item is injected by collection `addToMenu`/`itemsAddToMenu` with `parent:`/`order:`.
    → Koi's "Monmouth County" submenu becomes exactly such a URL-less parent.

**Directly reusable components that already exist there** (don't rebuild from scratch):
`BeforeAfterVariant` + `BeforeAfterCard` (Koi's before/after projects),
`TestimonialCarouselVariant` (auto-scrolling reviews — **already emits `buildReviewSchema`
JSON-LD**), `MarqueeVariant`, `ImageCardVariant`, `StatsVariant`, `ServiceListVariant`,
`ServiceCalloutVariant`, `GoogleRating.astro`, `ReviewButton.astro`, `PhoneLink.astro`.

> **Known drift in that reference — do NOT copy:** CSP missing `fonts.googleapis.com` in
> `style-src`; `formName="Greastro …Form"` hidden inputs left in the forms; `PUBLIC_GTM_ID`
> documented but absent from `.env`/`env.d.ts`; stale `PUBLIC_SITE_DOMAIN=example.com`;
> ~70 lines of commented-out form markup in `index.astro`; orphaned `CustomIndexLayout.astro`
> / `MultiStepQuoteForm.tsx`; three competing asset directories; a stale collection list in
> its own AGENTS.md.

### What Greastro adds that Koi simply doesn't have
`llms.txt` + `llms-full.txt` · derived schema.org `@graph` · link-tree page · pagination · redirect validation · scroll-animation registry · custom client directives (`client:click`, `client:hover`, `client:scroll`, `client:firstInteraction`) · strict CSP security headers. *(The preferences system — consent, a11y panel, i18n, dark mode — also ships, but is deliberately disabled; §7.6.)*

---

## 2. Guiding rules for this port

Straight from `AGENTS.md` (which governs this repo — **Project Mode**):


1. **Rebrand in place.** Edit Greastro's files. Never create a parallel `KoiSection.astro` next to `ContentRenderer`. No starter branding left behind, no duplicate systems.
2. **Content is the source of truth.** No hardcoded arrays in components when a collection exists or should exist. Every visible list comes from a collection.
3. **Rendering goes through ContentRenderer.** New display style ⇒ new **Variant**, not inline markup.
4. **Use the query system.** No ad-hoc `getCollection()` loops.
5. **Brand = tokens.** Change `@theme` variables in `global.css`; leave component structure alone.
6. **Stay static.** `output: 'static'`. Third parties are client-side embeds or build-time only.
7. **The accessibility panel is first-party, not an overlay** — the rule is "don't strip it". Koi is a deliberate, user-instructed exception (§7.6): the toolbar is *commented out*, and the markup-level accessibility it sits on top of is untouched.
8. **Sanctioned third parties are an allowlist** (§7). Anything not on it doesn't belong.

---

## 3. Visual contract — what must NOT change

This is the acceptance bar. Extracted from the old `global.css` `@theme` block and must be carried over **verbatim**.

### Design tokens (port exactly)
```css
--color-bg:         #f2f0ef;   --color-bg-2:      #e9ecee;
--color-heading:    #111111;   --color-text:      #5d626d;
--color-text-light: #f2f0efc4; --color-primary:   #232f49;  /* navy */
--color-secondary:  #0d75b6;   /* blue */
--color-accent:     #feae00;   /* amber */
--color-neutral:    #f3f4f6;

--font-base:    "Lato", sans-serif;
--font-heading: "Poppins", sans-serif;
```
Plus the spacing scale (`--spacing-xs` … `--spacing-4xl`, `--spacing-sec-y: 75px`), radius scale, and the full 10-step shadow scale.

> **Note:** Greastro derives `primary-50…950` via `oklch(from var(--color-primary) …)`. Setting `--color-primary: #232f49` gives the whole derived ramp for free — but Koi's *semantic* pairs (`bg`/`bg-2`/`text-light`/`accent`) must be preserved as explicit tokens since Koi uses them directly.

### Signature typography & utility classes to preserve
`.h1`–`.h6` (note: `font-thin` + `tracking-wider` on h1/h2 — the airy Koi look), `.top-heading` (uppercase, widest tracking, used for the amber hero eyebrow), `.heading-primary` (**the navy→blue gradient text clip** — Koi's most recognizable treatment), `.border-radius` (`rounded-2xl`), `.content-section` (85% width), `.sec-spacing-y`, and `body { background-color: var(--color-primary) }`.

### Homepage section order (must render identically, top to bottom)
| # | Old implementation | New implementation |
|---|---|---|
| 1 | `Section variant="primaryHero"` — video bg, amber eyebrow, H1, subhead, Roofing/Solar buttons, GoogleRating below buttons, SocialMedia rail (vertical ≥md / horizontal <md) | **`FrontPageHero`** + `GoogleRating` + `SocialMedia` in slots |
| 2 | `variant="imageCol"` reversed — "About Koi Roofing & Solar", italic tagline quote, 2 CTAs, intro video | Media/split section + `Video` |
| 3 | `variant="listSection2"` — Residential / Commercial / Industrial (3 inline items) | **New `service-tiers` collection** + Grid/List variant |
| 4 | `variant="media1"` — "Our goal is simple:" over video bg | Media band |
| 5 | `Section collection="benefits"` + nested video | `ContentRenderer query={query('benefits')}` |
| 6 | `SpanishSection` | Static section (project-local) |
| 7 | `Section collection="testimonials"` | `TestimonialVariant` + **`buildReviewSchema`** |
| 8 | `Section collection="services" query="parent"` | Two renderers: roofing + solar |
| 9 | `Section collection="projects"` — before/after slider | Project variant (before/after) |
| 10 | `Section collection="faq"` | `AccordionVariant` + **`buildFaqSchema`** |
| 11 | `Section collection="gallery"` + ServiceBtns | `GalleryMarquee` / gallery variant |

> **Exception to the visual contract: no animations (§7.9).** The old site's 196 animation-class
> usages are **not** ported — a deliberate, accepted visual departure, since that library is no
> longer used. Everything else in this section still holds exactly.

---

## 4. Collection architecture

### 4.1 The services split (the one intentional structural change)

Old Koi: a single `services` collection, 13 entries, two roots with children via `parent`:
- `roofing` (root) ← 6 children: new-roof-installation, roof-replacement, roof-inspections-reports, flat-roof-waterproofing, emergency-leak-repair, storm-damage-assessment-insurance-assistance
- `solar` (root) ← 5 children: full-service-solar-system-design-installation, panel-mounting-and-roof-integration, net-metering-setup-and-utility-interconnection, solar-tax-credit-financing-guidance, ongoing-monitoring-maintenance-support

**New:** drop `services`; create **`roofing`** and **`solar`** as sibling top-level collections, each holding what were the children. This makes each line of business independently expandable (its own meta, menu, SEO, layout, future sub-services).

**How to do the split — the `hydraIV` precedent.** hydraIV solved exactly this problem: it
split its domain "services" into **4 sibling top-level collections** (`treatments`, `addons`,
`packages`, `categories`). The conventions it establishes, verified in its code:

1. **Siblings at the same top level**, plural lowercase names, registered in `content.config.ts`.
2. **Each sibling carries a `// ── <name> ──` banner comment whose second sentence justifies
   its existence relative to its siblings** — e.g. *"Kept separate from `treatments` so add-ons
   don't appear as their own treatment category/tab."* This is the single strongest convention
   in that file, and the plan should honor it for `roofing` and `solar`.
3. **Near-identical extended schemas are deliberately duplicated** rather than shared via a
   helper — divergence is the point (each line of business can grow its own fields).
4. **One shared Variant with a `card` prop** when two siblings render almost the same
   (`card === "package" ? PackageCard : TreatmentImageCard`). Koi's roofing/solar cards are
   near-identical, so this applies directly.

> **Where Koi differs from hydraIV:** in hydraIV one sibling owns the page (`hasPage: true`)
> and the others are `hasPage: false` sections rendered inside its `_meta.mdx` body. Koi's
> **roofing and solar are co-equal — both have live pages today** (`/services/roofing/`,
> `/services/solar/`). So both get `hasPage: true`, both go in the menus, and each renders its
> own children. Don't blindly copy hydraIV's primary/secondary asymmetry.

> ⚠️ **Critical dependency — cross-references.** `services` is referenced by **4 other collections**: `projects` (7 entries), `testimonials` (9), `types` (6), `faq` (14 items), and `benefits` (6 items). Every one must be remapped.
>
> And note: **FAQ and benefits reference *both*** (`services: ["solar","roofing"]` — 2 FAQ items and 5 benefit items), so whatever replaces the old single `services` ref has to express membership in *two* collections at once. Get this shape right once and apply it consistently — it's the most error-prone part of the port.

**Recommended shape: a real multi-collection reference.** `refSchema` already supports this
natively — it takes `CollectionKey | CollectionKey[]` and builds a `z.union` of `reference()`s,
then wraps it so a field accepts either a single ref or an array:

```ts
// src/content.config.ts — on types / projects / testimonials / faq / benefits
serviceLines: refSchema(["roofing", "solar"]),
```

This is the right tool, and it works end to end:
- **One field covers both lines.** The dual cases are just a two-element array —
  `serviceLines: ["roofing", "solar"]` resolves one ref into each collection.
- **`normalizeReference()` returns `{ collection, id }` pairs**, so downstream code can tell
  a roofing ref from a solar ref, and `relations.ts` resolves each via
  `getEntry(relation.collection, relation.id)` with relations keyed `collection:id`.
- **Filtering stays readable** and is type-safe rather than stringly-typed:
  ```ts
  query("faq").where((e) =>
    normalizeReference(e.data.serviceLines).some((r) => r.collection === "roofing"))
  ```
  This is the same idiom `ServiceLayout.astro` and `getRoofingTypes()` already use.
- **Referential integrity is enforced at build time** — a typo'd slug fails the content
  schema instead of silently matching nothing, which a plain string field would not catch.
- It's still a mechanical migration from the old `services: [...]` arrays — same values,
  new field name pointing at two collections instead of one.

> No project in the repo uses the array form of `refSchema` yet, so Koi will be the first —
> but the signature is deliberate, not incidental. A plain `string[]` join key (hydraIV's
> `category` approach) is the fallback if the union ever proves awkward in practice; it trades
> build-time validation for simplicity. Prefer the real reference.

### 4.2 Full collection map

| Old collection | Entries | New collection | Notes |
|---|---|---|---|
| `services` (13) | 2 roots + 11 children | **`roofing` + `solar`** | The split. Roots' page content becomes each collection's `_meta.mdx` body. |
| `types` (6) | flat/metal/shingle/slate roofing; solar panels/batteries | `types` | Re-point refs: 4 → roofing, 2 → solar |
| `projects` (7) | before/after MDX | `projects` | Keep `beforeImage`/`afterImage`. Delete `roofing-project-1 copy.mdx` (dupe). |
| `testimonials` (9) | 1 video + 8 Google reviews | `testimonials` | Keep `video`, `googlereview`, `externalLink`, `rating`. Feeds `buildReviewSchema`. |
| `faq` (14, JSON) | | `faq` | Feeds `buildFaqSchema`. Keep dual roofing+solar refs. |
| `benefits` (6, JSON) | | `benefits` | Icons PNG → `fa6:`/`lu:` |
| `gallery` (17, JSON) | | `gallery` | Marquee |
| `values` (5, JSON) | integrity · reliability · accountability · respect · honor | **`values`** (own collection) | Keeps its own `_meta.mdx` heading ("Our Core Values") + description. `hasPage: false`, `itemsHasPage: false` — display-only, rendered on `/about-us`. |
| `team` (1) | Richard Faria | `team` | |
| `blog` (10) | | `blog` | + `authors` collection (Greastro requires refs) |
| `social-media` (3) | FB/IG/TikTok | `social-media` | Already matches Greastro |
| **`serviceAreas` (577)** | 3 roots + 21 counties + 553 towns | **`service-areas`** | **Ported in full.** Renamed kebab-case so the schema builders find it. Fix the 21 broken `parent: "new-jersey"` refs → `"nj"`. See §5. |
| — | | **`service-tiers`** (new) | Residential/Commercial/Industrial, currently inline on homepage |
| — | | **`contact-us`** (new) | Phone/email/address — **the source of truth** the schema builders read |
| — | | **`menus` + `menu-items`** | Replaces hardcoded menu arrays |
| — | | **`legal`** | Koi's real privacy-policy + cookie-policy, ported verbatim. **No terms-of-service** — Koi has none (§7.7). |

---

## 5. Service areas — ported in full (577 entries)

**Decision: port them.** All 577 entries and their 577 live pages come across, which also means
the schema builders keep working as designed — **no commenting out required** (this supersedes
the earlier "comment out the service-area schema" plan; `businessSchema.ts` and
`serviceSchema.ts` stay intact and `areaServed` populates for real).

### The data is simple — and Greastro-shaped already

`serviceAreas.json` entries carry exactly four fields: `title`, `id`, `parent`, `tags`.
That maps cleanly onto `baseSchema` + `parent` + `tags` with almost no transformation:

```ts
// src/content.config.ts
"service-areas": defineCollection({
  loader: FileLoad("service-areas", "service-areas.json"),
  schema: ({ image }) => baseSchema({ image }).extend({
    abbr: z.string().optional(),   // johns-pro-roofing convention, for "NJ, NY & PA" copy
  }),
}),
```
Note the **rename**: `serviceAreas` → **`service-areas`** (kebab-case), because that is the
collection name the shipped schema builders already query. Renaming the collection is what makes
`businessSchema`/`serviceSchema` work with zero edits — and it changes the URL prefix, see below.

### ⚠️ A real data bug to fix during the port

The existing hierarchy **is broken**, and the old engine hid it:

| Root in the data | id | Children pointing at it |
|---|---|---|
| New Jersey | `nj` | **0** |
| New York City | `nyc` | **0** |
| Eastern Pennsylvania | `east-pa` | **0** |

All **21 NJ counties** declare `parent: "new-jersey"` — **an id that doesn't exist** (the root is
`nj`). So today every county is effectively an orphan, and NYC/PA have no children at all. The
553 municipalities *do* correctly parent to their county, so the tree is "county → town" only,
with the state tier detached.

**Fix:** repoint those 21 counties to `parent: "nj"`. Greastro's `hierarchy.ts` /
`buildTree()` actually walks parents (for breadcrumbs, `children()`, `roots()`), so a dangling
ref that was harmless before now produces a visibly wrong tree. Worth fixing precisely because
the new engine *uses* the hierarchy — but verify the rendered page copy doesn't change.

Also present: one entry (`monmouth-county`) carries a legacy `addToQuery` block injecting
"Monmouth County Residents" into the nav. That becomes `addToMenu` frontmatter (§4.2 menus).

### URL decision — this one needs your call

Legacy URLs are `/serviceAreas/<slug>/` — camelCase, which is why the collection rename matters:

| Option | Result | Cost |
|---|---|---|
| **A. Keep legacy URLs** | Collection named `service-areas` but served at `/serviceAreas/*` | Needs a path override or 577 `redirectFrom` entries; keeps camelCase in URLs (ugly, but zero SEO risk) |
| **B. Move to `/service-areas/*`** | Clean, matches the collection + house style | **577 × 301 redirects** from the legacy paths |

**Recommendation: A — keep `/serviceAreas/*` as the canonical path.** 577 URLs is the single
largest block of indexed pages on the site (96% of it), and they're local-SEO landing pages
whose entire value is accumulated ranking. "Users notice nothing" argues strongly for not
touching them. The camelCase is a cosmetic wart; a mass redirect of the site's whole long tail
is a real risk. *(Option B is defensible if you'd rather take the hit once — your call.)*

### Layout

`LocationLayout.astro` builds each page from the location title — hero, then the shared
homepage bands. In Greastro this becomes `itemsLayout: "@/layouts/collections/LocationLayout.astro"`
with `SecondaryHero` + `ContentRenderer` sections, and the per-location copy interpolated the
same way (`Top-Quality Roofing & Solar Solutions in ${title}`). The old layout also injects
`keywords={[pageTitle, ...tags]}` — carry that into the `seo` block.

Because 577 pages × the homepage band stack is the bulk of the build, this is also the phase to
watch build time (the old site built 604 pages in ~45s, so it's not a concern, just a checkpoint).

---

## 6. URL preservation — the highest-risk area

Two systematic URL changes are introduced by the engine, and both need handling.

### 6.1 Trailing slash (site-wide) — smaller than it looks

- Old Koi: `trailingSlash: true` + `build.format: 'directory'` + a `vercel.json` rule forcing `/path/`. **All 603 live URLs end in `/`.**
- Greastro: `trailingSlash: 'never'`; `SEO.astro:79` strips the trailing slash unconditionally when building the canonical.

**The Greastro redirect system does NOT touch this.** `utils/redirects/` only handles
`/collection/slug` ↔ `/slug` path aliasing (`pathAliasCollector.ts`). Don't expect it to help.

**What the setting actually changes — verified by diffing both builds:**

1. **Nothing on disk.** Both configs emit the *identical* `dist/about-us/index.html` directory
   structure. `trailingSlash` is not a build-output setting.
2. **Internal link generation.** Old Koi emits **both** forms on the same page
   (`href="/about-us"` *and* `href="/about-us/"`, same for the service links) — it was already
   inconsistent and leaned on the Vercel 301 to normalize. Greastro emits one form: `/about-us`.
3. **The canonical tag + sitemap + SEO manifest**, which all follow `canonicalPath`.

**Consequence of leaving `'never'` alone:** `/about-us/` still resolves — Vercel maps it to
`about-us/index.html` and 308s to `/about-us`. **No 404s.** Every legacy inbound link, bookmark
and backlink keeps working; canonicals, sitemap and internal links agree on one form; Google
follows the redirect and consolidates. This is exactly what `johns-pro-roofing`, `hydraIV`, and
`certified-bag-chasers` all do — **none of them sets `trailingSlash` in `vercel.json` at all.**

**Recommendation: keep `trailingSlash: 'never'`.** Don't fight the template. *(Revised from an
earlier draft of this plan, which treated it as riskier — the build-output comparison is what
settles it.)* The only genuine cost is that 603 URLs currently canonicalize *with* the slash, so
Google has to re-process them onto the non-slash form: normal consolidation, a few weeks of
Search Console churn, no penalty.

Do make the behavior **explicit rather than inherited** — add to `vercel.json` so the host
matches the Astro config instead of relying on a platform default:
```json
{ "trailingSlash": false }
```

> **If you want zero SEO churn instead:** `trailingSlash: 'always'` in `astro.config.mjs` +
> `"trailingSlash": true` in `vercel.json` keeps the legacy URLs canonical exactly as they are.
> The cost is divergence from every other Greastro site, which matters in a shared-conventions
> codebase. Defensible, but the churn is the cheaper price.

### 6.2 Service URLs
Old: `/services/roofing/` and `/services/solar/` (the **only** two service pages that exist live — the 11 children have `itemsHasPage: false` and no URLs).

With the split into `roofing`/`solar` collections, the natural Greastro URLs become `/roofing` and `/solar`. So:
```yaml
# src/content/roofing/_meta.mdx
redirectFrom: "/services/roofing"
# src/content/solar/_meta.mdx
redirectFrom: "/services/solar"
```

### 6.3 Complete legacy URL inventory to preserve (26 core + 577 service areas = 603)
`/` · `/about-us/` · `/blog/` + **10 posts** · `/careers/` · `/contact-us/` · `/cookie-policy/` · `/privacy-policy/` · `/internship-program/` · `/services/roofing/` · `/services/solar/` · and **6 Monmouth County landing pages**: `/roofing-monmouth-county/`, `/commercial-roofing-monmouth-county/`, `/residential-roofing-monmouth-county/`, `/metal-roofing-monmouth-county/`, `/roofing-shingles-monmouth-county/`, `/solar-power-installation-monmouth-county/`

Plus all **577** `/serviceAreas/<slug>/` pages (§5), which stay at their legacy paths.

> A build-time check should diff the new sitemap against this list so nothing silently disappears. Expect **603 pages**, matching the old build's 604 (which counted the sitemap itself).

### 6.4 The Monmouth landing pages
See §9 — these get their own section, along with the blog and the remaining static pages.

---

## 7. Third parties, env vars & security headers

### 7.1 Sanctioned third parties & endpoints (the allowlist for this project)

> ## 🔒 Tracker parity is non-negotiable
>
> **Every tracker on the new site must be identical to the old site — same IDs, same count,
> nothing consolidated, nothing dropped, nothing added.** The architecture around them changes
> (env vars instead of hardcoded strings, a Greastro integration instead of pasted `<script>`
> blocks); **the tags themselves do not.**
>
> This is deliberately *not* an optimization opportunity. Consolidating a duplicate GA4 property
> or Pixel would break historical continuity in reporting, orphan any audience or conversion
> built on that ID, and silently change data the business depends on. **Preserve all of it.**

**Verified against the old site's built `dist/index.html`** — this is the complete list, ground
truth rather than a reading of the source:

| # | Service | ID | How it loads today | Location |
|---|---|---|---|---|
| 1 | GA4 | `G-MFDQM6J7VE` | `type="text/partytown"` **(off main thread)** | head |
| 2 | GA4 | `G-7S1TEFL7YE` | plain `<script async>` | head |
| 3 | GTM | `GTM-5QV9L2ZC` | inline loader **+** noscript iframe | head + body |
| 4 | GTM | `GTM-MHMZXZW2` | **noscript iframe ONLY — no head loader** | body |
| 5 | Meta Pixel | `1599711647766029` | `fbq('init', …)`, `is:inline` | head |
| 6 | Meta Pixel | `1689278455447883` | second `fbq('init', …)`, same block | head |
| 7 | Microsoft Clarity | `ukrfopzgqf` | inline IIFE | head |
| 8 | LeadConnector chat | `6a0c691e6e838e289f5df2e5` | `widgets.leadconnectorhq.com/loader.js`, `is:inline` | body |
| 9 | Google site verification | `5l36yHMAKLrNxTyWuc5cUqlWONqugF0PtNlYQ8FGej4` | `<meta>` | head |
| 10 | Formspree | 6 form IDs (§7.3) | `fetch()` POST | runtime |

**Three load-mechanism details that must survive the port** — these are easy to normalize away
by accident:

1. **`G-MFDQM6J7VE` runs through Partytown; `G-7S1TEFL7YE` does not.** Different threads, so
   different timing behavior. Keep partytown on the one that has it — `@astrojs/partytown` is
   already in the stack via `conditionalPartytown()`.
2. **`GTM-MHMZXZW2` exists *only* as a `<noscript>` iframe.** There is no `gtm.js` loader for it
   anywhere in `src/` (verified by grep — one single occurrence). Whether that's intentional or a
   half-removed container, **reproduce it exactly as-is.** Do not "fix" it by adding the missing
   head loader — that would start sending data to a container that receives none today.
3. **Both Meta Pixels share one `fbq` block**, with two `init` calls and a single
   `fbq('track','PageView')`, plus **two** matching `<noscript>` tracking pixels.

**Action — architecture only:**
- Move all 10 IDs out of hardcoded strings into `PUBLIC_*` env vars (§7.3), so they're
  configurable rather than buried in markup.
- Route GTM through `integrations/analytics/GoogleTagManager.astro`, extended to accept **two**
  container IDs (it currently reads a single `PUBLIC_GTM_ID`).
- Keep GA4, Meta Pixel, Clarity, and LeadConnector in `IntHeadScripts`/`IntBodyScripts` — the
  purpose-built injection points, instead of a hand-edited `HeadTags.astro`.
- **These must load as plain `<script>` tags, not `type="text/plain" data-consent="…"`** — with
  consent disabled (§7.6) nothing would ever unblock them.

**Phase 9 gate is a diff, not a vibe check:** enumerate every tracker ID in the new
`dist/index.html` and assert the set is **exactly equal** to the old build's. Same 10, no more,
no fewer. Then confirm each fires in the network tab.

### 7.2 CSP must be extended — per directive, per tracker

`vercel.json` ships `default-src 'none'`. **As-is, all 10 trackers are blocked.** Follow the
per-project convention (hydraIV adds `https://intakeq.com`; johns adds only Google Translate):
add exactly the hosts these trackers need, and nothing more.

| Directive | Hosts to add | Needed by |
|---|---|---|
| `script-src` | `www.googletagmanager.com`, `www.google-analytics.com`, `connect.facebook.net`, `www.clarity.ms`, `widgets.leadconnectorhq.com` | GA4 ×2, GTM ×2, Pixel ×2, Clarity, LeadConnector |
| `img-src` | `www.google-analytics.com`, `www.facebook.com` | GA4 pixel beacons; the **two** Pixel `<noscript>` images |
| `connect-src` | `www.google-analytics.com`, `*.google-analytics.com`, `www.clarity.ms`, `*.clarity.ms`, `widgets.leadconnectorhq.com` | GA4/Clarity beacons; chat websocket |
| `frame-src` | `www.googletagmanager.com`, `widgets.leadconnectorhq.com` | **both** GTM `<noscript>` iframes; chat iframe |
| `worker-src` | already `'self' blob:` — **verify unchanged** | **Partytown** runs `G-MFDQM6J7VE` in a worker |
| `style-src` | *(none)* | — |

Two things the naive host list misses:
- **Partytown needs `worker-src 'self' blob:`** (already present, and there's a dedicated relaxed
  CSP block for `/~partytown/*`). Since `G-MFDQM6J7VE` loads via partytown (§7.1), that block
  must survive — don't prune it while "cleaning up" the Google Translate entries (§7.6).
- **`frame-src` is required for the GTM noscript iframes**, including `GTM-MHMZXZW2` which exists
  *only* as an iframe. Omit it and the one container that's noscript-only breaks entirely.

Net effect combined with §7.6: six directives *lose* their Google-Translate hosts while these are
added — roughly a wash in surface area, and a strictly more honest policy.

### 7.3 Env vars — port, don't invent
Old Koi (6 form vars, own naming) vs Greastro (3, `PUBLIC_FORMSPREE_*`):

| Old Koi | Greastro target |
|---|---|
| `PUBLIC_CONTACT_FORM` | `PUBLIC_FORMSPREE_CONTACT_ID` |
| `PUBLIC_QUOTE_FORM` | `PUBLIC_FORMSPREE_QUOTE_ID` |
| `PUBLIC_ROOFING_FORM` | `PUBLIC_FORMSPREE_ROOFING_ID` (new) |
| `PUBLIC_SOLAR_FORM` | `PUBLIC_FORMSPREE_SOLAR_ID` (new) |
| `PUBLIC_HIRING_FORM` | `PUBLIC_FORMSPREE_HIRING_ID` (new) |
| `PUBLIC_INTERNSHIP_FORM` | `PUBLIC_FORMSPREE_INTERNSHIP_ID` (new) |
| `PUBLIC_SITE_DOMAIN` | → `src/content/siteDomain.js` (`SITE_DOMAIN`) |
| — | `PUBLIC_GTM_ID` + `PUBLIC_GTM_ID_2` (both containers) |
| *(hardcoded)* | `PUBLIC_GA4_ID`, `PUBLIC_GA4_ID_2` |
| *(hardcoded)* | `PUBLIC_META_PIXEL_ID`, `PUBLIC_META_PIXEL_ID_2` |
| *(hardcoded)* | `PUBLIC_CLARITY_ID` |
| *(hardcoded)* | `PUBLIC_LEADCONNECTOR_WIDGET_ID` |
| *(hardcoded)* | `PUBLIC_GOOGLE_SITE_VERIFICATION` |

**The actual ID values must be carried over verbatim** from the live deployment's env (they are not in the repo — `.env` is gitignored and absent). Every new var must be added to `env.d.ts` and `.env`. All 4 Koi forms fall back to the contact ID, so preserve that fallback chain.

> The old build also **fails without `PUBLIC_SITE_DOMAIN`** (interpolated into `site:`). Greastro fixes this by hardcoding the domain in `siteDomain.js` — set it to `koiroofingandsolar.com`.

### 7.4 siteData — three exports (the johns-pro-roofing pattern)
```ts
export const siteData = {
  title: "Koi Roofing and Solar",
  legalName: "Koi Solar Corp.",          // from old SiteData.businessName
  tagline: "Some start at the bottom we go to the top",
  description: "Koi Roofing & Solar is a family-run, full-service contractor…",
  domain: SITE_DOMAIN, url: SITE_URL,
  location: "New Jersey, USA",
  businessType: "RoofingContractor",     // ← drives the whole schema graph
  googleReviewsUrl: "…",                 // from old ContactData.googleReviewsUrl
};

// Reused facts — interpolate these into MDX copy, never retype them.
export const businessData = {
  warranty: "50-year warranty",
  financing: "$0 down financing, flexible for all credit types",
  experience: "20+ years across three generations",
  ownership: "veteran-owned",
};

export const ctaData = { text: "Request Estimate", link: "/contact-us" };
```
`businessData` is the fix for Koi's most-repeated copy — "50-year warranties", "$0 down",
"20+ years", "veteran-owned" are currently retyped across the homepage, service pages, and
all 6 Monmouth landing pages.
Contact facts (phone `848-315-8038`, email `customersupport@koiroofingandsolar.com`, address `30 Union Pl, Unit 234, Elizabeth, NJ 07202`) go into **`contact-us.json`** with structured `streetAddress`/`addressLocality`/`addressRegion`/`postalCode`/`addressCountry` + `phoneCountryCode` — that's what `businessSchema` reads. Business hours (Everyday 8AM–8PM) need a home too (`openingHoursSpecification` in the old JSON-LD).

---

## 7.5 House conventions confirmed across all reference sites

Verified consistent across `johns-pro-roofing`, `hydraIV`, and `certified-bag-chasers` — these
are the real house style, not one-offs. Follow them without re-deciding:

1. **Every collection has `_meta.mdx` with `hasPage` *and* `itemsHasPage` always explicit**, even when `false`. Display-only collections are 4–6 lines.
2. **Loaders:** `FileLoad("x","x.json")` for flat data, `GlobLoad("x")` for MDX dirs. Every schema is `({ image }) => baseSchema({ image }).extend({…})`.
3. **New display style = new `<Name>Variant.astro`** in `ContentRenderer/variants/` — auto-discovered by `getVariantComponents()`, so **never edit `ContentRenderer.astro`** to add one. New card = new LoopComponent. Naming: `<Domain><Thing>Card.astro` / `<Domain><Thing>Variant.astro`.
4. **Homepage shape:** `BaseLayout` → `<main class="flex-1">` → hero → an ordered `ContentRenderer` stack, each preceded by an HTML comment naming it, each using `.orderBy(sortByOrder())`. Section copy (`eyebrow`/`title`/`description`) is passed as **props**, not stored in `_meta.mdx`.
5. **Heroes are edited in place — never wrapped or duplicated.** Brand defaults go in the destructuring defaults; the Greastro `Props` interface survives. Per-page variation flows `_meta.mdx` → `metaSchema` extension → index layout → hero props. *(`FrontPageHeroWide` in CBC is called out as drift — don't imitate it.)*
6. **`@theme`:** set only `--color-primary` / `--color-accent` literals + neutrals + fonts. **Leave the `oklch(from …)` 50–950 ladders untouched.** Annotate contrast decisions in comments. Self-host fonts via `@fontsource` (hydraIV's approach) rather than remote Google Fonts.
7. **Env:** `PUBLIC_*` only, zero secrets. One `PUBLIC_FORMSPREE_<FORM>_ID` per form. **Delete unused integration dirs and vars** rather than stubbing them.
8. **`llms: { addToLLMs: false, itemsAddToLLMs: false }`** on the infrastructure collections — `menus`, `menu-items`, `social-media`, `authors`, `legal`. **`robotsLlmsIntegration()` takes no arguments** in every project; llms.txt is configured through content + `siteData.tagline`/`location`, which are load-bearing.
9. **`legal`** uses `itemsRootPath: true` + `itemsLayout: "@/layouts/collections/LegalLayout.astro"`. **`redirectFrom`** aliases are standard: `["/contact","/contactus"]` on contact-us, `["/about","/aboutus"]` on about-us.
10. **`siteData` + `ctaData` twin export**; the site's single money-destination URL lives on `siteData` and `ctaData.link` references it. Never inline a URL in a component.
11. **Unique dev `server.port` per project** (greastro 9090, hydraIV 1808, johns 5757, CBC 6543) → **pick a free port for Koi** (e.g. `5700`, matching the old Koi dev port).
12. **`seo: { robots: "noindex, nofollow" }`** on `_meta.mdx` is the idiom for parking an unfinished section — and it *also* removes it from llms.txt.

> **Both hydraIV and CBC are behind current spec** in three ways that Koi must NOT replicate:
> no `AGENTS.md`/allowlist, no `siteData.businessType`, and no `src/utils/schema/*` builders
> (they still hand-build a single inline JSON-LD blob in `SEO.astro`). Koi starts from the
> current template, so it gets all three correctly from day one. hydraIV also still ships
> `siteLogo` pointing at `astro.svg` — a real bug (wrong schema logo + wrong OG image) that
> Phase 1 must avoid.

---

## 7.6 Preferences system — all three UIs commented out

**Decision: cookie consent, the language switcher, and the accessibility modal all stay off.**
The old Koi site ships **none** of them. Every one would be a user-visible addition, which is
exactly what this port is meant to avoid. Comment out, **never delete** — so any of the three
can be restored by uncommenting.

The rationale differs per subsystem, and so does the fallout:

| Subsystem | Why off | Fallout |
|---|---|---|
| **Cookie consent** | NJ business, no EU/UK audience; legacy site has no banner | ⚠️ **It's also the tracker gate** — see below |
| **Language switcher** | Legacy site is English-only, no switcher | Frees 6 CSP directives (below) |
| **Accessibility modal** | Legacy site has no panel | None — but see the `AGENTS.md` note |

> **On the accessibility panel and `AGENTS.md`.** The root ruleset says *"Keep it on by default;
> don't strip it from projects."* Turning it off here is a **deliberate, user-instructed override
> of a template default**, not drift — and it's why this stays commented rather than deleted.
> Worth recording in the project `AGENTS.md` so a future session doesn't "helpfully" re-enable it.
> Note also what the same rule says: the panel is *"a bonus on top"* and **"the thing that
> actually matters for compliance is the underlying markup"** — semantic HTML, alt text, keyboard
> nav, contrast, focus states. **None of that changes.** Greastro's markup-level accessibility
> is untouched; only the user-facing preferences toolbar is hidden.

### There are THREE mount points, not one

Easy to miss — the UI buttons and the head/body scripts are wired separately:

**1. `src/layouts/PreferencesLayout.astro`** — the visible UI:
```astro
{/* Preferences UI intentionally disabled — the legacy Koi site shipped no
    cookie banner, language switcher, or accessibility panel, and adding any
    of them would be a user-visible change. Uncomment to restore.
    NOTE: re-enabling ConsentScript is required if the analytics tags are ever
    switched back to `type="text/plain" data-consent="…"` gating. */}
{/* <ConsentScript /> */}
{/* <CookieConsentBanner client:idle /> */}
{/* <BrowserTranslateScript enableNative={true} enableGoogle={true} /> */}
```
…and inside the buttons row: `<LanguageSwitcher />`, `<AccessibilityButton />`, the
`CookiePreferencesButton`, and the "Do Not Sell My Personal Information" link. Since
`Footer.astro` calls `<PreferencesLayout showButtons={false} />`, that row is already hidden —
but comment the contents anyway so the intent is explicit rather than incidental.

**2. `src/integrations/IntHeadScripts.astro`** — `<ConsentScript />`, `<AccessibilityScript />`,
`<LanguageDetectionScript />`. The a11y one is a no-op once nothing can save prefs (it
early-returns when `user-a11y-prefs` is absent), but comment it out so no dead inline script
ships in `<head>` on all 603 pages.

**3. `src/integrations/IntBodyScripts.astro`** — `<TranslationLoader />`.

Also: **comment out** `<CookiePreferencesButton />` in the Footer's Legal column, and drop the
two now-unused `@import`s from `global.css` (`language-switcher.css`, `accessibility.css`) —
the stylesheets stay on disk, only the imports go, so restoring is one line each. Keep the
**CCPA anchor in the privacy policy** — that copy is Koi's own (§7.7). `public/a11y-init.js`
is genuinely dead (referenced nowhere, orphaned in the template itself) and can be removed.

**Nothing under `src/integrations/preferences/` is deleted** — see §7.8.

### Bonus: the CSP gets meaningfully tighter

Six directives in `vercel.json` exist **only** for Google Translate. With the switcher off they
lose those hosts:
```
script-src   … translate.google.com translate.googleapis.com translate-pa.googleapis.com
style-src    … translate.googleapis.com www.gstatic.com
img-src      … translate.google.com translate.googleapis.com www.gstatic.com
connect-src  … translate.googleapis.com translate-pa.googleapis.com
frame-src    … translate.google.com translate.googleapis.com
font-src     … fonts.gstatic.com   ← only if fonts are self-hosted via @fontsource (they are)
```
That offsets the hosts Koi's own trackers add (§7.2) — a genuine security improvement rather
than a wash.

> ⚠️ **Load-bearing side effect — do not miss this.** Greastro's consent system is also the
> **script gate**. `GoogleTagManager.astro` ships its GTM tag as
> `<script type="text/plain" data-consent="performance">`, and `scriptManager.ts` is what
> rewrites those to live `<script>` tags once consent is granted. **With `ConsentScript`
> commented out, nothing ever unblocks them and all analytics silently dies.**
>
> So disabling consent means the third-party tags must load **directly** (the way they do on
> the old Koi site today): plain `<script>` in `IntHeadScripts`/`IntBodyScripts`, no
> `type="text/plain"`, no `data-consent` attribute. This supersedes the "gate the marketing
> tags behind consent categories" note in §7.1 — **§7.6 wins.** Verify after Phase 9 that GTM
> / GA / Meta Pixel / Clarity actually fire in the network tab, not just that the build passes.

> ⚠️ **Load-bearing side effect — do not miss this.** Greastro's consent system is also the
> **script gate**. `GoogleTagManager.astro` ships its GTM tag as
> `<script type="text/plain" data-consent="performance">`, and `scriptManager.ts` is what
> rewrites those to live `<script>` tags once consent is granted. **With `ConsentScript`
> commented out, nothing ever unblocks them and all analytics silently dies.**
>
> So disabling consent means the third-party tags must load **directly** (the way they do on
**SMS consent stays.** The per-form SMS/TCPA consent checkbox (`SmsConsent.astro` in the old
site, present in all 6 Koi forms) is a *different* thing from cookie consent and is a legal
requirement for texting leads. It ports over untouched.

---

## 7.7 Legal documents — port Koi's exactly, discard Greastro's

**Greastro's starter legal content is placeholder and must not survive.** Delete
`privacy-policy.mdx`, `cookie-policy.mdx`, and `terms-of-service.mdx` from
`src/content/legal/` and replace them with Koi's real documents, ported **verbatim**.

| Koi source | Size | Port to | Notes |
|---|---|---|---|
| `src/pages/privacy-policy.astro` | 13.5 KB / 195 lines | `src/content/legal/privacy-policy.mdx` | Real client copy. **Effective date: May 5, 2026** — preserve it; don't restamp to today. |
| `src/pages/cookie-policy.astro` | 4.3 KB / 131 lines | `src/content/legal/cookie-policy.mdx` | 8 sections: What Are Cookies · How We Use · Types · Managing · **Detected Cookies** · Your Rights & Consent · Contact |
| — | — | ~~`terms-of-service.mdx`~~ | **Koi has none.** Don't invent one and don't leave Greastro's. |

**Porting rules:**
- **Copy is untouchable** — every clause, heading, and definition transfers word-for-word. This is client legal text, not marketing copy to be rewritten or "improved".
- **Keep the dynamic bindings.** Both docs interpolate `SiteData.title`, `ContactData.email`,
  `ContactData.phone` (via `formatPhoneNumber`), `ContactData.address`, and
  `ContactData.googleMapsUrl`. Re-point these at `siteData` + the `contact-us` collection so
  the contact block stays a single source of truth rather than being frozen as literals.
- **`IntegrationsSnippet.astro`** — the privacy policy renders a live list of integration
  providers by scanning `PUBLIC_INTEGRATION_*` env keys. Either port the component and its env
  vars, or (cleaner) replace it with a static list matching the §7.1 allowlist. Either way the
  rendered output must still name the real providers.
- The **"Detected Cookies"** section in the cookie policy describes actual cookies set. With
  consent disabled (§7.6) re-verify that section still matches reality.
- Route both through `itemsRootPath: true` + `LegalLayout` so the URLs stay
  `/privacy-policy` and `/cookie-policy` (§6.1 trailing-slash rule applies).
- Koi's own `.policy-page` heading/link styling should be carried into `legal.css` so the
  documents look identical, not merely contain the same words.

---

## 7.8 Light mode only — and why nothing gets deleted

**Decision: light mode only. Keep every mechanism in the codebase.**

The governing principle for §7.6 and this section alike: **disabled ≠ removed.** These
subsystems are switched off because they aren't useful *right now* — not because they're
unwanted. Anything ripped out has to be rebuilt from the template later; anything commented
out is a one-line restore.

### Dark mode is already inert — there is nothing to disable

Verified in the scaffolded project:

| Mechanism | State | Consequence |
|---|---|---|
| `hooks/theme/UseMode.ts` | exists, **called by nothing** | no toggle is mounted anywhere |
| `data-theme` attribute | **never written** — no inline bootstrap sets it | the root element stays unstamped |
| `global.css` / `system.css` | **zero** `[data-theme]` or `prefers-color-scheme` blocks | no CSS reacts to a theme |
| `hooks/useAccentColor.ts` | exists, **called by nothing** | no accent override |

So the site already renders light-only. `UseMode` does default to `"dark"` internally — but
since nothing mounts it and no CSS responds, that default never reaches the page.

**Action: none.** Don't add a toggle, don't author a dark palette, don't delete the hooks.
Port Koi's `@theme` tokens (§3) and the site is light-only by construction. Worth a note in the
project `AGENTS.md` so nobody "finishes" dark mode later thinking it was half-built.

### What stays in the codebase, dormant

Keep all of it — commented at the mount point, intact underneath:
- `integrations/preferences/accessibility/` — the full panel: hook, modal, button, script, CSS
- `integrations/preferences/language/` — switcher, detection, translate loader, CSS
- `integrations/preferences/consent/` — banner, script manager, CCPA components
- `hooks/theme/UseMode.ts`, `hooks/useAccentColor.ts`

**The restore path for any of them is: uncomment the mount point** (plus, for consent, re-gate
the analytics tags — §7.6). That's why each commented block carries a note saying what to
re-enable and what else it depends on.

> **Two exceptions that genuinely go**, because they're dead rather than dormant:
> `public/a11y-init.js` (referenced nowhere, already orphaned in the template) and the two
> `@import`s in `global.css` for `language-switcher.css` / `accessibility.css` — those ship CSS
> for hidden UI on all 603 pages. The stylesheets themselves stay on disk; only the imports go,
> so restoring means re-adding one line.

---

## 7.9 No animations — a deliberate visual departure

> ### ⛔ SUPERSEDED — animations are ON as of 2026-08-24
> The user asked for view animations back, using the same library and methodology as
> FariasDemolition and certified-bag-chasers. The two `Theme.astro` imports below are
> **uncommented**, and `data-animate` is wired into the shared components
> (`SectionHeading` + `LoopComponents/*Card`) rather than into page markup.
> **See the "Scroll animations — ON" section of `AGENTS.md` for the current rules**,
> including the three contexts that must never be animated (marquee tracks, the
> before/after carousel, the paginated blog feed).
> The rest of this section is kept as the record of the original decision.

**Decision: motion is dropped entirely.** The old animation library isn't used going forward, so
its classes are **stripped during migration, not translated**. This is the one place the port
knowingly changes what a user perceives — recorded here so it reads as a decision, not an
oversight.

### What's being given up

The old site uses animation classes **196 times**:

| Class | Uses | Where |
|---|---|---|
| `scale-up` | 58 | section headings on scroll |
| `slide-up` | 45 | headings, descriptions |
| `slide-down` | 34 | eyebrows, sub-headings |
| `load-fade-in` | 16 | hero subhead, rating, social rail |
| `slide-in` | 11 | the italic tagline quote |
| `load-slide-down` / `load-slide-up` | 10 each | hero eyebrow / H1 |
| `animate-on-appear` | 8 | `media*` section wrappers |
| `load-slide-left` / `-right` | 2 each | the Roofing/Solar hero buttons |

So the hero currently animates in on load and section headings scale up on scroll. After the
port, everything renders statically. **Accepted cost.**

### How to switch it off (and why it's one line, not a purge)

Greastro's system is **always-on**, not opt-in — `Theme.astro` imports it in two places:
```astro
// src/layouts/Theme.astro:17
import "../integrations/scroll-animations/styles/animations.css";
// src/layouts/Theme.astro:55  (inside the client script)
import "@/integrations/scroll-animations/observer";
```
**Comment both out** — consistent with §7.8's *disabled ≠ removed* principle. Keep
`src/integrations/scroll-animations/` on disk; restoring motion later is uncommenting two lines,
not rebuilding a system.

**Do not carry the old class names over "inertly."** 196 dead class strings in content and markup
would be exactly the kind of drift the project `AGENTS.md` audit is meant to catch, and a future
session would reasonably try to make them work. Strip them in **Phase 2** as part of content
migration.

### Two things verified, so this doesn't break anything

- **Nothing else imports the animation system.** Grepped: no component, layout or page references
  `scroll-animations`, `cssAnimationProps`, or the observer outside `Theme.astro` and the
  integration's own directory.
- **`components/Video/lazyVideoScrollAnimationPlugin.ts` registers into the observer** — which
  looked like a real dependency for a video-heavy site. It is **never imported anywhere**, so it's
  already dormant and video lazy-loading does not depend on it. Leave it on disk; note it in the
  project `AGENTS.md` as dormant so nobody wires it up expecting animations to exist.

### Consequences worth knowing

- **Phase 4 gets simpler** — no motion tuning, no reduced-motion QA, no scroll-timeline browser
  matrix (the CSS-only path needs Chrome 115+/Safari 17.5+ and silently no-ops elsewhere).
- **Slightly faster pages** — one less stylesheet and one less client script.
- **`prefers-reduced-motion` becomes moot**, since there's no motion to reduce. The
  media query in `animations.css` goes dormant with the rest.
- **The Phase 3.5 text-diff gets cleaner**, since animation classes never appear in text output
  anyway — but the Phase 10 *screenshot* diff will now show static-vs-animated differences on the
  homepage hero. **Expected; not a regression.** Compare final rendered state, not motion.

---

## 7.10 Gap audit — Koi features with no Greastro home

Ran a systematic diff of the two codebases looking for Koi functionality the plan hadn't
assigned anywhere. Most apparent gaps were false positives (old-engine components already
superseded, or renamed equivalents). **Two are real** and would have been missed.

### ⚠️ Gap 1 — `buildBusinessSchema` emits 7 fewer fields than the old JSON-LD

The old hand-pasted `RoofingContractor` blob carries **15** top-level properties. Greastro's
builder emits **8**. Deleting the hand-pasted JSON-LD (§7.1, Phase 9) without extending the
builder would be a **silent SEO regression** — exactly the kind this port is supposed to prevent.

| Field | Greastro | Old Koi value |
|---|---|---|
| `name` `description` `url` `telephone` `logo` `image` `address` `areaServed` | ✅ | — |
| **`email`** | ❌ | `customersupport@koiroofingandsolar.com` |
| **`openingHoursSpecification`** | ❌ | All 7 days, `08:00`–`20:00` |
| **`priceRange`** | ❌ | `"$"` |
| **`paymentAccepted`** | ❌ | `["Cash","Credit Card","Check"]` |
| **`makesOffer`** | ❌ | `Service: Roofing`, `Service: Solar` |
| **`keywords`** | ❌ | 10 local-SEO terms |
| **`aggregateRating`** | ⚠️ partial | `5.0` / `34` reviews |

On `aggregateRating` specifically: `buildReviewSchema` *does* emit it, but **only on pages that
render testimonials**, and computed from the entries present. The old site asserted `5.0 / 34`
site-wide from the homepage. Decide deliberately — derive it from the 9 testimonials (honest,
lower count) or carry the Google-profile figure. **Deriving is the defensible choice**, but it
changes a number Google currently sees, so it's a call, not a detail.

**Fix in Phase 1**, so the schema is complete before Phase 9 deletes the old blobs:
- Extend `businessSchema.ts` with the 6 missing static fields, sourced from `siteData`/
  `businessData`/`contact-us` — **not hardcoded in the builder** (that's the whole point of §7.4).
- `email` comes from the `contact-us` email entry, alongside how `telephone` already works.
- `openingHoursSpecification` reads the **`businessHours` array on `siteData`** (Gap 2 — resolved).
  Wiring it in is deferred for your review (§10); the data itself lands in Phase 1.
- `makesOffer` should be **derived** from the `roofing` + `solar` collections, so adding a line of
  business updates the schema for free.

### ✅ Gap 2 — business hours: a `businessHours` array on `siteData` *(resolved)*

`ContactData.businessHours` (`{ days: "Everyday", hours: "8AM - 8PM" }`) is used in **two** places
on the old site, and the earlier collection map assigned it to neither:
1. Rendered in the **footer** (`Footer.astro:119`) as `"Everyday: 8AM - 8PM"`
2. The `openingHoursSpecification` in the homepage JSON-LD (Gap 1)

**Decision: a separate `businessHours` array in `siteData.ts`.** An array rather than the old flat
object, so per-day variation is expressible later without a refactor:

```ts
// src/content/siteData.ts — fourth export, alongside siteData/businessData/ctaData
export const businessHours = [
  {
    days: "Everyday",                    // display label, footer
    hours: "8AM - 8PM",                  // display value, footer
    dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
    opens: "08:00",                      // 24h, schema.org
    closes: "20:00",
  },
];
```

Each entry carries **both** representations: the human strings the footer prints verbatim, and the
structured `dayOfWeek`/`opens`/`closes` that `openingHoursSpecification` needs — so neither
consumer has to parse the other's format. One array entry today; splitting into
weekday/weekend rows later is additive.

> **`BusinessHoursItem.astro`** — the old non-clickable menu row for hours — is **not** ported.
> Menus are handled by `addToMenu`/`itemsAddToMenu`, and hours aren't a menu item in the new model.
> The *data* was the gap, not the component.

**Schema wiring is deferred** (your call to review later): the `businessHours` array lands in
Phase 1 so the footer has its data and nothing is lost, and hooking it into
`openingHoursSpecification` is part of the Gap 1 schema work you'll look at separately. Noted in
§10 as an open item rather than silently done.

### Verified as *not* gaps

- **Menus** — fully covered by `addToMenu`/`itemsAddToMenu`; the old `NavMenu`/`SubMenu`/
  `HamburgerMenu*` components are the old engine, superseded by `MenuVariant` + the drawer.
- **Video** — greastro's `Video.astro` already does build-time ffmpeg posters + lazy loading, so
  `DeferredVideo`/`VideoShell` add nothing new.
- **Sliders/carousels** — `Carousel.jsx`/`ClientItemsTemplate.jsx` are old-engine; the Koi
  `slider:` config on `projects`/`gallery` is covered by `BeforeAfterVariant`'s carousel and
  `GalleryMarquee`.
- **`SpanishSection`** — already in the plan (Phase 3.9, port as a static section).
- **Forms** — all 6 accounted for (§7.3); `SmsConsent` ports untouched (§7.6).
- **`IntegrationsSnippet`** — covered in §7.7.
- **`404`** — greastro ships one; restyle only.
- **`GoogleRating` / `SocialMedia`** — in the reuse manifest (§3.9).

---

## 8. Execution phases

Each phase ends with a green `npm run build`. **Three blocks, two hard gates:**

| Block | Phases | Produces | Gate |
|---|---|---|---|
| **1. Content & architecture** | 0 – 3.5 | every collection, entry, page and URL; all content verified against the old site | ⛔ **Content gate** |
| **2. Design structure** | 3.9 | every component/variant/layout **decided, named and stubbed** — no styling | ⛔ **Design gate** |
| **3. Styling & layout** | 4 – 10 | the actual look | ship |

The ordering is deliberate: **the look is the hardest, most iterative part**, so it goes last and
it goes in with every structural question already answered. Content is settled before structure;
structure is settled before style. Neither of the first two blocks writes a single line of CSS.

### Block 1 — content & architecture (0–3.5), no UI work whatsoever

**The rule: the entire architectural layer is finished, building, and verified before one line
of styling or layout is written.** "Architecture" here means every non-visual system in the
codebase, not just the content:

| Layer | Files | Settled in |
|---|---|---|
| **Collection registry & schema** | `content.config.ts`, `content/schema.ts` | Phase 1 |
| **Site facts** | `siteData.ts`, `siteDomain.js`, `contact-us.json` | Phase 1 |
| **Loaders** | `utils/loaders/loaderUtils.ts` (`GlobLoad`/`FileLoad`), `MenuItemsLoader.ts` | Phase 1 |
| **Filesystem scanner** | `utils/filesystem/contentScanner.ts` — **needs a patch, §8.5** | Phase 1 |
| **Query layer** | `utils/query/*` — filters, sorting, relations, hierarchy, snippets | Phase 1 (verified), Phase 3 (exercised) |
| **Page generation** | `utils/pages/*` — `pageRules`, `pageGeneration`, pagination | Phase 2 |
| **Entry preparation** | `utils/collections/prepare.ts`, `meta.ts`, `ContentBridge.astro` | Phase 2 |
| **Menus** | `menus`/`menu-items` collections, `menuQueries.ts`, `idRegistry.ts` | Phase 2 |
| **Redirects** | `utils/redirects/*` — collector, path aliases, validation | Phase 2 |
| **Content** | all 13 collections, every entry | Phases 2–3 |
| **Page wiring & content parity** | every page via starter variants + text-diff | Phase 3.5 |
| **Component/layout manifest** | which variants, cards, layouts exist — stubs + props | Phase 3.9 |
| **Asset & media decisions** | image folders, `.mov` policy, icon tokens, posters | Phase 3.9 |
| **Hierarchy** | `parent` refs, `buildTree`, breadcrumbs | Phase 3 |
| **Cross-references** | `serviceLines` via `refSchema(["roofing","solar"])` | Phase 3 |
| **SEO/schema/llms plumbing** | `SEO.astro` manifest, `utils/schema/*`, `robots-llms` | Phase 3 (wired + asserted) |
| **Env & third-party config** | `.env`, `env.d.ts`, CSP, integration on/off switches | Phase 1 |

Everything above is **structure and data**. Nothing above requires a decision about how
anything *looks*. The site renders as unstyled Greastro through the end of **Phase 3.5** — that's
the intended state, not an unfinished one.

**Phase 3.5 adds the payoff step:** every page wired with *existing* starter variants, then
content-diffed against the old site — so "is the content right?" is answered and signed off
before "does it look right?" is even asked.

**Why this ordering is load-bearing, not stylistic:**
- The UI is built against **real** data — real string lengths, real image ratios, the 577-entry
  tree, the dual roofing+solar refs. No "worked with the placeholder, broke with the real thing."
- **Schema and URL shape get settled while they're cheap.** Changing `serviceLines` in Phase 3
  is a ten-minute edit; changing it in Phase 8 means touching layouts too.
- Architectural errors surface as **build failures and schema validation errors** — loud and
  unambiguous — instead of as subtly wrong pixels that get mistaken for CSS bugs.
- Page generation, redirects, and the SEO manifest are all **derived** from content config. They
  can't be verified until the content is real, and they must be verified before layouts consume
  them.

> ⚠️ **Architectural bug found while planning — fix it, don't work around it.**
> See **§8.5** below for the diagnosis and the patch.

### Architecture phases in detail

**Phase 0 — Scaffold** ✅ *(done)*
Duplicated `greastro` → `KoiRoofingandSolar` (318 files; no `node_modules`/`dist`/`.git`/`.astro`). Smoke-built clean. Next: `npm install`, `.env`, `siteDomain.js` (`koiroofingandsolar.com`), a unique dev `server.port`, thin project `AGENTS.md` (delegating to `../greastro/AGENTS.md`, carrying the §7.1 allowlist + CSP-sync rule + audit ritual), strip starter `README`/`ASTRO-6-MIGRATION`/`MAINTENANCE`.

**Phase 1 — Schema, config & site facts**
The foundation everything else validates against. **No visual work.**
- `content.config.ts`: drop `services`; add `roofing`, `solar`, `service-areas`, `types`, `benefits`, `team`, `values`, `service-tiers` — each with a `// ── name ──` banner comment justifying it (§4.1). Add `serviceLines: refSchema(["roofing","solar"])` to `types`/`projects`/`testimonials`/`faq`/`benefits`.
- `schema.ts`: add `ctaSchema` to `baseSchema` + `metaSchema`.
- `siteData.ts`: the three exports — `siteData` (incl. `businessType: "RoofingContractor"`), `businessData`, `ctaData` (§7.4).
- `contact-us.json`: real phone/email/address with the structured `streetAddress`/`addressLocality`/… fields — **the source of truth the schema builders read**. Delete the 3 starter entries.
- `siteData.ts`: a fourth export — **`businessHours` array** (§7.10), carrying both the footer's display strings and the structured `dayOfWeek`/`opens`/`closes`.
- `.env` + `env.d.ts`: all 6 Formspree vars + `PUBLIC_GTM_ID` (§7.3).
- Fix the `formName="Greastro Contact Form"` / `"Greastro Quote Form"` hidden inputs in both forms.
- **Patch `utils/filesystem/contentScanner.ts` to read JSON collections (§8.5)** — without it the 577 service areas get no redirects.
- **Extend `businessSchema.ts` with the missing schema fields (§7.10)** — before Phase 9 deletes the old JSON-LD blobs. *(Hooking up `openingHoursSpecification` + `aggregateRating` is deferred for review — §10.)*

*Gate: `astro check` clean; `businessSchema` emits real Koi facts; every collection resolves through `query()` (even while empty); `refSchema(["roofing","solar"])` type-checks; **`scanCollections()` returns items for JSON collections and MDX redirect counts are unchanged** (§8.5); **`businessHours` is on `siteData` and the footer renders it**; `businessSchema` extended per §7.10 (hours/rating wiring deferred); zero "Greastro" strings in `src/` outside comments.*

**Phase 2 — Purge starter content, port Koi's**
Greastro ships **18 placeholder entries across 13 collections**. Every one is removed or replaced. No new entry may reference a starter asset.

| Collection | Starter entries to delete | Replace with |
|---|---|---|
| `about-us` | mission, promise, vision | Koi's about copy |
| `values` | *(none — new collection)* | Koi's 5 core values + its own heading/description |
| `blog` | first-post | Koi's 10 posts (+ real `featuredImage` on all 10; drop the starter `noindex`) — §9.1 |
| `authors` | authors.json (1) | Richard Faria / Koi |
| `faq` | how-to-add-content, what-is-greastro | Koi's 14 FAQs |
| `projects` | ecommerce-platform | Koi's 7 (drop the `copy.mdx` dupe) |
| `services` | digital-marketing, web-development | **collection deleted** → `roofing` + `solar` |
| `testimonials` | john-smith | Koi's 9 |
| `gallery` | gallery.json (3) | Koi's 17 |
| `legal` | privacy-policy, cookie-policy, **terms-of-service** | Koi's 2, verbatim (§7.7) — **no terms** |
| `social-media` | socialmedia.json (4) | Koi's 3 (FB/IG/TikTok) |
| `menus` / `menu-items` | keep `menus.json`; `menu-items.json` keeps only `home` | Koi nav via `addToMenu`, incl. the URL-less "Monmouth County" parent |
| `contact-us` | *(done in Phase 1)* | — |

Also: **strip all 196 animation-class usages** from content and markup (§7.9) and comment the two `scroll-animations` imports in `Theme.astro`; copy the ~76 Koi assets into `src/assets/koi/`; **delete `arold.jpg`** (leaked from certified-bag-chasers — referenced by the starter testimonial + gallery, so it goes when they do) and the `astro.svg`/`background.svg` placeholders; point `SEO.astro`'s `siteLogo` + `defaultOGImage` at the real Koi logo. **Comment out the consent banner (§7.6).**

*Gate: `grep -ri "greastro\|lorem\|john smith\|arold" src/content` returns nothing; **zero `slide-up`/`scale-up`/`load-*`/`animate-on-appear` classes remain anywhere in `src/`**; every collection query returns only Koi entries; **`buildRedirectConfig()` runs clean with no circular/self-redirect errors**; **the total redirect count is asserted and under Vercel's 1024 limit** (path-aliases generate ~1 per page ≈ 603, and `buildRedirectConfig()` has no cap or warning of its own — assert it here rather than discovering it at deploy); menus build from `addToMenu` with correct parents and no id collisions; the JSON-collection redirect decision (above) is implemented and tested; build green.*

**Phase 3 — The services split + service areas**
The structurally risky content work, isolated in its own phase.
- Create `roofing` (6 children) and `solar` (5) from the old `services` tree; the two roots' page content becomes each collection's `_meta.mdx` body.
- Port **`service-areas` (577)** — rename kebab-case, and **fix the 21 counties pointing at the nonexistent `"new-jersey"` → `"nj"`** (§5).
- Remap **every** cross-reference to `serviceLines`, including the 2 FAQ + 5 benefit dual roofing+solar cases.
- `service-tiers` (Residential/Commercial/Industrial, currently inline on the homepage).
- PNG icons → `fa6:`/`lu:` tokens.

*Gate: all entries validate; **zero orphan `parent` refs**; `query("service-areas").all()` returns 577; `query("roofing").all()` = 6 and `query("solar").all()` = 5; `serviceLines` returns the right items per line, dual cases included; breadcrumbs resolve state → county → town; **`dist/__seo/*.json` has one entry per page and `robots.txt`/`llms.txt`/`llms-full.txt` generate with real Koi content**; `areaServed` populates from the real collection; **the sitemap already contains all 603 URLs**.*

**Phase 3.5 — Wire every page with starter variants, then content-diff against the old site**

The last architecture phase, and the one that makes the whole ordering pay off. **Every page
exists and renders its correct content through unstyled Greastro defaults** — then each is
compared to its old-site counterpart on *content*, before a single style is written.

Build each page with `BaseLayout` + `ContentRenderer` using **existing starter variants only**
(`GridVariant`, `ListVariant`, `AccordionVariant`, `TestimonialVariant`, `BlogVariant`,
`ContactVariant`, `MenuVariant`) plus `SecondaryHero`. No new variants, no CSS, no brand tokens.
The goal is *"is every piece of content present, in the right order, on the right URL?"* — not
*"does it look right?"*

**The diff protocol** — for each of the 26 core pages, extract text-only from both builds and
compare:
```bash
# old vs new, one page at a time
python3 -c "import re,sys,html;print(html.unescape(re.sub(r'<[^>]+>',' ',open(sys.argv[1]).read())))" \
  OLD/dist/about-us/index.html | tr -s ' \n' ' \n' > /tmp/old.txt
# …same for NEW/dist/about-us/index.html → /tmp/new.txt
diff /tmp/old.txt /tmp/new.txt
```
What the diff must show: **every heading, paragraph, list item, FAQ question/answer, testimonial
quote, and CTA label from the old page is present.** Ordering differences inside a section are
acceptable at this stage; *missing content is not*. Nav/footer chrome will differ — check those
once, not per page.

Track it as a real checklist, page by page: `/` · `/about-us` · `/contact-us` · `/careers` ·
`/internship-program` · `/blog` + 10 posts · the 2 service pages · `/privacy-policy` ·
`/cookie-policy` · the 6 Monmouth pages · `/404`. Plus **spot-check ~5 service-area pages**
(one state root, one county, three towns) rather than all 577.

> ⚠️ **Where the starter variants genuinely can't reach** — verified by reading what each
> variant and LoopComponent actually consumes:
>
> | Koi content | Field | Starter support |
> |---|---|---|
> | Testimonials | `rating`, `role`, `company` | ✅ `TestimonialCard` reads all three |
> | Testimonials | **`video`** | ❌ nothing reads it |
> | Projects | **`beforeImage` / `afterImage`** | ❌ nothing reads them |
> | Gallery | `featuredImage` as a tile | ⚠️ only via `MasonryCard`/`GridCard` |
> | Benefits / types | `icon` | ⚠️ `ContactCard` only |
>
> For these, assert the content is **present in the collection and queryable** (`query()` returns
> it with the right fields) rather than visible on the page. They get their real display in
> Phases 5–6. Don't build `BeforeAfterVariant` early just to make the diff green — that's UI work
> leaking into the architecture block.

*Gate: all 603 pages exist and render real Koi content; the text-diff for each of the 26 core
pages shows **no missing content**; the 4 unrenderable field types are confirmed present via
query; zero pages fall back to placeholder or empty output.*

> **Why this is worth its own phase.** It separates *"the content and data model are right"* from
> *"the design is right"* — two failure modes that are miserable to debug together. After this
> gate, any content that goes missing during Phases 4–10 is unambiguously a **regression you
> introduced**, and you have a known-good build to diff against. Skip it and a missing FAQ item
> reads as a CSS bug for an hour.

---

> ## ⛔ Content gate — do not start the design phase until all of this is true
>
> The site is **fully functional and completely unstyled**. Every one of these must hold:
>
> - [ ] `npm run build` green, **603 pages**, zero warnings
> - [ ] `robots.txt`, `llms.txt`, `llms-full.txt` all generated with real Koi content
> - [ ] Sitemap diff vs the legacy URL inventory (§6.3) is **clean** — nothing missing, nothing extra
> - [ ] Redirects build with no circular/self-redirect/validation errors
> - [ ] **The `contentScanner` JSON patch is in and verified** (§8.5) — service-area redirects exist
> - [ ] Zero orphan `parent` refs; the service-area tree resolves 3 levels deep
> - [ ] No starter content, assets, or "Greastro" strings anywhere in `src/`
> - [ ] Every collection reachable via `query()`, returning the expected count
> - [ ] `@graph` emits business + breadcrumb + service + FAQ + review from real content
> - [ ] All preference UIs off; no dead preference scripts in `<head>`
> - [ ] Forms POST to the right Formspree endpoints
> - [ ] **Every page renders real content through starter variants** (Phase 3.5)
> - [ ] **Text-diff vs the old site is clean for all 26 core pages** — no missing content
>
> **Changing the data model after this point means touching layouts too.** That's the whole
> reason for the gate. If something here fails, fix it in Phases 1–3.5 — don't carry it forward
> and don't paper over it with CSS.

### Block 2 — design structure (3.9): decide every file before writing any style

**Three distinct steps, not two.** Content (0–3.5) → **codebase structure (3.9)** → styling
(4–10). This phase produces **no styling and no working UI** — it produces the *decisions*: every
component, variant, layout and card that will exist, named and stubbed, with its props contract
written down.

**Why it's separate.** The look is the hardest and most iterative part. Discovering *mid-restyle*
that Koi needs a variant you hadn't planned means stopping design work to make an architectural
call — the two worst things to interleave. Deciding the file layout while nothing is styled yet is
cheap; deciding it while three pages are half-styled is not.

#### Deliverable 1 — the component manifest

Every display unit the old site had, mapped to exactly one of: **reuse as-is** · **reuse from a
reference site** · **build new**. Derived from the old `SectionVariants.js` (17 variants) and 18
LoopComponents:

| Old variant | Old component | New variant | New card | Source |
|---|---|---|---|---|
| `primaryHero` | — | `FrontPageHero` (layout) | — | reuse (greastro) |
| `media1`/`media2`/`media3`/`media4` | — | `<Bands>`/`<Band>` | — | reuse (johns) |
| `imageCol` / `vidCol` | — | `<Band>` w/ `image`/`video` | — | reuse (johns) |
| `testimonials` | `VideoCard` | `TestimonialCarouselVariant` | `TestimonialCard` **+ video** | reuse + **extend** |
| `portfolio` | `ClientBeforeAfterCard` | `BeforeAfterVariant` | `BeforeAfterCard` | reuse (johns) |
| `gallery` | `ClientImageCard` | `GalleryMarquee` | — | reuse (greastro) |
| `imageCards` | `ImageServiceCard` | `ImageCardVariant` | `ImageCard` | reuse (johns) |
| `listOfBoxes` | `ImageBox` | `ImageCardVariant` | `ImageCard` | reuse |
| `listSection`/`listSection2` | `ListItem` / `IconListItem` | `ListVariant` | `ListCard` | reuse (greastro) |
| `faqs` | `AccordionItem` | `AccordionVariant` | — | reuse (greastro) |
| `cardSection` | `Card` / `ServiceCard` | `GridVariant` | `GridCard` | reuse (greastro) |
| `banner` | — | `CtaBanner` | — | reuse (johns) |
| `serviceAreas` | `LocationItem` | **`LocationVariant`** | **`LocationCard`** | **build new** |
| — | `TeamCard` | `GridVariant` | `TeamCard` | **build new** (1 entry — consider `GridCard`) |
| — | `SocialIcon` | `SocialMediaVariant` | `SocialIcon` | reuse (greastro) |
| — | `FlipCard` | *(unused — drop)* | — | — |

**Net new to build: ~2** (`LocationVariant`/`LocationCard`, plus a `TestimonialCard` video
extension). Everything else reuses greastro or johns-pro-roofing. **Write this table down and get
it agreed before Phase 4** — it's the difference between a planned build and an improvised one.

#### Deliverable 2 — layouts & static sections

| Layout | Purpose | Source |
|---|---|---|
| `BaseLayout` | root doc | reuse (+ the two hooks, §1) |
| `FrontPageHero` | homepage hero | reuse, restyle in Phase 4 |
| `SecondaryHero` | inner + collection pages | reuse, restyle |
| `collections/ServiceLayout` | roofing/solar item pages | reuse + `hero` slot inversion |
| `collections/BlogLayout` / `BlogIndexLayout` | blog | reuse |
| `collections/LegalLayout` | the 2 legal docs | reuse |
| **`collections/LocationLayout`** | 577 service-area pages | **build new** |
| **`collections/LandingPageLayout`** | the 6 Monmouth pages (§9.2) | **build new** |
| `SpanishSection` | homepage Spanish band | **port from old site** |

#### Deliverable 3 — the asset & media decisions

Not covered by any variant, and each needs a call **before** styling:

- **75 images** → move to `src/assets/koi/` (sub-foldered: `projects/`, `blog/`, `team/`,
  `gallery/`) so Astro optimizes them. Decide the folder scheme once.
- **`.mov` files still referenced ×3** — `koirands-intro.mov`, `roofing-intro.mov`,
  `solar-intro.mov`. Safari-only format; the site already has `.mp4` twins for some.
  **Decide: convert all to `.mp4`/`.webm`, or keep?** This is a real compatibility question, not
  a cleanup.
- **6 orphaned videos, ~66 MB** — `lenny`, `professor`, `sargent`, `tony`,
  `roofingandsolarvid.mp4`, `roofingandsolarvid.webm`. Referenced nowhere. Port or drop?
- **Video poster frames** — `utils/videoThumbnails.ts` generates them at build time. Confirm it
  works for every referenced video before layouts depend on it.
- **Icons** — the old site used PNGs as icons; the manifest above assumes `fa6:`/`lu:` tokens.
  **Pick the specific icon name for each of the ~12 benefit/type/contact entries** now, so Phase 4
  isn't blocked choosing icons.
- **`BackgroundMedia` is the only `getImage()` caller** and Astro 6 **rejects SVG** through it.
  Confirm no hero/background asset is an SVG.

#### Deliverable 4 — the styling contract

So Phase 4 has something to implement against rather than invent:
- The `@theme` token list (§3) — already extracted, just confirm it's complete.
- Which Koi utility classes survive as-is (`.heading-primary`, `.h1`–`.h6`, `.top-heading`,
  `.content-section`, `.sec-spacing-y`, `.border-radius`) vs. become Tailwind utilities.
- **No animation mapping needed** — motion is dropped entirely (§7.9). Strip the old classes
  during migration rather than translating them.
- Whether `<Bands>`' auto-alternating light/dark rhythm can express Koi's existing
  `media1`/`media2`/`imageCol` sequence, or needs a variant.

*Gate: the manifest is written and agreed; every new file exists as a **stub** with its props
interface and a docblock saying what it renders and why it isn't a reuse; every asset/media
question above is answered; **zero styling written**. `npm run build` still green at 603 pages.*

> **After this gate, Phase 4+ is purely visual work** — every structural decision is already made,
> so styling never has to stop to answer an architecture question.

---

### Block 3 — styling & layout (4–10), structure is frozen

**Phase 4 — Brand skin**
Port the `@theme` tokens + typography/utility classes verbatim (§3). Favicons. Verify the gradient `.heading-primary` and the navy `body` background. Self-host Lato/Poppins via `@fontsource`. *Gate: a blank page already "feels like Koi."*

**Phase 5 — Template hooks & reusable components**
`BaseLayout` `<slot name="head" />` + `hideHeader`/`hideFooter`; `ContentRenderer` `heading` slot passthrough. Copy in `<Bands>`/`<Band>`, `PhoneLink`, `GoogleRating`, `ReviewButton`, `BeforeAfterVariant`+`BeforeAfterCard`, `TestimonialCarouselVariant` (§1). *Gate: build green; header/footer render real Koi nav + contact; no consent banner.*

**Phase 6 — Homepage**
The homepage already renders all 11 bands' content from Phase 3.5 — this phase **swaps starter variants for the real ones** and adds `FrontPageHero`. Build only the genuinely-missing variants. *Gate: side-by-side **screenshot** diff vs the old build; re-run the Phase 3.5 **text**-diff to prove no content was lost while restyling.*

**Phase 7 — Inner pages**
Restyle what Phase 3.5 already built: `about-us`, `contact-us`, `careers`, `internship-program`, the 2 service pages (`ServiceLayout`), blog index + 10 posts, legal, 404, and the `service-areas` item layout. Add the displays starter variants couldn't reach — testimonial video, project before/after, gallery tiles, icons. *Gate: all 603 URLs still exist; text-diff still clean; the 4 previously-unrenderable field types now visibly render.*

**Phase 8 — Landing pages & blog polish**
Build `LandingPageLayout` + the 6 `landing-pages` entries; move all 62 inline FAQs into the `faq` collection; delete the 6 hand-pasted JSON-LD blobs (§9.2). Blog: move the ~20 per-post `faqItems` into `faq` with a `post` ref, delete the missing-image ternary, derive category chips from `tags` (§9.1). *Gate: copy identical to the old pages; `FAQPage` schema now emitted for every landing page **and** every post; no hardcoded slug ternaries remain.*

**Phase 9 — SEO, schema, redirects**
Delete every hand-pasted JSON-LD — **only after the §7.10 field audit is signed off** (any deliberately-dropped field recorded as a decision, not an omission). Verify the derived `@graph` (business + breadcrumb + review + faq + service) — **`areaServed` populates from the real `service-areas` collection**. Add `redirectFrom` for the 2 service URLs; set `"trailingSlash": false` in `vercel.json` (§6.1). Extend CSP. Wire all **10** trackers as **direct** loads, preserving each one's load mechanism (§7.1, §7.6). *Gate: `robots.txt`, `llms.txt`, `llms-full.txt` generate; **sitemap has all 603 pages** (§6.3); Rich Results test passes; **tracker-ID set in the new `dist/index.html` is exactly equal to the old build's — all 10, verified by diff — and each fires in the network tab** (the consent-gate removal's biggest risk).*

**Phase 10 — Verification**
Full-page screenshot diff old vs new at mobile/tablet/desktop — comparing **final rendered state**, since the old site animates in and the new one doesn't (§7.9). Plus a final text-diff against the Phase 3.5 baseline to catch content lost during styling. Lighthouse (incl. its accessibility score — the markup must still pass without the panel). Sitemap/redirect audit. A real submission per form. Confirm **no consent banner, no language switcher, no accessibility button** appears anywhere, and that no dead preference scripts ship in `<head>`.

---

## 8.5 Bug: JSON-loaded collections are invisible to the filesystem scanner

**Found while planning this port. It's a genuine Greastro bug, not a Koi quirk — fix it in Koi
now, and carry the fix upstream in a future template refactor.**

### The diagnosis

`src/utils/filesystem/contentScanner.ts` is the Node-side scanner that feeds **both** the
redirect collector and the filesystem page rules. It filters for MDX only:

```ts
const contentFiles = files.filter(
  (file) =>
    (file.endsWith('.mdx') || file.endsWith('.md')) &&   // ← JSON collections never match
    !file.startsWith('_')
);
```

So for every `FileLoad(...)` collection, `scanCollections()` returns `items: []`. Consequences:

| System | Reads the scanner? | Effect on JSON collections |
|---|---|---|
| `redirects/collector.ts` (manual `redirectFrom`) | yes | **silently ignored** |
| `redirects/pathAliasCollector.ts` (auto `/coll/slug` ↔ `/slug`) | yes | **never generated** |
| `filesystem/pageLogic.ts` (Node-side page rules) | yes | items invisible |
| Astro page generation (`[collection]/[id].astro`) | **no** — uses `getCollection()` | works fine |

That last row is why the bug is easy to miss: **pages build correctly** (greastro's own
JSON-loaded `authors` collection produces `/authors/jane-doe`), so nothing errors. Only the
redirect layer quietly does nothing.

**Affected collections in Greastro today:** `menus`, `menu-items`, `contact-us`,
`social-media`, `authors`, `gallery` — and in Koi additionally **`service-areas` (577 entries)**,
`faq`, `benefits`, `values`. `authors` is the live proof: it has `itemsHasPage: true` and builds
real pages, so it *should* be getting path aliases and can't.

### The fix (Phase 1, Koi)

Small and contained — teach the scanner to read a collection's JSON payload. Astro's `file()`
loader keys entries by their **`id`** field, so the scanner must use the same convention:

```ts
// Fall back to a JSON payload when a collection has no MDX entries.
// FileLoad() collections store all items in one <collection>.json (or
// socialmedia.json etc.), keyed by an `id` field — mirror Astro's file()
// loader so redirects and page rules see the same slugs Astro does.
if (items.length === 0) {
  const jsonFile = files.find((f) => f.endsWith('.json') && !f.startsWith('_'));
  if (jsonFile) {
    const filePath = path.join(collectionDir, jsonFile);
    try {
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const entries = Array.isArray(parsed) ? parsed : Object.values(parsed);
      for (const entry of entries) {
        const slug = entry?.id;
        if (!slug) continue;   // no id → Astro can't key it either
        items.push({ slug: String(slug), data: entry, filePath });
      }
    } catch {
      // Malformed JSON is the schema layer's problem to report, not the scanner's.
    }
  }
}
```

Notes on the shape:
- **Guarded by `items.length === 0`**, so MDX collections are untouched and the change can't
  regress existing behavior.
- **Handles both array and object-map** JSON payloads (Astro's `file()` accepts either).
- **Skips entries without `id`** rather than inventing slugs — matching Astro, which can't key
  them either.
- **Swallows parse errors** — Zod already reports malformed content with a better message; the
  scanner shouldn't crash the config load.

### Verification (Phase 1 gate)

Assert the fix actually took, rather than assuming:
- `scanCollections()` returns **577** items for `service-areas` and **1** for `authors`
- `buildRedirectConfig()` emits path aliases for JSON-collection items that have pages
- `redirectFrom` on a JSON entry now produces a redirect
- MDX collections' redirect counts are **unchanged** (no regression)
- Full build still green at 603 pages

Once this lands, §6.1/§5's URL preservation runs through the **standard** redirect machinery —
no bespoke `vercel.json` rule for the 577 service areas, no 577 MDX stubs. The `vercel.json`
trailing-slash flag (§6.1) is still worth setting, but for its own reasons.

### Carry upstream — future Greastro refactor

Log this in the template repo as a real defect with a wider fix than Koi needs:

1. **Port this scanner patch to `2026/greastro`** — it's a strict improvement; `authors` is
   already silently affected there.
2. **Audit the other Node-side filesystem readers** for the same MDX-only assumption. The
   `robots-llms` integration has its own independent scan — `readCollection()` filters
   `f.endsWith('.mdx')` and `resolveEntrySourcePath()` looks for `<slug>.mdx` — so **JSON
   collections are also missing from `llms-full.txt`**. Same root cause, separate code path.
   **Confirmed empirically:** greastro's own `dist/llms-full.txt` contains *zero* occurrences of
   its JSON-collection content (no `authors`, no `gallery`). For Koi that would silently drop
   `faq`, `benefits`, `values`, and `gallery` from the AI-facing export — which is much of the
   "Supporting Content" section that file exists to provide.
3. **Consider a single shared scanner** so "which collections exist and what's in them" has one
   implementation instead of three (`contentScanner`, `robots-llms`'s reader, and the runtime
   `getCollection()` path).
4. **Add a template test** that a `FileLoad` collection with `itemsHasPage: true` gets both its
   pages *and* its path aliases — the exact case that silently failed here.

> **Scope: Koi gets step 1 (the scanner patch) for certain.** Steps 3–4 are template work and
> stay out of this port.
>
> **Step 2 is a judgment call worth making explicitly.** Quantified for Koi, the `robots-llms`
> MDX-only assumption would drop **622 entries** from `llms-full.txt`:
> `service-areas` 577 · `gallery` 17 · `faq` 14 · `benefits` 6 · `values` 5 · `social-media` 3.
> The FAQ, benefits and values entries are precisely the "Supporting Content" that file exists to
> expose to AI crawlers, so the gap isn't cosmetic.
>
> Two defensible calls: **(i)** patch `readCollection()` in Koi too (same one-guard shape as the
> scanner fix — maybe 20 lines, and `llms-full.txt` is a headline reason for choosing Greastro);
> or **(ii)** ship Koi with the gap and fix both readers together in the template refactor, since
> `llms.txt` is net-new for Koi and even a partial one beats the old site's none.
> **Recommendation: (i)** — it's small, self-contained, and the whole point of §8.5 is that
> quietly-incomplete output is worse than a loud failure. Flagging rather than assuming, since it
> does widen Phase 1 slightly.

---

---

## 8.6 Greastro template fix register — everything to carry upstream

Seven bugs were found and fixed in Koi during this port. **None are Koi-specific.** Every one is a
template defect that silently degrades any Greastro site, so this section is the checklist for the
future greastro refactor. All seven are verified present in Koi source and green at 607 pages.

The unifying theme of the first two and the sixth: **Greastro treats `GlobLoad` (MDX) collections as
the only real kind, and `FileLoad` (JSON) collections as second-class.** Anywhere the template walks
the filesystem itself rather than going through Astro's content layer, it filters for `.mdx` and
silently skips JSON. The failure mode is always the same and always the dangerous kind — no error,
no warning, just missing output.

| # | File | Symptom if unfixed | Severity |
|---|---|---|---|
| 1 | `utils/filesystem/contentScanner.ts` | JSON collections invisible to redirect collector + filesystem page rules | High |
| 2 | `utils/filesystem/frontmatter.ts` | A `#` comment in frontmatter swallows the next key | High |
| 3 | `utils/loaders/MenuItemsLoader.ts` | `addToMenu.order` ignored; nav order silently arbitrary | Medium |
| 4 | `utils/formspree.ts` | File uploads fail; `Content-Type` clobbers multipart boundary | High |
| 5 | 6 × `ContentRenderer/Variants/*.astro` | `heading` from `_meta.mdx` silently dropped site-wide | High |
| 6 | `integrations/robots-llms/…ts` | JSON collections omitted from `llms-full.txt` | Medium |
| 7 | `components/Form/FormWrapper.tsx` | `File` objects stringified to `"[object File]"` before submit | High |

### 1 — contentScanner: JSON collections invisible

Filters `.mdx`/`.md` only, so a JSON-backed collection scans as zero items. Fix adds a fallback that
parses the first non-underscore `.json`, accepting both an array and an object-map, and using `id`
as the slug. See §8.5 for the full diagnosis.

### 2 — frontmatter: comment swallows the following key

The parser advanced past a comment line but not past the *blank lines and further comments* after
it, so the next real key was consumed. This is what made nav items vanish and produced the
`Â–¼` mojibake I initially misdiagnosed as a stale build.

```ts
i++;
while (i < lines.length && (!lines[i].trim() || lines[i].trim().startsWith('#'))) { i++; }
```

### 3 — MenuItemsLoader: addToMenu.order ignored

Read `data.order` but never the per-menu `addToMenu.order`, so a collection could not order its own
nav entry. Fix: `order: menuConfig.order ?? data.order` — per-menu override wins, collection-level
order is the fallback.

### 4 — formspree: multipart uploads

Sent JSON unconditionally. Fix switches to `FormData` when any value is a `File`/`Blob`, and
critically **never sets `Content-Type`** in that case — the browser must supply the multipart
boundary. Also skips 0-byte files, which Formspree rejects.

### 5 — Variants dropped the `heading` prop

The worst of the seven, because it was invisible-by-design. `ContentRenderer` correctly resolves
`heading` from `_meta.mdx` (including the segmented `{before, text, after}` form) and passes it
down — then six variants threw it away:

- **Five** (`Accordion`, `BeforeAfter`, `ImageCard`, `TestimonialCarousel`, `Testimonial`) never
  destructured `heading`, so they rendered the flat `title` fallback instead.
- **`GridVariant`** was worse: it bypassed `SectionHeading` entirely and hand-rolled its own
  `<h2>{title}</h2>`, which *structurally cannot* render a segmented heading.

Net effect: every segmented heading in a Greastro site silently degraded to its fallback. In Koi
this showed as "Benefits of Choosing **Koi Roofing and Solar**" rendering as "Why Choose Us?".

Fix: all six destructure `heading` and pass it to `SectionHeading`; `GridVariant` now routes through
`SectionHeading` rather than a local `<h2>`. Guards widened to `(heading || title || description)`
so a heading alone is sufficient to render the header.

> **Lesson for the refactor:** a variant that renders its own `<h2>` instead of using
> `SectionHeading` is a bug waiting to happen. `SectionHeading` should be the only path to a section
> header, and the shared `BaseVariantProps` type should make `heading` impossible to ignore.

### 6 — robots-llms: JSON collections omitted from llms-full.txt

`readCollection()` filtered `.mdx` only. Because the guard below it is
`if (!items.length) return null`, a JSON-*only* collection wasn't partially covered — it was dropped
whole. And since the "Supporting Content" block is the **only** route into `llms-full.txt` for
page-less collections, every JSON entry on the site was absent.

**Measured in Koi: 157 entries missing** — `faq` 126, `gallery` 17, `benefits` 6, `values` 5,
`contact-us` 3. The FAQ loss is the substantive one: 126 Q&A pairs on cost, warranty, financing and
timelines, i.e. exactly what an assistant is asked about a contractor, and the one body of content
here that reads as if written for retrieval. `llms-full.txt` grew 170,787 → 199,217 bytes.

JSON entries have no frontmatter and no MDX body, so the fix maps fields directly rather than
reusing `extractMdxBody`, and honors a per-entry `llms.addToLLMs === false` exactly as the MDX path
honors frontmatter.

**Correctly still excluded** (verified, not incidental): `authors`, `menu-items`, `menus` and
`social-media` all set `addToLLMs: false`; `service-areas` sets `itemsAddToLLMs: false` and has
`itemsHasPage: true`, so its 577 towns are covered as real pages. An earlier estimate of "622
missing entries" was wrong — it summed every JSON entry without checking eligibility.

### 7 — FormWrapper stringified File objects

The state collector coerced values with `String(value)`, turning an upload into
`"[object File]"` before `submitToFormspree` ever saw it — so fix #4 alone was insufficient.

```ts
} else if (typeof File !== "undefined" && value instanceof File) {
  data[key] = value.size > 0 ? value : undefined;
}
```

### Verification

```
1 contentScanner JSON    ✓        5 variant heading        6 variants
2 frontmatter comments   ✓        6 robots-llms JSON       ✓
3 menu order             ✓        7 FormWrapper File       ✓
4 formspree multipart    ✓        build: 607 pages green
```

A codebase-wide grep for the `.mdx`-only filter pattern confirms **no third instance** remains:
only `contentScanner.ts:40` and `robots-llms.integration.ts:369`, both patched.


---

## 9. Blog, landing pages & static pages

Three groups of page-level content, each with a different right answer.

### 9.1 Blog — 10 posts, collection-native already

The posts are the healthiest content in the old site. Frontmatter maps almost 1:1 onto
`baseSchema`:

| Old field | New field | Note |
|---|---|---|
| `title`, `description` | same | — |
| `keywords` | `seo.keywords` | moves under the `seo` block |
| `tags` | `tags` | already `["solar","incentives"]` style — drives the category chips |
| `author: "Richard"` | `author: refSchema("authors")` | **becomes a real ref** → one `authors` entry for Richard Faria |
| `publishDate` | `publishDate` | already a date |
| `image: "/newBlog1.jpeg"` | `featuredImage` | public path → `src/assets/koi/blog/` so it gets optimized |
| — | `readingTime` | net-new; `BlogLayout` already renders it |

**Two real problems to fix, not port:**

1. **The missing-image ternary.** 3 of 10 posts have no `image`, and `blog/[slug].astro`
   compensates with a nested ternary hardcoding slug fragments — including an absolute URL to a
   hashed asset (`https://koiroofingandsolar.com/_astro/roofing5.CvOcaQm9.JPG`) that breaks on
   the next build. **Fix:** give all 10 posts a real `featuredImage`; delete the ternary.
2. **Per-post FAQs emit no schema.** Every post exports a `faqItems` array rendered through
   `BlogFaqSection.astro` — ~20+ Q&A pairs that are **completely invisible to search** (no
   `FAQPage` JSON-LD anywhere). **Fix:** move them into the `faq` collection with a
   `post: refSchema("blog")` ref (mirroring how `faq.service` already works), render via
   `AccordionVariant`, and let **`buildFaqSchema`** emit the markup. This is a genuine SEO gain
   that costs nothing — exactly the "devs say woah" category.

**Layouts:** Greastro's `BlogIndexLayout` + `BlogLayout` already provide async author
resolution, pagination, reading time, and featured-image handling. Point `_meta.mdx` at them.
The old sidebar (quote form · latest posts · categories · tags) rebuilds as content-driven
blocks; note the old category links (`/blog/?category=energy`) were **hardcoded and don't match
the actual tags** — derive the list from `tags` instead. And **drop the starter
`robots: "noindex, nofollow, noarchive"`** from `blog/_meta.mdx` — Koi's blog is indexed.

### 9.2 The 6 Monmouth County landing pages — one layout, six entries

The single biggest simplification in the port. Measured across all six:

| Page | Lines | Inline FAQs | JSON-LD | Sections |
|---|---|---|---|---|
| `roofing-monmouth-county` | 573 | 10 | 1 | 12 |
| `metal-roofing-monmouth-county` | 539 | 12 | 1 | 12 |
| `residential-roofing-monmouth-county` | 528 | 10 | 1 | 12 |
| `commercial-roofing-monmouth-county` | 509 | 10 | 1 | 12 |
| `roofing-shingles-monmouth-county` | 513 | 10 | 1 | 12 |
| `solar-power-installation-monmouth-county` | 466 | 10 | 1 | 12 |
| | **~3,130** | **62** | **6** | |

**They are structurally identical.** Verified by diffing the variant sequences —
every page is `media2 · media2 · testimonials · faqs · banner`, with a byte-identical order.
Only four consts, the images, and the FAQ text differ:
```ts
const pageTitle, pageSlug, metaDescription, pageDescription
```

**Rebuild as a `landing-pages` collection** (`hasPage: false`, `itemsHasPage: true`,
`itemsRootPath: true` so URLs stay `/roofing-monmouth-county`) + **one**
`LandingPageLayout.astro`. Each entry is frontmatter + MDX body:
- The 4 consts → `title` / `seo.metaTitle` / `seo.metaDescription` / `description`
- Images → `bannerImage` + `featuredImage` (+ a gallery ref where a page shows more)
- **62 inline FAQs → the `faq` collection** with a `landingPage: refSchema("landing-pages")`
  ref, so `buildFaqSchema` emits real `FAQPage` markup per page
- **6 hand-pasted `RoofingContractor` blobs → deleted.** `buildBusinessSchema` +
  `buildServiceSchema` already produce this, correctly and consistently, from `siteData` +
  `contact-us` + `service-areas`

**~3,130 lines of near-duplicate page code → one layout + six content entries.** Copy stays
word-for-word; the rendered output should be indistinguishable.

> These pages are also the strongest argument for `businessData` (§7.4) — "50-year warranty",
> "$0 down", "20+ years" are retyped across all six today.

### 9.3 The remaining static pages

| Page | Lines | Sections | Form | Approach |
|---|---|---|---|---|
| `about-us` | 197 | 5 | — | `about-us` collection `_meta.mdx` body, rendering the `values` collection via `ContentRenderer` |
| `contact-us` | 45 | 1 | ContactForm | `contact-us` `_meta.mdx` body + `ContactVariant`; already thin |
| `careers` | 264 | 7 | HiringForm | Keep as `src/pages/careers.astro`, composed from `ContentRenderer` |
| `internship-program` | 250 | 8 | InternshipForm | Same |
| `404` | 16 | 0 | — | Greastro's `404.astro`, restyled |

**Why `careers` and `internship-program` stay as pages, not collections:** each is a
*single* page with bespoke narrative structure and its own form — there's no set of sibling
entries to iterate. `AGENTS.md`'s rule is "don't hardcode arrays when a collection exists or
*should* exist"; a collection of one is worse than a page. Their *repeated* content (benefit
lists, step lists) does move into collections or `ctaSchema` frontmatter.

**`about-us` and `contact-us` do become collection index bodies**, because Greastro already
ships those collections and both reference-render other content (values, contact methods).

**Forms:** all 4 (`Contact`, `Hiring`, `Internship`, + the blog sidebar `Quote`) keep their
`PUBLIC_FORMSPREE_*` fallback chain to the contact ID (§7.3), and the **SMS consent checkbox
ports untouched** (§7.6).

---

## 10. Open decisions

1. ~~**Trailing slash**~~ — **resolved: keep `'never'`** (§6.1). Both configs emit identical files; Vercel already 308s `/path/` → `/path`, so nothing 404s. Add `"trailingSlash": false` to `vercel.json` to make it explicit. Only cost is Google re-consolidating 603 canonicals.
2. **Business schema fields (§7.10)** — you're reviewing these separately. Two need a call: wiring `businessHours` → `openingHoursSpecification`, and whether `aggregateRating` derives from the 9 real testimonials (honest, lower count) or carries the old site's `5.0 / 34`. The `businessHours` **data** lands in Phase 1 either way.
3. ~~**Duplicate tracking IDs**~~ — **resolved: keep every one.** All 10 trackers ported identically; no consolidation (§7.1). Architecture changes (env vars, Greastro integrations); the tags do not. Includes preserving the partytown-vs-plain split on the two GA4 properties and the noscript-only `GTM-MHMZXZW2`.
4. ~~**Cross-reference shape**~~ — **resolved:** `refSchema(["roofing","solar"])`, a real multi-collection reference (§4.1). `refSchema` supports this natively; Koi is just the first project to use it.
5. **`/serviceAreas/*` URL shape** — now that they're ported: keep the legacy camelCase path (recommended, zero SEO risk) or move to `/service-areas/*` and eat 577 redirects? (§5)
6. ~~**Dark mode**~~ — **resolved: light-only** (§7.8). Nothing to disable — Greastro's dark mode is *already inert* (`UseMode` is unmounted, no `data-theme` is ever written, no CSS reacts to it). Keep the machinery in place; don't author a dark palette.
7. ~~**Values vs about-us**~~ — **resolved:** `values` stays its **own collection** (§4.2). It already has its own `_meta.mdx` heading and description in the old site, and `/about-us` renders it via `ContentRenderer` — collection stays separate from the page that displays it.
8. **Orphaned media (§3.9)** — **6** videos totalling **~66 MB** referenced nowhere: `lenny`, `professor`, `sargent`, `tony`, `roofingandsolarvid.mp4`, `roofingandsolarvid.webm`. Port or drop?
9. **`.mov` policy (§3.9)** — 3 still-referenced `.mov` files (`koirands-intro`, `roofing-intro`, `solar-intro`). Safari-only container; convert to `.mp4`/`.webm` or keep?
10. **`robots-llms` JSON reader (§8.5)** — patch it in Koi so 622 JSON-collection entries reach `llms-full.txt`, or ship the gap and fix it in the template refactor?

---

## 11. Acceptance criteria

**Users:** "I don't see anything different." — with **one accepted exception: no entrance/scroll animations** (§7.9).
- **All 10 trackers present and firing, byte-identical IDs** — analytics continuity unbroken.
- All **603** URLs resolve (200 or 301→200) — 26 core + 577 service areas; identical copy, colors, fonts, imagery, section order, hero video, before/after sliders, Google reviews; forms deliver to the same inboxes; SMS consent intact; no consent banner; legal pages read exactly as before.

**Devs:** "Woah — much better."
- Zero hand-pasted JSON-LD; schema derived from content · zero hardcoded content arrays · one `ContentRenderer` path for all sections · menus/contact/legal are content · `llms.txt` + `llms-full.txt` exist · third parties behind a strict CSP, tightened by dropping the Google-Translate hosts · Koi's real legal docs as content · redirects validated at build · `roofing`/`solar` independently extensible · service-area hierarchy actually correct (21 orphan refs fixed) · no starter branding, no duplicate systems, no dead code.
