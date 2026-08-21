// src/utils/schema/reviewSchema.ts
/**
 * Review + AggregateRating schema — built from the testimonial items a variant
 * is rendering.
 *
 * Content-specific: lives with the testimonial variants (which know which
 * reviews are visible on the page), NOT the site-wide SEO layer — the same
 * "schema follows visible content" rule as FAQPage. Attaches to the site-wide
 * business entity by @id so search engines tie the reviews to the business
 * declared in businessSchema, rather than a free-floating (self-serving) rating.
 */
import { siteData } from "@/content/siteData";
import { BUSINESS_ID, BUSINESS_TYPE } from "./businessSchema";

interface TestimonialItem {
  title?: string; // reviewer name (some sites) or headline (others)
  author?: string; // explicit reviewer name, if present
  company?: string; // used as author fallback when there's no person name
  content?: string; // review body
  description?: string; // short headline (fallback body)
  role?: string;
  rating?: number;
}

export function buildReviewSchema(items: TestimonialItem[]): object | null {
  const safe = Array.isArray(items) ? items : [];

  const reviews = safe
    .map((t) => {
      // Prefer an explicit author name; fall back to company, then title.
      const author = (t.author ?? t.company ?? t.title ?? "").trim();
      const body = String(t.content ?? t.description ?? "")
        .replace(/\s+/g, " ")
        .trim();
      const rating = Number(t.rating);
      if (!author || !body) return null;
      return {
        "@type": "Review",
        author: { "@type": "Person", name: author },
        reviewBody: body,
        ...(Number.isFinite(rating) && rating > 0
          ? {
              reviewRating: {
                "@type": "Rating",
                ratingValue: rating,
                bestRating: 5,
                worstRating: 1,
              },
            }
          : {}),
      };
    })
    .filter(Boolean) as object[];

  if (reviews.length === 0) return null;

  const ratings = safe
    .map((t) => Number(t.rating))
    .filter((n) => Number.isFinite(n) && n > 0);

  const aggregateRating =
    ratings.length > 0
      ? {
          "@type": "AggregateRating",
          ratingValue: (
            ratings.reduce((a, b) => a + b, 0) / ratings.length
          ).toFixed(1),
          reviewCount: ratings.length,
          bestRating: 5,
          worstRating: 1,
        }
      : undefined;

  // Attach to the site-wide business entity by @id.
  return {
    "@context": "https://schema.org",
    "@type": BUSINESS_TYPE,
    "@id": BUSINESS_ID,
    name: siteData.legalName || siteData.title,
    url: siteData.url,
    ...(aggregateRating && { aggregateRating }),
    review: reviews,
  };
}
