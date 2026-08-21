// src/components/Form/inputs/Select.tsx
/**
 * Hybrid Select Component
 * Pure TSX component - uses HTML5 validation
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
  labelClassName = "text-primary mb-[var(--spacing-xs)] font-thin text-left",
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
