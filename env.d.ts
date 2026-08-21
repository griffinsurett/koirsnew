/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  // ── Formspree (one id per form; each falls back to the contact id) ──
  readonly PUBLIC_FORMSPREE_ID?: string;
  readonly PUBLIC_FORMSPREE_CONTACT_ID?: string;
  readonly PUBLIC_FORMSPREE_QUOTE_ID?: string;
  readonly PUBLIC_FORMSPREE_ROOFING_ID?: string;
  readonly PUBLIC_FORMSPREE_SOLAR_ID?: string;
  readonly PUBLIC_FORMSPREE_HIRING_ID?: string;
  readonly PUBLIC_FORMSPREE_INTERNSHIP_ID?: string;

  // ── Trackers — all 10 preserved verbatim from the legacy site (§7.1).
  // The _2 variants are NOT duplicates to consolidate; both are live.
  readonly PUBLIC_GA4_ID?: string;          // loads via Partytown
  readonly PUBLIC_GA4_ID_2?: string;        // loads normally
  readonly PUBLIC_GTM_ID?: string;
  readonly PUBLIC_GTM_ID_2?: string;        // <noscript> iframe only
  readonly PUBLIC_META_PIXEL_ID?: string;
  readonly PUBLIC_META_PIXEL_ID_2?: string;
  readonly PUBLIC_CLARITY_ID?: string;
  readonly PUBLIC_LEADCONNECTOR_WIDGET_ID?: string;
  readonly PUBLIC_GOOGLE_SITE_VERIFICATION?: string;

  // ── OneSignal — unused; left declared so the integration type-checks.
  readonly PUBLIC_ONESIGNAL_APP_ID?: string;
  readonly PUBLIC_ONESIGNAL_SAFARI_WEB_ID?: string;
  readonly PUBLIC_ONESIGNAL_NOTIFY_BUTTON?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
