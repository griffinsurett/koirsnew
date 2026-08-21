// src/components/LoopComponents/Menu/MobileMenuItem.tsx
/**
 * Mobile Menu Item Component
 *
 * Collapsible menu item for mobile navigation.
 * Accessible navigation pattern with proper ARIA.
 * Handles parent items with hasPage: false (no URL) by showing expand button only.
 */

import { useState } from "react";

interface MobileMenuItemProps {
  title: string;
  url?: string;
  slug: string;
  children?: any[];
  openInNewTab?: boolean;
  onNavigate: () => void;
  level?: number;
}

export default function MobileMenuItem({
  title,
  url,
  slug,
  children = [],
  openInNewTab = false,
  onNavigate,
  level = 0,
}: MobileMenuItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = children.length > 0;
  const indent = level * 16; // 16px per level

  // Parent with children - always show expand/collapse button
  if (hasChildren) {
    // If parent has a URL, show clickable link + expand button
    // If parent has no URL (hasPage: false), only show expand button
    const hasUrl = Boolean(url);

    const handleParentClick = () => {
      if (hasUrl) {
        onNavigate();
      } else {
        setIsExpanded(!isExpanded);
      }
    };

    return (
      <li>
        <div
          className="flex items-center justify-between hover:bg-text/5 rounded-md transition-colors"
          style={{ paddingLeft: `${indent + 16}px` }}
        >
          {hasUrl ? (
            <a
              href={url}
              onClick={onNavigate}
              target={openInNewTab ? "_blank" : undefined}
              rel={openInNewTab ? "noopener noreferrer" : undefined}
              className="flex-1 py-3 font-medium text-heading hover:text-primary transition-colors"
            >
              {title}
            </a>
          ) : (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex-1 py-3 text-left font-medium text-heading hover:text-primary transition-colors"
            >
              {title}
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-3 text-text hover:text-primary transition-colors"
            aria-expanded={isExpanded}
            aria-controls={`mobile-submenu-${slug}`}
            aria-label={isExpanded ? `Collapse ${title}` : `Expand ${title}`}
            type="button"
          >
            <svg
              className={`w-5 h-5 transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>

        {isExpanded && (
          <ul id={`mobile-submenu-${slug}`} className="mt-1 space-y-1">
            {children.map((child) => (
              <MobileMenuItem
                key={child.id}
                {...child}
                onNavigate={onNavigate}
                level={level + 1}
              />
            ))}
          </ul>
        )}
      </li>
    );
  }

  // Leaf item with no children - must have URL to be clickable
  if (!url) {
    return null; // Don't render items without URL and without children
  }

  return (
    <li>
      <a
        href={url}
        onClick={onNavigate}
        target={openInNewTab ? "_blank" : undefined}
        rel={openInNewTab ? "noopener noreferrer" : undefined}
        className="block py-3 px-4 text-text hover:text-primary hover:bg-text/5 rounded-md transition-colors"
        style={{ paddingLeft: `${indent + 16}px` }}
      >
        {title}
      </a>
    </li>
  );
}
