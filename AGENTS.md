# AGENTS.md — Koi Roofing & Solar

This is a **Project Mode** site built on **Greastro**. Greastro is the foundation, not the
brand. The brand is **Koi Roofing & Solar**.

> **Read the full Greastro ruleset first:** `../greastro/AGENTS.md`
> All architecture, mode rules, query/ContentRenderer conventions, styling tokens, and the
> "reuse before creating / customize in place" discipline live there. This file only adds
> what's specific to this project.

> **Read the migration plan:** [`KOI-REBUILD-PLAN.md`](KOI-REBUILD-PLAN.md).
> This project is a **port** of the pre-Greastro site at
> `../2025-leftover/KoiRoofandSolar`. The governing constraint is:
> **users must notice nothing; developers should notice everything.**
> Before changing anything user-facing, check the plan — most "improvements" are
> deliberate non-goals here.

---

## What this project is

Family-run roofing and solar contractor serving New Jersey, NYC, and Eastern Pennsylvania.
Static, content-driven, built on the Greastro systems (content collections → `query()` →
`ContentRenderer` → variants/cards → `@theme` design tokens).

**603 pages**: 26 core + 577 service-area landing pages.

## Where the brand lives — edit these, don't duplicate them

- **Site facts / CTA:** `src/content/siteData.ts` — four exports: `siteData` (title, legal name,
  tagline, description, `businessType: "RoofingContractor"`, Google reviews URL), `businessData`
  (warranty, financing, experience, ownership — **interpolate these into copy, never retype
  them**), `ctaData`, and `businessHours`.
- **Contact facts:** the `contact-us` collection — phone, email, address with structured
  `streetAddress`/`addressLocality`/… fields. **The single source of truth the schema builders
  read.** Never hardcode a phone number; query it.
- **Brand colors:** `src/styles/global.css` `@theme` → `--color-primary: #232f49` (navy),
  `--color-secondary: #0d75b6` (blue), `--color-accent: #feae00` (amber). The 50–950 scales
  auto-derive — **never hand-edit the derived steps**.
- **Brand assets:** `src/assets/koi/`.
- **Domain:** `src/content/siteDomain.js`.

## Project-specific collections

Beyond the Greastro defaults: `roofing` and `solar` (**siblings, not one `services`
collection** — each line of business is independently expandable), `service-areas` (577),
`types`, `benefits`, `values`, `team`, `service-tiers`, `landing-pages`.

Cross-collection membership uses **`serviceLines: refSchema(["roofing","solar"])`** — a real
multi-collection reference, because FAQ and benefit entries can belong to both lines at once.
Filter with `normalizeReference(...).some(r => r.collection === "roofing")`.

---

## Sanctioned third parties & endpoints

This is the **complete allowlist** of external services this site may touch. Anything not here
doesn't belong — see the allowlist rule in `../greastro/AGENTS.md` §3.5. Plain footer/social
links don't count as integrations.

| Service | ID(s) | Purpose | Wired via | Env |
|---|---|---|---|---|
| **Formspree** | 6 form ids | form submission | `src/utils/formspree.ts` | `PUBLIC_FORMSPREE_*` |
| **Google Analytics** | `G-MFDQM6J7VE`, `G-7S1TEFL7YE` | analytics — **two** properties | `IntHeadScripts` | `PUBLIC_GA4_ID`, `_2` |
| **Google Tag Manager** | `GTM-5QV9L2ZC`, `GTM-MHMZXZW2` | tags — **two** containers | `GoogleTagManager.astro` + `IntBodyScripts` | `PUBLIC_GTM_ID`, `_2` |
| **Meta Pixel** | `1599711647766029`, `1689278455447883` | ads — **two** pixels | `IntHeadScripts` | `PUBLIC_META_PIXEL_ID`, `_2` |
| **Microsoft Clarity** | `ukrfopzgqf` | session recording | `IntHeadScripts` | `PUBLIC_CLARITY_ID` |
| **LeadConnector** | `6a0c691e6e838e289f5df2e5` | chat widget | `IntBodyScripts` | `PUBLIC_LEADCONNECTOR_WIDGET_ID` |
| **Google Search Console** | `5l36yHMA…Gej4` | site verification `<meta>` | `IntHeadScripts` | `PUBLIC_GOOGLE_SITE_VERIFICATION` |

### 🔒 Tracker parity is non-negotiable

**All 10 trackers must stay exactly as the legacy site has them — same IDs, same count.**
The `_2` variants are **not** duplicates awaiting consolidation; both are live and carry
history. Three load details that must survive:

1. **`PUBLIC_GA4_ID` loads through Partytown** (`type="text/partytown"`, off main thread);
   `PUBLIC_GA4_ID_2` loads as a normal `<script async>`. Different threads by design.
