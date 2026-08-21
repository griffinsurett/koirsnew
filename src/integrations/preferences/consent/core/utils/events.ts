// src/utils/consent/events.ts
/**
 * Lightweight helpers for coordinating cookie preference requests.
 * The heavy CookiePreferencesModal should only load in response to an event.
 */

const OPEN_EVENT = "open-cookie-preferences";

/**
 * Dispatch a request asking the global consent portal to show the modal.
 * Returns true when running in the browser, false during SSR.
 */
export function requestCookiePreferencesModal(): boolean {
  if (typeof window === "undefined") return false;
  window.dispatchEvent(new CustomEvent(OPEN_EVENT));
  return true;
}

/**
 * Subscribe to global cookie preference requests.
 * The caller is responsible for closing the modal when appropriate.
 */
export function subscribeToCookiePreferencesRequests(
  handler: () => void
): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener(OPEN_EVENT, handler);
  return () => window.removeEventListener(OPEN_EVENT, handler);
}
