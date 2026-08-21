// src/utils/schema/faqSchema.ts
/**
 * FAQPage schema — built from the FAQ items a variant is rendering.
 *
 * Content-specific: lives with the component that displays the FAQs (the
 * accordion variant), so the schema always matches the questions visible on
 * the page. Question = title, answer = raw body (`content`) or `description`.
 */
interface FaqItem {
  title?: string;
  content?: string;
  description?: string;
}

export function buildFaqSchema(items: FaqItem[]): object | null {
  const entries = (Array.isArray(items) ? items : [])
    .map((item) => {
      const question = (item.title ?? "").trim();
      const answer = String(item.content ?? item.description ?? "")
        .replace(/\s+/g, " ")
        .trim();
      return question && answer ? { question, answer } : null;
    })
    .filter(Boolean) as Array<{ question: string; answer: string }>;

  if (entries.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((e) => ({
      "@type": "Question",
      name: e.question,
      acceptedAnswer: { "@type": "Answer", text: e.answer },
    })),
  };
}
