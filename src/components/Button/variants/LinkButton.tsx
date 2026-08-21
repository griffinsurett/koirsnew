// src/components/Button/variants/LinkButton.tsx
/**
 * Link Button Variant
 * 
 * Styled as an underlined text link rather than a button.
 * Uses link-specific styling classes instead of button classes.
 * Can still render as either <a> or <button> based on href.
 */

import { ButtonBase, type ButtonProps } from '../Button';
import { renderButtonIcon } from '../utils';

export default function LinkButton({
  leftIcon,
  rightIcon,
  className = '',
  size = 'md',
  children,
  ...props
}: ButtonProps) {
  // Map size to link-specific classes (no padding like buttons)
  const sizeClass = size === 'sm' ? 'link-sm' : size === 'lg' ? 'link-lg' : 'link-md';
  const baseClasses = `link-base ${sizeClass} p-0 ${className}`.trim();

  return (
    <ButtonBase
      {...props}
      className={baseClasses}
      leftIcon={renderButtonIcon(leftIcon, size)}
      rightIcon={renderButtonIcon(rightIcon, size)}
      size={size}
    >
      {children}
    </ButtonBase>
  );
}
