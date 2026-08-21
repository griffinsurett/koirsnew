// src/utils/contactLinks.ts
import type { CollectionEntry } from 'astro:content';
import { formatPhoneNumber } from '@/utils/string';

export interface ContactLink {
  id: string;
  title: string;          // Display heading (e.g., "Call Us", "Email Us")
  value: string;          // Raw contact value (phone digits, email, address)
  description?: string;    // Optional subtext (e.g. hours) — no longer the value
  displayValue: string;   // Formatted value for UI (formatted phone, etc.)
  url?: string;           // Full href (mailto:, tel:, etc.)
  linkPrefix?: string;
  tags?: string[];
  icon?: any;
}

function extractData(item: any): any {
  if (!item) return {};
  if (item.data) return { ...item.data, id: item.id ?? item.data.id };
  return item;
}

export function normalizeContactLinks(items: Array<any>): ContactLink[] {
  return items
    .map((item) => {
      const data = extractData(item);
      const id = String(data.id ?? item?.id ?? 'contact');
      const linkPrefix = data.linkPrefix ?? '';
      const tags: string[] = Array.isArray(data.tags) ? data.tags : data.tags ? [data.tags] : [];

      // The contact value comes from `value` (falls back to legacy `description`
      // for safety); `title` is the heading and `description` is optional subtext.
      const rawValue = String(data.value ?? data.description ?? '');
      const title = String(data.title ?? '');

      // Format the display value (phone numbers get formatted)
      const displayValue = linkPrefix?.toLowerCase().startsWith("tel")
        ? formatPhoneNumber(rawValue)
        : rawValue;

      const url = data.url ?? (linkPrefix ? `${linkPrefix}${rawValue}` : undefined);

      return {
        id,
        title,
        value: rawValue,
        description: data.value ? (data.description ?? undefined) : undefined,
        displayValue,
        url,
        linkPrefix,
        tags,
        icon: data.icon,
      };
    })
    .filter((link) => !!link.value);
}

export async function getContactLinks(): Promise<ContactLink[]> {
  const { getPublishedCollection } = await import('@/utils/collections');
  const entries = await getPublishedCollection('contact-us');
  return normalizeContactLinks(entries as CollectionEntry<'contact-us'>[]);
}

const PHONE_CONTACT_IDS = new Set(["phone"]);
const EMAIL_CONTACT_IDS = new Set(["email", "support-email", "contact-email"]);

export const isPhoneContactId = (id?: string | null): boolean =>
  id ? PHONE_CONTACT_IDS.has(id.toLowerCase()) : false;

export const isEmailContactId = (id?: string | null): boolean =>
  id ? EMAIL_CONTACT_IDS.has(id.toLowerCase()) : false;

/**
 * The phone contact, for components that render a call CTA (header, hero).
 *
 * Exists so no component ever takes a phone number as a prop — the number lives
 * once, in the contact-us collection, and is the same source the business schema
 * reads. Ported from johns-pro-roofing along with PhoneLink.
 */
export async function getPhoneContact(): Promise<ContactLink | undefined> {
  const { byTag } = await import('@/utils/query');
  const entry = await byTag('contact-us', 'phone').first();
  if (!entry) return undefined;
  return normalizeContactLinks([entry as CollectionEntry<'contact-us'>])[0];
}
