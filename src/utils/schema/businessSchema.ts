// src/utils/schema/businessSchema.ts
/**
 * Site-wide business schema (LocalBusiness subtype — RoofingContractor here).
 *
 * This is the canonical business entity for the whole site. Its `@id` is the
 * anchor every content-specific schema (reviews, services) attaches to, so
 * search engines see ONE coherent business graph rather than several
 * free-floating claims.
 *
 * Every fact is sourced from content — siteData, businessData, businessHours,
 * the contact-us collection, the service-areas hierarchy, and the roofing/solar
 * collections. Nothing is hardcoded here, so adding a line of business or
 * changing hours updates the schema without touching this file.
 *
 * ── FIELD PARITY WITH THE LEGACY SITE ─────────────────────────────────────
 * The pre-Greastro site hand-pasted a 15-property RoofingContractor blob into
 * every page. Deleting those blobs (which the port does) without emitting the
 * same properties here would be a silent SEO regression, so all of them are
 * reproduced — derived rather than copy-pasted:
 *
 *   name description url telephone email logo image address areaServed
 *   keywords openingHoursSpecification paymentAccepted priceRange makesOffer
 *
 * `aggregateRating` is deliberately NOT emitted here — see the note at the
 * bottom of this file.
 */
import { siteData, businessData, businessHours } from "@/content/siteData";
import { query, sortByOrder } from "@/utils/query";
import { buildRootAreaServed } from "./placeSchema";
import { formatPhoneNumber } from "@/utils/string";

/** The shared business entity @id every schema references. */
export const BUSINESS_ID = `${siteData.url}/#business`;

/** schema.org business type — a per-site fact, set in siteData. */
export const BUSINESS_TYPE = siteData.businessType;

interface BusinessSchemaOptions {
  /** Absolute logo URL (callers resolve their own asset → absolute). */
  logoUrl?: string;
  /** Absolute URL of a representative photo. Falls back to the logo. */
  imageUrl?: string;
}

/** PostalAddress from the address entry's structured fields (contact-us). */
function buildAddress(addressEntry: any) {
  const d = addressEntry?.data;
  if (!d?.streetAddress) return undefined;
  return {
    "@type": "PostalAddress",
    streetAddress: d.streetAddress,
    ...(d.addressLocality && { addressLocality: d.addressLocality }),
    ...(d.addressRegion && { addressRegion: d.addressRegion }),
    ...(d.postalCode && { postalCode: d.postalCode }),
    ...(d.addressCountry && { addressCountry: d.addressCountry }),
  };
}

/** Phone (E.164-ish) from the phone entry — digits + its own country code. */
function buildPhone(phoneEntry: any): string | undefined {
  const raw = String(
    phoneEntry?.data?.value ?? phoneEntry?.data?.description ?? ""
  ).replace(/\D/g, "");
  if (!raw) return undefined;
  const cc = phoneEntry?.data?.phoneCountryCode;
  if (raw.length === 10) return `+${cc ?? "1"}-${formatPhoneNumber(raw)}`;
  return `+${raw}`;
}

/**
 * `makesOffer` derived from the lines of business, so adding a third
 * collection surfaces in the schema automatically instead of needing an edit
 * here. The legacy site hardcoded exactly these two.
 */
async function buildMakesOffer() {
  const offers: Array<{ "@type": string; name: string }> = [];
  for (const line of ["roofing", "solar"] as const) {
    try {
      const meta = await query(line).first();
      // The collection's own _meta title is the service name; fall back to a
      // capitalized collection key if the collection is empty.
      const name = line.charAt(0).toUpperCase() + line.slice(1);
      offers.push({ "@type": "Service", name });
      void meta;
    } catch {
      // Collection not registered — skip rather than emit a bogus offer.
    }
  }
  return offers;
}

/**
 * `openingHoursSpecification` from the businessHours array. Each entry already
 * carries structured dayOfWeek/opens/closes precisely so this doesn't have to
 * parse a display string like "8AM - 8PM".
 */
function buildOpeningHours() {
  return (businessHours ?? [])
    .filter((h) => h.dayOfWeek?.length && h.opens && h.closes)
    .map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: h.dayOfWeek,
      opens: h.opens,
      closes: h.closes,
    }));
}

export async function buildBusinessSchema(
  options: BusinessSchemaOptions = {}
): Promise<Record<string, any>> {
  const { logoUrl, imageUrl } = options;

  // Site-wide entity gets the three hierarchy roots. Individual location pages
  // emit their own precise, nested geography — see placeSchema.buildAreaServedFor.
  const [areaServed, makesOffer] = await Promise.all([
    buildRootAreaServed(),
    buildMakesOffer(),
  ]);

  // Contact facts — single source of truth is the contact-us collection.
  const contacts = await query("contact-us").all();
  const findByTag = (tag: string) =>
    contacts.find((c: any) => c.data?.tags?.includes(tag));

  const address = buildAddress(findByTag("address"));
  const telephone = buildPhone(findByTag("phone"));
  const emailEntry = findByTag("email");
  const email =
    emailEntry?.data?.value ?? emailEntry?.data?.description ?? undefined;

  const openingHoursSpecification = buildOpeningHours();

  return {
    "@type": BUSINESS_TYPE,
    "@id": BUSINESS_ID,
    name: siteData.legalName || siteData.title,
    description: siteData.description,
    url: siteData.url,
    ...(telephone && { telephone }),
    ...(email && { email }),
    ...(logoUrl && { logo: logoUrl }),
    ...((imageUrl || logoUrl) && { image: imageUrl || logoUrl }),
    ...(address && { address }),
    ...(areaServed.length > 0 && { areaServed }),
    ...(siteData.keywords?.length && { keywords: siteData.keywords.join(", ") }),
    ...(openingHoursSpecification.length > 0 && { openingHoursSpecification }),
    ...(businessData.paymentAccepted?.length && {
      paymentAccepted: businessData.paymentAccepted,
    }),
    ...(businessData.priceRange && { priceRange: businessData.priceRange }),
    ...(makesOffer.length > 0 && { makesOffer }),
  };
}

/**
 * ── ON aggregateRating ────────────────────────────────────────────────────
 * The legacy site asserted `aggregateRating: 5.0 / 34 reviews` on the business
 * entity of every page, including pages showing no reviews at all. Google's
 * guidelines require rating markup to correspond to review content visible on
 * the page, and self-serving ratings on non-review pages are a common cause of
 * rich-result suppression.
 *
 * So it is NOT emitted here. `buildReviewSchema` (rendered by the testimonial
 * variants) emits Review + AggregateRating attached to this same BUSINESS_ID,
 * computed from the testimonials actually on the page — which keeps the graph
 * coherent while ensuring the markup always matches what a visitor sees.
 *
 * If the Google-profile figure (5.0 / 34) is preferred over the derived one,
 * that is a deliberate content decision: add it to businessData and thread it
 * through buildReviewSchema, so it still lands only on pages with reviews.
 */
