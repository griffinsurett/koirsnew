/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  // Forms are Go High Level inline embeds — no env vars. Each form's id lives
  // in the `ghl-forms` collection (src/content/ghl-forms/ghl-forms.json),
  // because a GHL form id is public by nature and belongs with the content that
  // renders it. The Formspree vars that used to live here are gone with it.

  // ── Trackers — established IDs preserved from the legacy site (§7.1).
  // The _2 variants are NOT duplicates to consolidate; both are live.
  readonly PUBLIC_GA4_ID?: string;          // loads via Partytown
  readonly PUBLIC_GA4_ID_2?: string;        // loads normally
  readonly PUBLIC_GTM_ID?: string;
  readonly PUBLIC_GTM_ID_2?: string;        // <noscript> iframe only
  readonly PUBLIC_META_PIXEL_ID?: string;
  readonly PUBLIC_META_PIXEL_ID_2?: string;
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
