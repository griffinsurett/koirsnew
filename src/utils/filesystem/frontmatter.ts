// src/utils/filesystem/frontmatter.ts
/**
 * Frontmatter Parsing Utilities
 *
 * Extracts YAML frontmatter from MDX/Markdown files for the Node-side layers
 * (the redirect collector and the filesystem page rules), which read files
 * directly rather than going through Astro's content layer.
 *
 * ── WHY js-yaml ───────────────────────────────────────────────────────────
 * This was a hand-rolled line-by-line parser. It coped with scalars, flat
 * arrays and one level of nesting, but silently mis-parsed anything deeper:
 * an array of objects that themselves contain arrays (e.g. the Monmouth
 * landing pages' `sections` stack) flattened into one long array, and the
 * corrupted object then took `itemsRootPath` with it — which moved six
 * legacy-SEO landing pages from `/roofing-monmouth-county` to
 * `/monmouth-county/roofing-monmouth-county` with no error anywhere.
 *
 * That failure mode — no warning, just wrong output — is the same class of
 * bug as the `#`-comment one this file already carried a fix for. js-yaml is
 * already in the dependency tree (Astro depends on it), parses the whole
 * spec, and throws loudly on malformed input instead of guessing.
 */

import fs from 'node:fs';
import yaml from 'js-yaml';

/**
 * Parse frontmatter from a file
 * 
 * @param filePath - Path to MDX/Markdown file
 * @returns Parsed frontmatter data
 */
export function parseFrontmatter(filePath: string): Record<string, any> {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return parseFrontmatterFromString(content);
  } catch (error) {
    console.warn(`Failed to read file ${filePath}:`, error);
    return {};
  }
}

/**
 * Parse frontmatter from a string
 * 
 * @param content - File content as string
 * @returns Parsed frontmatter data
 */
export function parseFrontmatterFromString(content: string): Record<string, any> {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return {};

  try {
    const parsed = yaml.load(match[1], { json: true });
    // A frontmatter block that isn't a mapping (empty, or a bare scalar/list)
    // has no keys for callers to read — treat it as absent rather than
    // returning something they'd index into.
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, any>)
      : {};
  } catch (error) {
    // Malformed YAML: warn and degrade to "no frontmatter" rather than
    // returning a half-parsed object. Zod reports bad content far better than
    // this layer can, and Astro's own loader will surface the real error.
    console.warn('Failed to parse frontmatter:', error);
    return {};
  }
}

/**
 * Extract specific fields from frontmatter
 * 
 * @param filePath - Path to file
 * @param fields - Array of field names to extract
 * @returns Object with only requested fields
 */
export function extractFrontmatterFields(
  filePath: string,
  fields: string[]
): Record<string, any> {
  const data = parseFrontmatter(filePath);
  const result: Record<string, any> = {};
  
  for (const field of fields) {
    if (data[field] !== undefined) {
      result[field] = data[field];
    }
  }
  
  return result;
}

/**
 * Check if a file has frontmatter
 * 
 * @param filePath - Path to file
 * @returns True if file contains frontmatter
 */
export function hasFrontmatter(filePath: string): boolean {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return /^---\s*\n[\s\S]*?\n---/.test(content);
  } catch {
    return false;
  }
}