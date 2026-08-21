// src/integrations/icons/index.ts
// Central exports for the icon integration

export {
  renderIcon,
  renderStringIcon,
  renderObjectIcon,
  getIconComponent,
  getIconName,
  getLibraryName,
  parseIconString,
  isEmoji,
  isValidIconString,
  iconSizeMap,
  type IconSize,
  type IconRenderOptions,
} from './utils/iconLoader';

export { iconMap, type IconKey } from './utils/iconMap.generated';

export {
  ICON_LIBRARIES,
  SCANNABLE_PREFIXES,
  ICON_ALIAS_MAP,
  normalizeLibraryPrefix,
} from './utils/iconConfig.js';
