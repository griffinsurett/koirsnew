// src/utils/collections/meta.ts
/**
 * Collection Metadata Utilities
 *
 * Handles loading and parsing _meta.mdx files for collections.
 * The metadata controls collection-wide settings like:
 * - Whether the collection has an index page (hasPage)
 * - Whether individual items get pages (itemsHasPage)
 * - What layout to use for items (itemsLayout)
 * - Menu integration (addToMenu, itemsAddToMenu)
 * - SEO defaults
 */

import { metaSchema, type MetaData } from "@/content/schema";
import { z } from "astro/zod";
import type { ImageMetadata } from "astro";

/**
 * Pre-load all _meta.mdx files at module load time
 * Using eager loading for better performance
 */
const mdxModules = import.meta.glob<{ frontmatter?: Record<string, any> }>(
  "../../content/**/_meta.mdx",
  { eager: true }
);

/**
 * Astro's content-collection image() resolution doesn't run on _meta.mdx (these
 * are read through a raw glob, not the collection loader), so image fields
 * arrive as plain strings like "../../assets/koi/shingleroofing.jpg" and would
 * be emitted as literal URLs that 404. Glob the asset folder so those paths can
 * be swapped for real ImageMetadata that Astro can optimize.
 */
const assetModules = import.meta.glob<{ default: ImageMetadata }>(
  "../../assets/**/*.{jpg,jpeg,png,webp,avif,gif,svg,JPG,JPEG,PNG,WEBP,AVIF,GIF,SVG}",
  { eager: true }
);

/** Index assets by their path suffix so any relative form can match. */
const assetsByPath = new Map<string, ImageMetadata>();
for (const [path, mod] of Object.entries(assetModules)) {
  const meta = mod?.default;
  if (!meta?.src) continue;
  const idx = path.indexOf("assets/");
  if (idx !== -1) assetsByPath.set(path.slice(idx), meta);
}

/** Resolve a raw _meta.mdx image string to ImageMetadata, else leave as-is. */
function resolveMetaImage(value: unknown): unknown {
  if (typeof value !== "string" || !value) return value;
  // Leave absolute/public URLs alone — those are served as-is.
  if (/^(https?:)?\/\//.test(value) || value.startsWith("/")) return value;
  const normalized = value.replace(/\\/g, "/");
  const idx = normalized.indexOf("assets/");
  const key = idx !== -1 ? normalized.slice(idx) : `assets/${normalized}`;
  return assetsByPath.get(key) ?? value;
}

/** Image-bearing fields on metaSchema. */
const META_IMAGE_FIELDS = ["featuredImage", "bannerImage"] as const;

/**
 * Get metadata for a specific collection from its _meta.mdx file
 *
 * Parses and validates the frontmatter against the metaSchema.
 * Returns default values if no _meta.mdx file exists.
 *
 * @param collectionName - Name of the collection
 * @returns Parsed and validated metadata object
 * @example
 * const meta = getCollectionMeta('blog');
 * // meta.hasPage, meta.itemsHasPage, meta.itemsLayout, etc.
 */
export function getCollectionMeta(collectionName: string): MetaData {
  const mdxKey = Object.keys(mdxModules).find((k) =>
    k.endsWith(`/${collectionName}/_meta.mdx`)
  );

  const data = mdxKey ? (mdxModules[mdxKey] as any).frontmatter ?? {} : {};

  // Images in _meta.mdx arrive as raw strings (see resolveMetaImage above), so
  // swap them for real ImageMetadata before validating. The schema then accepts
  // either shape: resolved metadata, or a string for public/remote URLs.
  const withImages = { ...data };
  for (const field of META_IMAGE_FIELDS) {
    if (field in withImages) {
      withImages[field] = resolveMetaImage(withImages[field]);
    }
  }

  const metaImage = () =>
    z.union([z.string(), z.custom<ImageMetadata>((v) => Boolean(v))]).optional();

  return metaSchema({ image: metaImage }).parse(withImages);
}
