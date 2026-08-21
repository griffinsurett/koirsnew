// src/utils/images.ts
/**
 * Image Utilities
 *
 * Helper functions for working with Astro-processed images.
 * Handles both formats: direct ImageMetadata and { src: ImageMetadata, alt: string }
 */

import type { ImageMetadata } from "astro";
import type { ImageInput } from "@/content/schema";

/**
 * Type guard to check if a value is Astro ImageMetadata
 */
export function isImageMetadata(img: unknown): img is ImageMetadata {
  return Boolean(
    img &&
      typeof img === "object" &&
      "width" in img &&
      "height" in img &&
      "src" in img
  );
}


/**
 * Extract ImageMetadata from various image input formats.
 * Handles: direct ImageMetadata, { src: ImageMetadata, alt? }, or undefined
 */
export function resolveImageMetadata(
  img?: ImageInput | null
): ImageMetadata | undefined {
  if (!img) return undefined;

  // Direct ImageMetadata (from direct image() usage)
  if (isImageMetadata(img)) return img;

  // Wrapped format { src: ImageMetadata, alt?: string }
  if (
    typeof img === "object" &&
    "src" in img &&
    img.src &&
    isImageMetadata(img.src)
  ) {
    return img.src;
  }

  return undefined;
}

/**
 * Extract image URL from Astro-processed image
 *
 * With proper schema enforcement, images come in predictable formats:
 * - Astro ImageMetadata objects with src property
 * - Image objects with src: ImageMetadata
 *
 * @param img - Astro-processed image
 * @param fallback - URL to use if img is undefined
 * @returns Image URL string
 */
export function getImageUrl(
  img: ImageInput | undefined,
  fallback: string
): string {
  if (!img) return fallback;

  // ImageMetadata object (from image() helper)
  if (typeof img === "object" && "src" in img) {
    const src = img.src;

    // src is a string (processed by Astro)
    if (typeof src === "string") {
      return src;
    }

    // src is nested ImageMetadata
    if (
      typeof src === "object" &&
      src &&
      "src" in src &&
      typeof src.src === "string"
    ) {
      return src.src;
    }
  }

  // Fallback
  return fallback;
}

/**
 * Extract alt text from image object
 *
 * @param img - Image with potential alt text
 * @param fallback - Fallback alt text
 * @returns Alt text string
 */
export function getImageAlt(
  img: ImageInput | undefined,
  fallback: string
): string {
  if (!img) return fallback;

  if (typeof img === "object" && "alt" in img && typeof img.alt === "string") {
    return img.alt;
  }

  return fallback;
}

/**
 * Type guard for image object with alt
 */
export function hasAltText(img: any): img is { src: any; alt: string } {
  return (
    img &&
    typeof img === "object" &&
    "alt" in img &&
    typeof img.alt === "string"
  );
}

/**
 * Configuration for generating a cropped "above the fold" preview image.
 * Used to create a lightweight initial image that shows just the top portion
 * of a tall screenshot, reducing initial payload while maintaining visual continuity.
 */
export interface CroppedPreviewConfig {
  /** Target width for the preview (will match container width) */
  width: number;
  /** Height of the visible "above the fold" area */
  height: number;
  /** Output format */
  format: "avif" | "webp";
  /** Quality (0-100) */
  quality: number;
}

/**
 * Result from generating a cropped preview
 */
export interface CroppedPreviewResult {
  /** Optimized image result from getImage */
  image: Awaited<ReturnType<typeof import("astro:assets").getImage>>;
  /** The config used to generate this preview */
  config: CroppedPreviewConfig;
}

/**
 * Default configs for cropped preview generation.
 * Generates multiple formats for browser compatibility.
 */
export const CROPPED_PREVIEW_DEFAULTS: CroppedPreviewConfig[] = [
  { width: 860, height: 500, format: "avif", quality: 50 },
  { width: 860, height: 500, format: "webp", quality: 70 },
];

/**
 * Generate a cropped "above the fold" preview image.
 *
 * This creates a small, fast-loading image showing just the top portion
 * of a tall screenshot. Perfect for portfolio showcases where the full
 * webpage screenshot is very tall but only the top is initially visible.
 *
 * @param metadata - Source image metadata
 * @param configs - Array of format/size configs to generate
 * @returns Array of optimized cropped images
 *
 * @example
 * ```ts
 * const previews = await generateCroppedPreview(imageMetadata);
 * // Returns AVIF and WebP versions cropped to 860x500
 * ```
 */
export async function generateCroppedPreview(
  metadata: ImageMetadata,
  configs: CroppedPreviewConfig[] = CROPPED_PREVIEW_DEFAULTS
): Promise<CroppedPreviewResult[]> {
  const { getImage } = await import("astro:assets");

  const results = await Promise.all(
    configs.map(async (config) => {
      const image = await getImage({
        src: metadata,
        width: config.width,
        height: config.height,
        format: config.format,
        quality: config.quality,
        fit: "cover",
        position: "top", // Crop from top - keeps the "above the fold" content
      });

      return { image, config };
    })
  );

  return results;
}
