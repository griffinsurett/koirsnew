// src/utils/schema/breadcrumbSchema.ts
/**
 * BreadcrumbList schema — derived from a page's URL path.
 *
 * Site-wide by nature (every non-home page has a position in the hierarchy),
 * so it's built in the SEO layer from the canonical path. Returns null on the
 * homepage (a single-item breadcrumb adds nothing).
 */
import { siteData } from "@/content/siteData";
import { humanizeSlug } from "@/utils/string";

export function buildBreadcrumbSchema(canonicalPath: string): object | null {
  const segments = canonicalPath.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  return {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteData.url },
      ...segments.map((seg, i) => ({
        "@type": "ListItem",
        position: i + 2,
        name: humanizeSlug(seg),
        item: `${siteData.url}/${segments.slice(0, i + 1).join("/")}`,
      })),
    ],
  };
}
