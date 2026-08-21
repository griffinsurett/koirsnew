// src/components/consent/types.ts
/**
 * Cookie Consent Type Definitions
 */

export interface CookieConsent {
  necessary: boolean;
  functional: boolean;
  performance: boolean;
  targeting: boolean;
  timestamp: number;
}

export type CookieCategory = keyof Omit<CookieConsent, 'timestamp'>;

export interface CookieCategoryInfo {
  id: CookieCategory;
  title: string;
  description: string;
  required?: boolean;
}