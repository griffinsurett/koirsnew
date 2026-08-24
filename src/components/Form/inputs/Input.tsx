// src/components/Form/inputs/Input.tsx
/**
 * Hybrid Input Component
 * Pure TSX component - uses HTML5 validation
 */

import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label?: string;

  // Styling
  containerClassName?: string;
  labelClassName?: string;
  inputClassName?: string;

  // Control visibility
  showLabel?: boolean;
}

export default function Input({
  name,
  label,
  required = false,
  containerClassName = "mb-[var(--spacing-md)] w-full flex flex-col text-left",
  labelClassName = "text-primary mb-[var(--spacing-xs)] font-light text-left",
  inputClassName = "border border-[var(--color-border)] transition-colors duration-300 py-[var(--spacing-sm)] px-[var(--spacing-md)] w-full bg-bg placeholder:text-[var(--color-primary)] text-primary rounded-md",
  showLabel = true,
  ...inputProps
}: InputProps) {
  const combinedInputClassName = inputClassName;

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

      <input
        id={name}
        name={name}
        className={combinedInputClassName}
        required={required}
        {...inputProps}
      />
    </div>
  );
}
