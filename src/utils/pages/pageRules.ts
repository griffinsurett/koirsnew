// src/utils/pages/pageRules.ts
/**
 * Page Rules (Environment Agnostic)
 *
 * Pure data-based helpers to decide whether pages should be generated.
 * Accepts plain frontmatter/meta objects so it can be shared between
 * browser/server code and Node-only build tooling.
 */

// Helper to normalize either a full entry or raw data
const getItemData = (entryOrData: any) =>
  entryOrData?.data ? entryOrData.data : entryOrData;

export function isDraft(itemData: any): boolean {
  return getItemData(itemData)?.draft === true;
}

export function getItemProperty<T>(
  itemData: any,
  metaData: any,
  itemKey: string,
  metaKey: string,
  defaultValue: T
): T {
  const item = getItemData(itemData);

  if (item?.[itemKey] !== undefined) {
    return item[itemKey];
  }
  if (metaData?.[metaKey] !== undefined) {
    return metaData[metaKey];
  }
  return defaultValue;
}

/**
 * Determine if an item should have a page based on priority resolution:
 * 1. Item's explicit hasPage (highest priority)
 * 2. Parent's childHasPage
 * 3. Collection's itemsChildHasPage (for items with parents)
 * 4. Collection's itemsHasPage
 * 5. Default value (lowest priority)
 */
export function shouldItemHavePageData(
  itemData: any,
  metaData: any,
  defaultValue: boolean = true,
  parentData?: any
): boolean {
  const item = getItemData(itemData);
  const parent = parentData ? getItemData(parentData) : undefined;

  // Drafts never get pages
  if (isDraft(item)) return false;

  // 1. Item's explicit hasPage takes highest priority
  if (item?.hasPage !== undefined) {
    return item.hasPage;
  }

  // 2. Check parent's childHasPage (if item has a parent)
  if (parent?.childHasPage !== undefined) {
    return parent.childHasPage;
  }

  // 3. Check collection's itemsChildHasPage for items with parents
  if (item?.parent && metaData?.itemsChildHasPage !== undefined) {
    return metaData.itemsChildHasPage;
  }

  // 4. Fall back to collection's itemsHasPage
  if (metaData?.itemsHasPage !== undefined) {
    return metaData.itemsHasPage;
  }

  // 5. Default value
  return defaultValue;
}

export function shouldItemUseRootPathData(
  itemData: any,
  metaData: any,
  defaultValue: boolean = false
): boolean {
  return getItemProperty(itemData, metaData, "rootPath", "itemsRootPath", defaultValue);
}

export function shouldCollectionHavePageMeta(
  metaData: any,
  defaultValue: boolean = true
): boolean {
  if (metaData?.hasPage === false) return false;
  return defaultValue;
}

export function shouldProcessCollectionData(
  entries: any[],
  metaData: any
): boolean {
  if (metaData?.itemsHasPage !== false) {
    return true;
  }

  // Only process if an item explicitly opts in (and isn't draft)
  return entries.some((entry) => {
    const data = getItemData(entry);
    return data?.hasPage === true && !isDraft(data);
  });
}
