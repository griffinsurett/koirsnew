// src/components/LoopComponents/AccordionItem.tsx
/**
 * AccordionItem — the 2025 Koi FAQ row, ported verbatim.
 *
 * The legacy treatment is a borderless list, not a stack of cards: each row is
 * separated only by a hairline `border-t`, the question sits in `.h4 font-thin`
 * on the left with a large thin +/− on the right that tints accent on hover,
 * and the body animates open via max-height + opacity + padding (not a mount /
 * unmount) so the row slides rather than popping.
 *
 * Ported from the legacy `AccordionItem.jsx`; measured values from the built
 * 2025 site: 1px top border, 24px/32px header padding, 24px question, 36px
 * glyph, both at font-weight 100.
 */
import type { ReactNode } from "react";

export interface AccordionItemProps {
  id: string;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  isExpanded: boolean;
  onToggle: () => void;
  headerClassName?: string;
  headerSlot?: ReactNode;
}

export default function AccordionItem({
  id,
  title,
  description,
  className = "",
  children,
  isExpanded,
  onToggle,
  headerClassName = "",
  headerSlot,
}: AccordionItemProps) {
  return (
    <article
      className={`group border-t border-border transition-colors duration-500 ease-in-out ${className}`}
    >
      {/* Header — the whole row is the control, as in the legacy markup. */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={`${id}-content`}
        className={`w-full flex justify-between items-center gap-[var(--spacing-md)] py-[var(--spacing-lg)] px-[var(--spacing-xl)] cursor-pointer select-none text-left ${headerClassName}`}
      >
        {headerSlot ? (
          <span className="h4 font-thin">{headerSlot}</span>
        ) : (
          <span className="h4 font-thin">{title}</span>
        )}

        <span
          aria-hidden="true"
          className="ml-2 text-4xl font-thin leading-none transition-colors duration-500 ease-in-out group-hover:text-accent"
        >
          {isExpanded ? "−" : "+"}
        </span>
      </button>

      {/* Body — animate max-height, opacity and padding so the row slides open
          instead of snapping. Kept mounted for the transition to run. */}
      <div
        id={`${id}-content`}
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded
            ? "max-h-[1000px] opacity-100 px-[var(--spacing-xl)] pb-[var(--spacing-2xl)]"
            : "max-h-0 opacity-0 px-0 pb-0"
        }`}
      >
        {/* JSON-backed collections (the FAQ set) carry their answer in
            `description` with no MDX body, so ContentBridge has nothing to
            clone. Render the description when there's no body content. */}
        <div className="text-left text-xl lg:text-2xl">
          {description ? <p>{description}</p> : null}
          {children}
        </div>
      </div>
    </article>
  );
}
