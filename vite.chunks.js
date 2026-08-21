// vite.chunks.js

export function manualChunks(id) {
  // Core React runtime (kept small and shared)
  if (
    id.includes('node_modules/react') ||
    id.includes('node_modules/react-dom') ||
    id.includes('node_modules/scheduler')
  ) {
    return 'react-core';
  }
  
  // Consent system (lazy loaded)
  if (id.includes('/components/preferences/consent/')) {
    return 'consent';
  }
  
  // Accessibility system (lazy loaded)
  if (id.includes('/components/preferences/accessibility/')) {
    return 'accessibility';
  }
  
  // Language switcher (lazy loaded)
  if (id.includes('/components/preferences/language/')) {
    return 'language';
  }
  
  // Modal system
  if (id.includes('/components/Modal')) {
    return 'modal';
  }
  
  // Icons
  if (id.includes('react-icons')) {
    return 'icons';
  }
  
  // Other node_modules
  if (id.includes('node_modules')) {
    return 'vendor';
  }
}

export function assetFileNames(assetInfo) {
  if (assetInfo.name?.endsWith('.css')) {
    if (assetInfo.name.includes('global') || assetInfo.name.includes('base')) {
      return 'assets/critical-[hash][extname]';
    }
    return 'assets/styles-[hash][extname]';
  }
  return 'assets/[name]-[hash][extname]';
}
