// src/integrations/preferences/ui/accessibility/components/DecorativeWrapper.tsx
/**
 * Wrapper component for decorative/illustrative content.
 * Automatically hides content from screen readers and removes focusable elements from tab order.
 */
import { useEffect, useRef, type ReactNode } from "react";

interface DecorativeWrapperProps {
  children: ReactNode;
  className?: string;
}

export default function DecorativeWrapper({
  children,
  className = "",
}: DecorativeWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Find all focusable elements and remove them from tab order
    const focusableSelectors = [
      "input",
      "button",
      "select",
      "textarea",
      "a[href]",
      "[tabindex]",
    ].join(", ");

    const focusableElements = container.querySelectorAll(focusableSelectors);
    focusableElements.forEach((el) => {
      el.setAttribute("tabindex", "-1");
      el.setAttribute("aria-hidden", "true");
    });
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      aria-hidden="true"
      role="presentation"
    >
      {children}
    </div>
  );
}
