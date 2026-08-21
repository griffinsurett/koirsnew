// src/components/Pagination/queryParamPagination.client.ts
/**
 * Client behavior for query-param pagination components.
 */

import {
  buildPageHref,
  buildPaginationMeta,
  parsePageParam,
} from "@/utils/pages/pagination";

function splitClasses(value: string | null): string[] {
  return (value || "")
    .split(" ")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toggleClasses(
  el: HTMLElement,
  classes: string[],
  enabled: boolean
): void {
  if (!classes.length) return;
  if (enabled) {
    el.classList.add(...classes);
    return;
  }
  el.classList.remove(...classes);
}

function runQueryParamPagination(): void {
  const paginationNodes = Array.from(
    document.querySelectorAll("[data-query-pagination]")
  );
  if (paginationNodes.length === 0) return;

  paginationNodes.forEach((node) => {
    if (!(node instanceof HTMLElement)) return;

    const paginationId = node.getAttribute("data-pagination-id");
    if (!paginationId) return;

    const feed = document.querySelector(
      `[data-pagination-feed="${paginationId}"]`
    );
    if (!(feed instanceof HTMLElement)) return;

    const cards = Array.from(feed.querySelectorAll("[data-pagination-item]"));
    if (cards.length === 0) return;

    const queryParam = node.getAttribute("data-query-param") || "page";
    const pageSize =
      Number(feed.getAttribute("data-page-size")) ||
      Number(node.getAttribute("data-page-size")) ||
      10;
    if (cards.length <= pageSize) return;

    const requestedPage = parsePageParam(window.location.search, queryParam);
    const paginationMeta = buildPaginationMeta({
      totalItems: cards.length,
      pageSize,
      currentPage: requestedPage,
    });

    cards.forEach((card, index) => {
      if (!(card instanceof HTMLElement)) return;
      const visible =
        index >= paginationMeta.startIndex && index < paginationMeta.endIndex;

      card.style.display = visible ? "" : "none";
      card.toggleAttribute("hidden", !visible);
    });

    const activeClasses = splitClasses(
      node.getAttribute("data-active-link-classes")
    );
    const disabledClasses = splitClasses(
      node.getAttribute("data-disabled-link-classes")
    );

    const pageLinks = Array.from(node.querySelectorAll("[data-page-link]"));
    pageLinks.forEach((link) => {
      if (!(link instanceof HTMLAnchorElement)) return;

      const linkPage = Number(link.getAttribute("data-page-link") || "1");
      const isCurrent = linkPage === paginationMeta.currentPage;

      link.setAttribute(
        "href",
        buildPageHref(linkPage, queryParam, window.location.search)
      );
      if (isCurrent) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }

      toggleClasses(link, activeClasses, isCurrent);
    });

    const prevLink = node.querySelector("[data-page-prev]");
    if (prevLink instanceof HTMLAnchorElement) {
      const prevPage = Math.max(1, paginationMeta.currentPage - 1);

      prevLink.setAttribute(
        "href",
        buildPageHref(prevPage, queryParam, window.location.search)
      );
      prevLink.setAttribute(
        "aria-disabled",
        paginationMeta.hasPrev ? "false" : "true"
      );
      if (paginationMeta.hasPrev) {
        prevLink.removeAttribute("tabindex");
      } else {
        prevLink.setAttribute("tabindex", "-1");
      }

      toggleClasses(prevLink, disabledClasses, !paginationMeta.hasPrev);
    }

    const nextLink = node.querySelector("[data-page-next]");
    if (nextLink instanceof HTMLAnchorElement) {
      const nextPage = Math.min(
        paginationMeta.totalPages,
        paginationMeta.currentPage + 1
      );

      nextLink.setAttribute(
        "href",
        buildPageHref(nextPage, queryParam, window.location.search)
      );
      nextLink.setAttribute(
        "aria-disabled",
        paginationMeta.hasNext ? "false" : "true"
      );
      if (paginationMeta.hasNext) {
        nextLink.removeAttribute("tabindex");
      } else {
        nextLink.setAttribute("tabindex", "-1");
      }

      toggleClasses(nextLink, disabledClasses, !paginationMeta.hasNext);
    }
  });
}

let hasBoundDomReady = false;

export function initQueryParamPagination(): void {
  if (document.readyState === "loading") {
    if (hasBoundDomReady) return;

    hasBoundDomReady = true;
    document.addEventListener(
      "DOMContentLoaded",
      () => {
        hasBoundDomReady = false;
        runQueryParamPagination();
      },
      { once: true }
    );
    return;
  }

  runQueryParamPagination();
}
