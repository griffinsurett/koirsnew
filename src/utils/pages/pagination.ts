// src/utils/pages/pagination.ts
/**
 * Query-Param Pagination Helpers
 *
 * Shared pagination logic for collection index layouts that paginate with
 * URL query params (e.g. /blog?page=2).
 */

export interface PaginationMeta {
  totalItems: number;
  pageSize: number;
  totalPages: number;
  currentPage: number;
  hasPrev: boolean;
  hasNext: boolean;
  startIndex: number;
  endIndex: number;
  pages: number[];
}

export interface PaginationOptions {
  totalItems: number;
  pageSize: number;
  currentPage?: number;
}

function toPositiveInt(value: unknown, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  const normalized = Math.floor(value);
  return normalized > 0 ? normalized : fallback;
}

export function getTotalPages(totalItems: number, pageSize: number): number {
  const safeTotal = Math.max(0, toPositiveInt(totalItems, 0));
  const safePageSize = toPositiveInt(pageSize, 10);
  return Math.max(1, Math.ceil(safeTotal / safePageSize));
}

export function clampPage(page: number, totalPages: number): number {
  const safeTotalPages = Math.max(1, toPositiveInt(totalPages, 1));
  const safePage = toPositiveInt(page, 1);
  return Math.min(Math.max(1, safePage), safeTotalPages);
}

export function parsePageParam(
  input: string | URLSearchParams | null | undefined,
  paramName: string = "page"
): number {
  if (!input) return 1;

  const params =
    typeof input === "string"
      ? new URLSearchParams(input.startsWith("?") ? input.slice(1) : input)
      : input;

  const rawPage = Number(params.get(paramName) || "1");
  return toPositiveInt(rawPage, 1);
}

export function buildPageHref(
  page: number,
  paramName: string = "page",
  query?: string | URLSearchParams | null
): string {
  const params =
    typeof query === "string"
      ? new URLSearchParams(query.startsWith("?") ? query.slice(1) : query)
      : new URLSearchParams(query ?? undefined);

  params.set(paramName, String(Math.max(1, toPositiveInt(page, 1))));
  return `?${params.toString()}`;
}

export function buildPaginationMeta({
  totalItems,
  pageSize,
  currentPage = 1,
}: PaginationOptions): PaginationMeta {
  const safeTotalItems = Math.max(0, toPositiveInt(totalItems, 0));
  const safePageSize = toPositiveInt(pageSize, 10);
  const totalPages = getTotalPages(safeTotalItems, safePageSize);
  const page = clampPage(currentPage, totalPages);

  const startIndex = (page - 1) * safePageSize;
  const endIndex = Math.min(startIndex + safePageSize, safeTotalItems);

  return {
    totalItems: safeTotalItems,
    pageSize: safePageSize,
    totalPages,
    currentPage: page,
    hasPrev: page > 1,
    hasNext: page < totalPages,
    startIndex,
    endIndex,
    pages: Array.from({ length: totalPages }, (_, idx) => idx + 1),
  };
}
