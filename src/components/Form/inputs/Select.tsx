// src/components/Form/inputs/Select.tsx
/**
 * Hybrid Select Component
 * Pure TSX component - uses HTML5 validation
 *
 * The lone survivor of the Formspree form system. Every other file under
 * `components/Form/inputs|step|messages` went with it when forms moved to Go
 * High Level embeds — but the (commented-out) accessibility panel imports THIS
 * one, at `integrations/preferences/shared/ui/SelectControl.tsx`. Deleting it
 * would break restoring that panel, which AGENTS.md keeps as an uncomment-only
 * operation. Not used by any form; do not wire it into one.
 */

import type { SelectHTMLAttributes } from "react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  name: string;
  label?: string;
  options: SelectOption[];
  placeholder?: string;

  // Styling
  containerClassName?: string;
  labelClassName?: string;
  selectClassName?: string;

  // Control
  showLabel?: boolean;
}

export default function Select({
  name,
  label,
  required = false,
  options,
  placeholder = "Select an option",
  containerClassName = "mb-[var(--spacing-md)] w-full flex flex-col text-left",
  labelClassName = "text-primary mb-[var(--spacing-xs)] font-light text-left",
  selectClassName = "border border-[var(--color-border)] transition-colors duration-300 py-[var(--spacing-sm)] px-[var(--spacing-md)] w-full bg-bg placeholder:text-[var(--color-primary)] text-primary rounded-md",
  showLabel = true,
  ...selectProps
}: SelectProps) {
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

      <select
        id={name}
        name={name}
        className={selectClassName}
        required={required}
        {...selectProps}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
