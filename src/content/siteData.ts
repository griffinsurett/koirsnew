// src/content/siteData.ts — compatible with both Astro and React
import { SITE_DOMAIN, SITE_URL } from "./siteDomain.js";

export const siteData = {
  title: "Koi Roofing and Solar",
  legalName: "Koi Solar Corp.",
  tagline: "Some start at the bottom we go to the top",
  description:
    "Koi Roofing & Solar is a family-run, full-service contractor proudly serving New Jersey, Pennsylvania, and all five boroughs of New York City, offering commercial, residential, and industrial roofing and solar solutions.",
  domain: SITE_DOMAIN,
  url: SITE_URL,
  location: "New Jersey, USA",
  // schema.org LocalBusiness subtype — drives the whole business graph.
  businessType: "RoofingContractor",
  googleReviewsUrl:
    "https://www.google.com/search?q=Koi+Roofing+and+Solar+Elizabeth+NJ#lrd=,1,,,",
  // Site-wide local-SEO terms. Feed the business schema's `keywords` and the
  // default <meta name="keywords">, so both stay in one place.
  keywords: [
    "Roofing contractor NJ",
    "Solar installation NYC",
    "Residential roofing",
    "Commercial roofing",
    "Industrial roofing",
    "Roof repair",
    "Roof inspection",
    "Solar panel installation",
    "Clean energy solutions",
    "Local roofing services",
  ],
};

/**
 * Reused business facts. Interpolate these into MDX copy — never retype the
 * values inline, or updating one means hunting every page that repeats it.
 * These four are currently duplicated across the homepage, both service
 * pages, and all six landing pages on the legacy site.
 */
export const businessData = {
  warranty: "50-year warranty",
  // schema.org business facts. Kept beside the other reused facts rather than
  // hardcoded in the schema builder, so they're editable content.
  priceRange: "$",
  paymentAccepted: ["Cash", "Credit Card", "Check"],
  financing: "$0 down financing, flexible for all credit types",
  experience: "over 20 years of experience passed down through three generations",
  ownership: "veteran-owned",
};

/**
 * Business hours. An array (not a flat object) so per-day variation is
 * expressible later without a refactor. Each entry carries BOTH
 * representations: the display strings the footer prints verbatim, and the
 * structured fields schema.org's openingHoursSpecification needs — so
 * neither consumer has to parse the other's format.
 */
export const businessHours = [
  {
    days: "Everyday",
    hours: "8AM - 8PM",
    dayOfWeek: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
    opens: "08:00",
    closes: "20:00",
  },
];

export const ctaData = {
  text: "Request Estimate",
  link: "/contact-us",
};

/**
 * The two lines of business as a CTA pair. The legacy site used this exact
 * pair (`ServiceBtns`) under the hero, on the gallery band, and on the closing
 * banners. URLs are the new top-level paths, not the legacy /services/* ones.
 */
export const serviceBtns = [
  { text: "Roofing", link: "/roofing/", variant: "tertiary" as const },
  { text: "Solar", link: "/solar/", variant: "secondary" as const },
];
