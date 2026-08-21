// src/integrations/preferences/core/consent/hooks/useConsent.ts
/**
 * Consent Management Hook (Core)
 *
 * React integration for consent checking and script management.
 * Automatically enables scripts when consent is granted.
 *
 * @example
 * ```tsx
 * import { useConsent } from '@/integrations/preferences/consent/core/hooks/useConsent';
 *
 * function MyComponent() {
 *   const { hasConsentFor } = useConsent();
 *   if (hasConsentFor('analytics')) {
 *     // Load analytics
 *   }
 * }
 * ```
 */

import { useEffect, useMemo } from 'react';
import { useCookieStorage } from '@/hooks/useCookieStorage';
import { getConsent, hasConsentFor as hasConsentForUtil } from '../utils/consent';
import { enableScriptsForCategory, enableConsentedScripts } from '../scripts/scriptManager';
import type { CookieConsent, CookieCategory } from '../types';

interface UseConsentReturn {
  consent: CookieConsent | null;
  hasConsent: boolean;
  hasConsentFor: (category: CookieCategory) => boolean;
  enableScripts: (category: CookieCategory) => void;
}

/**
 * Hook to check consent and manage scripts
 */
export function useConsent(): UseConsentReturn {
  const { getCookie } = useCookieStorage();

  // Get consent from cookie
  const consent = useMemo(() => {
    return getConsent();
  }, [getCookie]);

  const hasConsent = consent !== null;

  const hasConsentFor = (category: CookieCategory): boolean => {
    return hasConsentForUtil(category);
  };

  const enableScripts = (category: CookieCategory): void => {
    enableScriptsForCategory(category);
  };

  // Listen for consent changes and enable scripts
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Enable scripts when consent changes
    const handleStorageChange = (e: StorageEvent) => {
      // Cookie changes don't trigger storage events, but we can listen
      // for custom events dispatched by the consent components
      if (e.key === 'cookie-consent-changed') {
        console.log('🔄 Consent changed, re-evaluating scripts');
        enableConsentedScripts();
      }
    };

    const handleConsentChange = () => {
      console.log('🔄 Consent changed, re-evaluating scripts');
      enableConsentedScripts();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('consent-changed', handleConsentChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('consent-changed', handleConsentChange);
    };
  }, []);

  return {
    consent,
    hasConsent,
    hasConsentFor,
    enableScripts,
  };
}
