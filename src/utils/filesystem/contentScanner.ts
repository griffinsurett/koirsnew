// src/utils/filesystem/contentScanner.ts
/**
 * Collection scanner for Node-only contexts (config/build scripts).
 * Provides meta + item frontmatter for each collection to avoid duplicated FS loops.
 */

import fs from 'node:fs';
import path from 'node:path';
import { parseFrontmatter } from './frontmatter';
import { getCollectionDirs } from './shared';

export interface ScannedItem {
  slug: string;
  data: Record<string, any>;
  filePath: string;
}

export interface ScannedCollection {
  name: string;
  meta: Record<string, any>;
  items: ScannedItem[];
}

export const DEFAULT_CONTENT_DIR = path.join(process.cwd(), 'src', 'content');

export function scanCollections(contentDir: string = DEFAULT_CONTENT_DIR): ScannedCollection[] {
  const collections: ScannedCollection[] = [];
  const collectionDirs = getCollectionDirs(contentDir);

  for (const collectionName of collectionDirs) {
    const collectionDir = path.join(contentDir, collectionName);
    if (!fs.existsSync(collectionDir)) continue;

    const metaPath = path.join(collectionDir, '_meta.mdx');
    const meta = fs.existsSync(metaPath) ? parseFrontmatter(metaPath) : {};

    const files = fs.readdirSync(collectionDir);
    const contentFiles = files.filter(
      (file) =>
        (file.endsWith('.mdx') || file.endsWith('.md')) &&
        !file.startsWith('_')
    );

    const items: ScannedItem[] = contentFiles.map((file) => {
      const filePath = path.join(collectionDir, file);
      const data = parseFrontmatter(filePath);
      const slug = file.replace(/\.(mdx|md)$/, '');
      return { slug, data, filePath };
    });

    // Fall back to a JSON payload when a collection has no MDX entries.
    //
    // FileLoad() collections store every item in one <collection>.json, keyed
    // by an `id` field. Without this branch scanCollections() returns items: []
    // for them, so the redirect collector and the filesystem page rules never
    // see them — meaning JSON-loaded collections silently get no `redirectFrom`
    // and no path-alias redirects. Item *pages* still build (Astro page
    // generation uses getCollection(), not this scanner), which is exactly why
    // the gap is easy to miss.
    //
    // Guarded on items.length === 0 so MDX collections are untouched.
    // NOTE: this is a local patch to a Greastro bug — carry it upstream. The
    // same MDX-only assumption exists in robots-llms.integration.ts.
    if (items.length === 0) {
      const jsonFile = files.find(
        (file) => file.endsWith('.json') && !file.startsWith('_')
      );
      if (jsonFile) {
        const filePath = path.join(collectionDir, jsonFile);
        try {
          const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          // file() accepts an array or an object map.
          const entries = Array.isArray(parsed) ? parsed : Object.values(parsed);
          for (const entry of entries) {
            const slug = (entry as any)?.id;
            // No id → Astro's file() loader can't key it either, so skip it
            // rather than inventing a slug the runtime won't agree with.
            if (!slug) continue;
            items.push({ slug: String(slug), data: entry as Record<string, any>, filePath });
          }
        } catch {
          // Malformed JSON is the content schema layer's problem to report with
          // a better message — don't crash the Astro config load over it.
        }
      }
    }

    collections.push({ name: collectionName, meta, items });
  }

  return collections;
}
