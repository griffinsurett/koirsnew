// src/utils/seo.ts
/**
 * SEO Props Builder
 *
 * Builds SEO metadata objects for pages from collection entries.
 * Handles:
 * - Resolving author references to display names
 * - Merging item and collection SEO settings
 * - Building complete SEO props for layout components
 *
 * Used by dynamic page routes to generate proper meta tags.
 */

import type { CollectionEntry, CollectionKey } from "astro:content";
import type { SEOData, MetaData, ImageInput } from "@/content/schema";
import { find, isCollectionReference } from "@/utils/query"; // ← Use query system

/**
 * SEO props interface for page metadata
 * Passed to SEO.astro component for meta tag generation
 */
export interface SEOProps {
  title?: string; // Page title
  description?: string; // Page description
  image?: ImageInput; // Featured/OG image
  author?: string; // Author name (resolved from reference)
  publishDate?: Date | string; // Publication date
  seo?: SEOData; // Additional SEO overrides
  siteName?: string; // Site name for OG tags
  addToLLMs?: boolean; // Whether this page appears in llms.txt (default: true)
}

/**
 * Resolve an author reference to a display name
 *
 * Handles multiple author formats:
 * - String IDs: 'jane-doe'
 * - Reference objects: { collection: 'authors', id: 'jane-doe' }
 * - Arrays of references (gets first)
 * - Author objects: { title: 'Jane Doe', ... }
 *
 * @param author - Author in any supported format
 * @returns Author display name or undefined
 */
export async function resolveAuthor(author: any): Promise<string | undefined> {
  if (!author) return undefined;

  // Handle array (get first)
  const authorRef = Array.isArray(author) ? author[0] : author;

  // Use query system instead of references.ts
  if (isCollectionReference(authorRef)) {
    const authorEntry = await find(authorRef.collection, authorRef.id);
    if (authorEntry) {
      const data = authorEntry.data as any;
      return data.title || data.name;
    }
  }

  return undefined;
}

/**
 * Build SEO props from a collection item entry
 *
 * Combines item data with collection defaults:
 * - Item's own SEO settings take precedence
 * - Falls back to collection's SEO settings
 * - Resolves author reference if present
 *
 * @param item - Collection entry to build SEO for
 * @param collectionMeta - Optional collection metadata for defaults
 * @returns Complete SEO props object for layout
 */
export async function buildItemSEOProps(
  item: CollectionEntry<CollectionKey>,
  collectionMeta?: MetaData
): Promise<SEOProps> {
  const itemData = item.data as any;

  // Resolve author to display name
  const authorName = itemData.author
    ? await resolveAuthor(itemData.author)
    : undefined;

  const collectionItemsAddToLLMs = collectionMeta?.llms?.itemsAddToLLMs;
  const itemAddToLLMs = itemData.llms?.addToLLMs;
  const addToLLMs = itemAddToLLMs !== undefined ? itemAddToLLMs : collectionItemsAddToLLMs;

  return {
    title: itemData.title,
    description: itemData.description,
    image: itemData.featuredImage || collectionMeta?.featuredImage,
    author: authorName,
    publishDate: itemData.publishDate,
    addToLLMs,
    seo: {
      // Collection SEO defaults
      ...collectionMeta?.seo,
      // Item SEO overrides
      ...itemData.seo,
    },
  };
}

/**
 * Build SEO props for collection index pages
 *
 * Uses collection metadata with sensible defaults.
 *
 * @param collectionMeta - Collection metadata from _meta.mdx
 * @param collectionName - Collection name for fallback title
 * @returns SEO props for collection index page
 */
export function buildCollectionSEOProps(
  collectionMeta: MetaData,
  collectionName: string
): SEOProps {
  // Capitalize collection name for fallback title
  const title =
    collectionMeta.title ||
    collectionName.charAt(0).toUpperCase() + collectionName.slice(1);

  const description =
    collectionMeta.description || `Browse our ${collectionName} collection`;

  return {
    title,
    description,
    image: collectionMeta.featuredImage,
    addToLLMs: collectionMeta.llms?.addToLLMs,
    seo: collectionMeta.seo || {},
  };
}
