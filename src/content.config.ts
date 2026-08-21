// src/content.config.ts
/**
 * Collection structure:
 *
 * src/content/[collection]/
 *   _meta.mdx         ← Collection config (frontmatter) + index page content (body)
 *                        The _ prefix excludes it from collection entries
 *   item-one.mdx      ← Collection item
 *   item-two.mdx      ← Collection item
 *
 * _meta.mdx frontmatter controls:
 * - title: Display name for the collection
 * - description: Collection description
 * - hasPage: Whether to generate /[collection] index page
 * - itemsHasPage: Whether items get individual pages
 * - featuredImage: Hero image for index page
 * - seo: SEO overrides
 */
import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import {
  baseSchema,
  MenuSchema,
  MenuItemFields,
  refSchema,
  imageInputSchema,
} from "./content/schema";
import { GlobLoad, FileLoad } from "@/utils/loaders/loaderUtils";
import { MenuItemsLoader } from "@/utils/loaders/MenuItemsLoader";

export const collections = {
  // ── menus.json ─────────────────────────────────────────
  "menus": defineCollection({
    loader: FileLoad("menus", "menus.json"),
    schema: MenuSchema,
  }),

  // ── menu-items.json ─────────────────────────────────────
  "menu-items": defineCollection({
    loader: MenuItemsLoader(),
    schema: MenuItemFields,
  }),

  "contact-us": defineCollection({
    loader: FileLoad("contact-us", "contact-us.json"),
    schema: ({ image }) =>
      baseSchema({ image }).extend({
        // The contact value itself (phone digits, email, etc.). This is the
        // canonical field — `description` is free for genuine subtext.
        value: z.string().optional(),
        linkPrefix: z.string().optional(),
        url: z.string().optional(),
        // Structured address parts (on the address entry) — the single source
        // of truth for schema.org PostalAddress, so builders don't parse the
        // display string. Fill these on whichever entry holds the address.
        streetAddress: z.string().optional(),
        addressLocality: z.string().optional(),
        addressRegion: z.string().optional(),
        postalCode: z.string().optional(),
        addressCountry: z.string().optional(),
        // Phone country dialing code (E.164 prefix without "+", e.g. "1"),
        // on the phone entry.
        phoneCountryCode: z.string().optional(),
      }),
  }),

  "social-media": defineCollection({
    loader: FileLoad("social-media", "socialmedia.json"),
    schema: ({ image }) =>
      baseSchema({ image }).extend({
        link: z.string().optional(),
      }),
  }),

  // ── legal ───────────────────────────────────────────────
  "legal": defineCollection({
    loader: GlobLoad("legal"),
    schema: ({ image }) =>
      baseSchema({ image }).extend({
        effectiveDate: z
          .union([z.date(), z.string()])
          .optional()
          .transform((val) => {
            if (!val) return undefined;
            if (val instanceof Date) return val;
            return new Date(val);
          }),
      }),
  }),

  "about-us": defineCollection({
    loader: GlobLoad("about-us"),
    schema: ({ image }) =>
      baseSchema({ image })
  }),

  "blog": defineCollection({
    loader: GlobLoad("blog"),
    schema: ({ image }) =>
      baseSchema({ image }).extend({
        author: refSchema("authors"),
        tags: z.array(z.string()).default([]),
        readingTime: z.number().optional(),
      }),
  }),

  "authors": defineCollection({
    loader: FileLoad("authors", "authors.json"),
    schema: ({ image }) =>
      baseSchema({ image }).extend({
        email: z.string().email().optional(),
        social: z
          .object({
            twitter: z.string().url().optional(),
            github: z.string().url().optional(),
            linkedin: z.string().url().optional(),
            website: z.string().url().optional(),
          })
          .optional(),
        role: z.string().optional(),
      }),
  }),

  // ── roofing ─────────────────────────────────────────────
  // One of Koi's two lines of business. Kept separate from `solar` (rather
  // than both living under a single `services` collection) so each line owns
  // its own index page, menu placement, SEO, and sub-services, and can grow
  // without entangling the other. Items are the individual roofing services
  // (roof replacement, flat-roof waterproofing, storm damage, …).
  "roofing": defineCollection({
    loader: GlobLoad("roofing"),
    schema: ({ image }) =>
      baseSchema({ image }).extend({
        price: z.string().optional(),
        features: z.array(z.string()).default([]),
        // Intro video shown on the line-of-business index page.
        introVideo: z.string().optional(),
        // Which form the page's quote CTA renders.
        form: z.string().optional(),
      }),
  }),

  // ── solar ───────────────────────────────────────────────
  // Koi's second line of business, a sibling of `roofing` — same reason:
  // kept out of a shared `services` collection so solar can add its own
  // sub-services, financing pages, and copy without touching roofing.
  // Schema deliberately mirrors `roofing`; the duplication is the point,
  // since the two are free to diverge.
  "solar": defineCollection({
    loader: GlobLoad("solar"),
    schema: ({ image }) =>
      baseSchema({ image }).extend({
        price: z.string().optional(),
        features: z.array(z.string()).default([]),
        introVideo: z.string().optional(),
        form: z.string().optional(),
      }),
  }),

  // ── types ───────────────────────────────────────────────
  // Materials/systems Koi installs (shingle, metal, slate, flat roofing;
  // solar panels, batteries). Display-only — these are a "what we work with"
  // band, not pages. `serviceLines` puts each one under roofing and/or solar.
  "types": defineCollection({
    loader: GlobLoad("types"),
    schema: ({ image }) =>
      baseSchema({ image }).extend({
        serviceLines: refSchema(["roofing", "solar"]),
      }),
  }),

  // ── service-tiers ───────────────────────────────────────
  // Residential / Commercial / Industrial. Was an inline array on the old
  // homepage; a collection so the three tiers are editable content rather
  // than markup. Display-only.
  "service-tiers": defineCollection({
    loader: GlobLoad("service-tiers"),
    schema: ({ image }) => baseSchema({ image }),
  }),

  // ── benefits ────────────────────────────────────────────
  // "Why choose Koi" points. Display-only. Several apply to BOTH lines of
  // business, which is why `serviceLines` is a multi-collection reference
  // rather than a single parent.
  "benefits": defineCollection({
    loader: FileLoad("benefits", "benefits.json"),
    schema: ({ image }) =>
      baseSchema({ image }).extend({
        serviceLines: refSchema(["roofing", "solar"]),
      }),
  }),

  // ── values ──────────────────────────────────────────────
  // Koi's five core values. Its own collection (not folded into about-us)
  // because it carries its own heading + intro copy and renders as a
  // discrete band on /about-us. Display-only.
  "values": defineCollection({
    loader: FileLoad("values", "values.json"),
    schema: ({ image }) => baseSchema({ image }),
  }),

  // ── team ────────────────────────────────────────────────
  // Staff bios. Display-only for now (one entry); kept a collection so
  // adding people is a content change.
  "team": defineCollection({
    loader: GlobLoad("team"),
    schema: ({ image }) =>
      baseSchema({ image }).extend({
        role: z.string().optional(),
      }),
  }),

  // ── service-areas ───────────────────────────────────────
  // 577 towns/counties/states, three levels deep via `parent`. Drives the
  // local-SEO landing pages AND the `areaServed` in the business schema —
  // which is why the collection is named `service-areas` (kebab-case): the
  // shared schema builders query that exact key.
  // NOTE: JSON-loaded, so it depends on the local contentScanner patch to
  // get redirects at all (see AGENTS.md).
  "service-areas": defineCollection({
    loader: FileLoad("service-areas", "service-areas.json"),
    schema: ({ image }) =>
      baseSchema({ image }).extend({
        // Short form for compact copy ("NJ, NY & PA").
        abbr: z.string().optional(),
      }),
  }),

  // ── monmouth-county ─────────────────────────────────────
  // Hand-written local-SEO pages (the Monmouth County set). Structurally
  // identical to each other, so they're content against one layout rather
  // than six near-duplicate .astro files. `itemsRootPath` keeps their
  // legacy top-level URLs.
  "monmouth-county": defineCollection({
    loader: GlobLoad("monmouth-county"),
    schema: ({ image }) =>
      baseSchema({ image }).extend({
        serviceLines: refSchema(["roofing", "solar"]),
      }),
  }),

  "testimonials": defineCollection({
    loader: GlobLoad("testimonials"),
    schema: ({ image }) =>
      baseSchema({ image }).extend({
        role: z.string().optional(),
        company: z.string().optional(),
        rating: z.number().min(1).max(5).default(5),
        // Video testimonial (public path). Koi has one; the rest are text.
        video: z.string().optional(),
        // Sourced from a Google review — renders the G badge + outbound link.
        googleReview: z.boolean().default(false),
        externalLink: z.string().url().optional(),
        serviceLines: refSchema(["roofing", "solar"]),
      }),
  }),

  "projects": defineCollection({
    loader: GlobLoad("projects"),
    schema: ({ image }) =>
      baseSchema({ image }).extend({
        client: z.string().optional(),
        location: z.string().optional(),
        projectUrl: z.string().url().optional(),
        // Before/after pair — the whole point of Koi's portfolio band.
        beforeImage: imageInputSchema({ image }).optional(),
        afterImage: imageInputSchema({ image }).optional(),
        serviceLines: refSchema(["roofing", "solar"]),
      }),
  }),

  "faq": defineCollection({
    loader: FileLoad("faq", "faqs.json"),
    schema: ({ image }) =>
      baseSchema({ image }).extend({
        category: z.string().optional(),
        // Scopes an FAQ to one or both lines of business, so a service page
        // can render just its own set. General FAQs omit it.
        serviceLines: refSchema(["roofing", "solar"]),
        // Scopes an FAQ to a landing page or a blog post, so the schema
        // builders emit FAQPage markup on the page that actually shows it.
        monmouthPage: refSchema("monmouth-county"),
        post: refSchema("blog"),
      }),
  }),

  // ── gallery ─────────────────────────────────────────────
  // A curated set of photos shown as an auto-scrolling marquee (GalleryMarquee)
  // — a visual prelude, not a projects section. Display-only (no pages).
  // `featuredImage` is the tile, `title` the alt text.
  "gallery": defineCollection({
    loader: FileLoad("gallery", "gallery.json"),
    schema: ({ image }) =>
      baseSchema({ image }),
  }),
};