2. **`PUBLIC_GTM_ID_2` exists ONLY as a `<noscript>` iframe** — there is no `gtm.js` loader for
   it. **Do not "fix" this** by adding one; that would start sending data to a container that
   receives none today.
3. **Both Pixels share one `fbq` block** — two `init` calls, one `PageView`, two noscript images.

### CSP is the enforcement layer

`vercel.json` ships a strict CSP (`default-src 'none'`). **Adding any third party means editing
the CSP in the same change**, or the browser blocks it. Two easy-to-miss requirements:
- **Partytown needs `worker-src 'self' blob:`** plus the dedicated `/~partytown/*` CSP block.
  Don't prune it.
- **`frame-src` must allow `googletagmanager.com`** for the GTM noscript iframes — including the
  container that exists only as an iframe.

---

## Deliberate departures from Greastro defaults

These are **user-instructed decisions, not drift.** Don't "helpfully" re-enable them.

| Feature | State | Why |
|---|---|---|
| **Cookie consent banner** | commented out | NJ business, no EU/UK audience; legacy site has none |
| **Accessibility panel** | commented out | Legacy site has none. **Overrides the template's "keep it on" rule** |
| **Language switcher** | commented out | Legacy site is English-only |
| **Dark mode** | light only | Already inert in the template; keep the hooks, don't build a palette |
| **Scroll animations** | commented out | The old animation library isn't used going forward |

**Commented out ≠ deleted.** Everything under `src/integrations/preferences/` and
`src/integrations/scroll-animations/` stays on disk; restoring any of them is uncommenting the
mount point. **There are three mount points** for the preferences UIs, not one:
`PreferencesLayout.astro`, `IntHeadScripts.astro`, `IntBodyScripts.astro`.

> ⚠️ **The consent script is also the tracker gate.** With it off, analytics tags must load as
> plain `<script>` — **not** `type="text/plain" data-consent="…"`, which would never unblock.
>
> **Markup-level accessibility is untouched** — semantic HTML, alt text, keyboard nav, contrast,
> focus states. Only the preferences toolbar is hidden. That baseline is what actually matters
> for compliance; keep it correct.

**Dormant, intentionally:** `components/Video/lazyVideoScrollAnimationPlugin.ts` registers into
the scroll-animation observer but is imported nowhere. Video lazy-loading does not depend on it.

---

## Local patch to a Greastro bug

`src/utils/filesystem/contentScanner.ts` is **patched in this project** to read JSON-loaded
collections. Upstream it filters `.mdx`/`.md` only, so `FileLoad()` collections get **no
`redirectFrom` and no path-alias redirects** — which would silently break the 577 service-area
URLs. Pages still build either way, which is why it's easy to miss.

**Carry this upstream to `../greastro` in a future refactor**, along with the same bug in
`robots-llms.integration.ts` (its independent scan also reads `.mdx` only, so JSON collections
are missing from `llms-full.txt`).

---

## Staying on-rails

- Don't reintroduce Greastro starter copy or placeholder content — replace in place.
- Don't hardcode service/area/testimonial arrays; they're collections.
- Keep it static (`output: 'static'`) — no backend, server routes, or runtime fetching.
- **Don't consolidate trackers.** See above.
- **Don't add user-visible features the legacy site lacks** without checking the plan — this is
  a port, and "users notice nothing" is the acceptance bar.
- Legal documents (`src/content/legal/`) are **real client copy** — port verbatim, never rewrite.

## Commands

`npm run dev` (port **5757**) · `npm run build` · `npm run preview` ·
`npm run generate:icons` — run after adding/removing icons; **don't hand-edit** the generated
map at `src/integrations/icons/utils/iconMap.generated.ts`.

---

## START OF EVERY CHAT — third-party / exposure audit

Before doing the requested work in a new session, audit this project against the allowlist above
and report anything that doesn't match. Check both directions:

**Reaching OUT:**
- `grep -rhoiE "https?://[a-z0-9.-]+" src` → compare hosts to the table (ignore plain
  footer/social links and `schema.org`/`w3.org`)
- `grep -rniE "fetch\(|axios|createClient|\.env|import\.meta\.env" src`
- Diff `.env` keys against the table; flag any **non-`PUBLIC_`** (secret) var
- **Cross-check `vercel.json` CSP ↔ the allowlist**

**Letting the OUTSIDE in:**
- Secrets exposed to the client (this site should have **none**)
- `output` flipped off `'static'`, an SSR adapter added, or a server route
- New trackers/pixels/widgets beyond the 10 listed — **or any of the 10 missing**

If everything matches, say so in one line and proceed.
