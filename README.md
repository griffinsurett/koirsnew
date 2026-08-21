# Koi Roofing & Solar

Static marketing site for **Koi Roofing & Solar** — a family-run roofing and solar contractor
serving New Jersey, New York City, and Eastern Pennsylvania.

Built on [Greastro](../greastro) (Astro 6 + React 19 + Tailwind 4, `output: 'static'`).

## Getting started

```sh
npm install
npm run dev      # http://localhost:5757
npm run build    # → dist/  (603 pages)
npm run preview
```

`.env` is gitignored and **not** in the repo. Copy the Formspree ids from the live deployment
before building anything that submits a form; the tracker ids are already committed to `.env`
since they are public by nature. The site domain is **not** an env var — it lives in
`src/content/siteDomain.js`.

## Working in this repo

- **[`AGENTS.md`](AGENTS.md)** — project rules, the sanctioned third-party allowlist, and the
  deliberate departures from Greastro defaults. Read this first.
- **[`KOI-REBUILD-PLAN.md`](KOI-REBUILD-PLAN.md)** — the migration plan. This site is a port of
  the pre-Greastro build at `../2025-leftover/KoiRoofandSolar`; the plan records what must stay
  identical and what is deliberately changing.
- **[`../greastro/AGENTS.md`](../greastro/AGENTS.md)** — the framework ruleset all of the above
  sits on top of.

## Structure

Content lives in `src/content/<collection>/`, configured by each collection's `_meta.mdx` and
registered in `src/content.config.ts`. Pages generate automatically from that config; the
homepage is the one hand-composed page. Rendering goes through `ContentRenderer` → a variant →
a loop component. Never hardcode content arrays into a page.
