// src/components/Button/utils.tsx
import { isValidElement, type ReactNode } from 'react';
import Icon from '@/components/Icon';
import type { IconSize } from '@/integrations/icons';
import type { ButtonSize } from './Button';

/**
 * Button size and icon size aren't the same scale — `lg` widens a button's
 * padding but shouldn't jump the glyph to 24px, which reads oversized next to
 * the label (the 2025 buttons used a 20px phone icon at CTA size). Keep the
 * glyph one step below the button so it stays proportionate to the text.
 */
function mapButtonSizeToIconSize(size?: ButtonSize): IconSize {
  switch (size) {
    case 'sm':
      return 'sm';
    case 'lg':
      return 'md';
    default:
      return 'md';
  }
}

export function renderButtonIcon(
  icon: string | ReactNode | undefined,
  size?: ButtonSize
): ReactNode {
  if (!icon) return null;

  const iconSize = mapButtonSizeToIconSize(size);
  if (isValidElement(icon)) return icon;
  if (typeof icon === 'string') return <Icon icon={icon} size={iconSize} />;
  return null;
}
