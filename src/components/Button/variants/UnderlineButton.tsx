// src/components/Button/variants/UnderlineButton.tsx
/**
 * Underline Button Variant
 *
 * Text-only underlined link. Ported from the 2025 site's `underline` variant,
 * which was used for inline/tertiary actions where a filled button was too
 * heavy. Keeps the legacy name so old-site markup ports over unchanged.
 */

import { ButtonBase, type ButtonProps } from "../Button";
import { renderButtonIcon } from "../utils";

export default function UnderlineButton({
  leftIcon,
  rightIcon,
  className = "",
  size = "md",
  children,
  ...props
}: ButtonProps) {
  // No button padding — this reads as text, matching the legacy variant.
  const sizeClass = size === "sm" ? "link-sm" : size === "lg" ? "link-lg" : "link-md";
  const variantClasses = "underline text-primary hover:text-secondary";

  return (
    <ButtonBase
      {...props}
      className={`link-base ${sizeClass} p-0 ${variantClasses} ${className}`.trim()}
      leftIcon={renderButtonIcon(leftIcon, size)}
      rightIcon={renderButtonIcon(rightIcon, size)}
      size={size}
    >
      {children}
    </ButtonBase>
  );
}
