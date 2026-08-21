// src/components/Button/variants/SecondaryButton.tsx
/**
 * Secondary Button Variant
 *
 * Outlined button with transparent background.
 * Used for secondary actions that need less emphasis than primary buttons.
 */

import { ButtonBase, type ButtonProps } from "../Button";
import { renderButtonIcon } from "../utils";

export default function SecondaryButton({
  leftIcon,
  rightIcon,
  className = "",
  ...props
}: ButtonProps) {
  // Outlined style with blue border
  const variantClasses =
    "bg-accent text-primary hover:bg-secondary focus:ring-accent";

  return (
    <ButtonBase
      {...props}
      className={`${variantClasses} ${className}`}
      leftIcon={renderButtonIcon(leftIcon, props.size)}
      rightIcon={renderButtonIcon(rightIcon, props.size)}
    />
  );
}
