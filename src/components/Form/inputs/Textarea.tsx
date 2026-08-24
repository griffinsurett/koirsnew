// src/components/Form/inputs/Textarea.tsx
/**
 * Hybrid Textarea Component
 * Pure TSX component - uses HTML5 validation
 */

import type { TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  name: string;
  label?: string;

  // Styling
  containerClassName?: string;
  labelClassName?: string;
  textareaClassName?: string;

  // Control
  showLabel?: boolean;
}

export default function Textarea({
  name,
  label,
  required = false,
  containerClassName = "mb-[var(--spacing-md)] w-full flex flex-col text-left",
  labelClassName = "text-primary mb-[var(--spacing-xs)] font-light text-left",
  textareaClassName = "border border-[var(--color-border)] transition-colors duration-300 py-[var(--spacing-sm)] px-[var(--spacing-md)] w-full bg-bg placeholder:text-[var(--color-primary)] text-primary rounded-md resize-vertical",
  showLabel = true,
  rows = 4,
  ...textareaProps
}: TextareaProps) {
  const combinedTextareaClassName = textareaClassName;

  return (
    <div className={containerClassName}>
      {showLabel && label && (
        <label htmlFor={name} className={labelClassName}>
          {label}
          {required && (
            <span className="text-primary ml-1" aria-label="required">
              *
            </span>
          )}
        </label>
      )}

      <textarea
        id={name}
        name={name}
        rows={rows}
        className={combinedTextareaClassName}
        required={required}
        {...textareaProps}
      />
    </div>
  );
}
