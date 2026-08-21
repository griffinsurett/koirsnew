// src/utils/schema/serviceSchema.ts
/**
 * Service schema — content-specific structured data for a single service page.
 *
 * Declares the Service, links it to the site-wide business entity by @id, and
 * reuses the service-areas collection for areaServed. Built in the service
 * layout, which owns the per-page service content.
 */
import { siteData } from "@/content/siteData";
import { query, sortByOrder } from "@/utils/query";
import { BUSINESS_ID, BUSINESS_TYPE } from "./businessSchema";

interface ServiceSchemaOptions {
  /** Service name (e.g. "Commercial Roof Repairs"). */
  name?: string;
  description?: string;
  /** serviceType — the category or the name. */
  serviceType?: string;
  /** Absolute canonical URL of the service page. */
  url: string;
}

export async function buildServiceSchema(
  options: ServiceSchemaOptions
): Promise<object | null> {
  const { name, description, serviceType, url } = options;
  if (!name) return null;

  const areas = await query("service-areas").orderBy(sortByOrder()).all();

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    ...(description && { description }),
    serviceType: serviceType ?? name,
    provider: {
      "@type": BUSINESS_TYPE,
      "@id": BUSINESS_ID,
      name: siteData.legalName || siteData.title,
    },
    areaServed: areas.map((a: any) => ({ "@type": "State", name: a.data?.title })),
    url,
  };
}
