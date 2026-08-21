// src/utils/collections/prepare.ts
/**
 * Collection Entry Preparation - LAZY RENDER
 */

import type { CollectionKey, CollectionEntry } from "astro:content";
import { render as renderEntry } from "astro:content";
import type { AstroComponentFactory } from "astro/runtime/server/index.js";
import type { MetaData, BaseData } from "@/content/schema";
// ❌ NO imports that touch pages/filesystem during module load
// ✅ Import inside functions

export interface PreparedFields {
  id: string;
  url?: string;
  displayValue?: string;
  /** Lazy render function - call to get Content component when needed */
  render?: () => Promise<{ Content: AstroComponentFactory }>;
  content?: string;
}

export type PreparedItem = BaseData & PreparedFields;

/** Normalize parent reference to first parent id (handles array or string) */
function getFirstParentId(parent: string | string[] | undefined): string | undefined {
  if (!parent) return undefined;
  if (Array.isArray(parent)) return parent[0];
  return parent;
}

export async function prepareEntry<T extends CollectionKey>(
  entry: CollectionEntry<T>,
  collection: T,
  meta: MetaData,
  entriesMap?: Map<string, CollectionEntry<T>>
): Promise<PreparedItem> {
  // ✅ Lazy import utilities
  const { shouldItemHavePage, shouldItemUseRootPath } = await import(
    "@/utils/pages"
  );
  const { applyLinkBehavior, mergeLinkBehavior } = await import(
    "@/utils/links/linkBehavior"
  );

  const identifier = entry.id;
  const data = entry.data as Record<string, any>;

  // Resolve parent entry if item has a parent and we have entries map
  const parentId = getFirstParentId(data.parent);
  const parentEntry = parentId && entriesMap ? entriesMap.get(parentId) : undefined;

  // Check for link behavior config (item-level overrides collection-level)
  const linkBehavior = mergeLinkBehavior(
    data.linkBehavior,
    meta.itemsLinkBehavior
  );

  let itemUrl: string | undefined;
  let displayValue: string | undefined;

  if (linkBehavior) {
    // Use link behavior to determine URL and display value
    const linkResult = applyLinkBehavior(data, linkBehavior, collection as string, identifier);
    itemUrl = linkResult.url;
    displayValue = linkResult.displayValue;
  } else {
    // Standard URL generation
    const hasExistingUrl = data.url !== undefined;
    const hasPage = shouldItemHavePage(entry, meta, parentEntry);

    if (!hasExistingUrl && hasPage) {
      const useRootPath = shouldItemUseRootPath(entry, meta);
      itemUrl = useRootPath ? `/${identifier}` : `/${collection}/${identifier}`;
    }
  }

  // Store raw body for variants that need it - don't render Content here
  // Rendering MDX Content is expensive and should only happen when actually displayed
  let content: string | undefined;
  if ("body" in entry) {
    content = (entry as any).body;
  }

  // Store lazy render closure using standalone render() — entry.render() removed in Astro 6
  const hasBody = "body" in entry;
  const renderFn = hasBody
    ? () => renderEntry(entry as any)
    : undefined;

  return {
    ...data,
    id: identifier,
    ...(itemUrl && { url: itemUrl }),
    ...(displayValue && { displayValue }),
    ...(renderFn && { render: renderFn }),
    ...(content && { content }),
  } as PreparedItem;
}

export async function prepareCollectionEntries<T extends CollectionKey>(
  entries: CollectionEntry<T>[],
  collection: T,
  meta: MetaData
): Promise<PreparedItem[]> {
  const entriesMap = new Map<string, CollectionEntry<T>>();
  for (const entry of entries) {
    if (entry.id) entriesMap.set(entry.id, entry);
  }

  return Promise.all(
    entries.map((entry) => prepareEntry(entry, collection, meta, entriesMap))
  );
}
