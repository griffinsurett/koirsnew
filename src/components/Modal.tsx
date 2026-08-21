// src/components/Modal.tsx
import {
  useState,
  useEffect,
  useRef,
  memo,
  type ReactNode,
  type ReactPortal,
  type MouseEvent,
} from "react";
import { createPortal } from "react-dom";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  closeButton?: boolean;
  closeButtonClass?: string;
  overlayClass?: string;
  className?: string;
  allowScroll?: boolean;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  position?:
    | "center"
    | "bottom-left"
    | "bottom-right"
    | "top-left"
    | "top-right";
  ssr?: boolean;
}

// Cache portal root - only create once
let portalRoot: HTMLElement | null = null;

function getPortalRoot(): HTMLElement {
  if (portalRoot) return portalRoot;

  if (typeof document === "undefined") {
    return null as any; // SSR safety
  }

  portalRoot = document.body;
  return portalRoot;
}

// Position classes - computed once
const POSITION_CLASSES = {
  center: "flex items-center justify-center",
  "bottom-left": "flex items-end justify-start p-4",
  "bottom-right": "flex items-end justify-end p-4",
  "top-left": "flex items-start justify-start p-4",
  "top-right": "flex items-start justify-end p-4",
} as const;

function Modal({
  isOpen,
  onClose,
  children,
  closeButton = true,
  closeButtonClass = "absolute top-4 right-4",
  overlayClass = "bg-black bg-opacity-50",
  className = "bg-bg shadow-xl p-6 rounded-lg max-w-lg w-full mx-4",
  allowScroll = false,
  ariaLabel,
  ariaDescribedBy,
  position = "center",
  ssr = true,
}: ModalProps): ReactPortal | null {
  const [mounted, setMounted] = useState<boolean>(ssr ? isOpen : false);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Only mount on client side if ssr is false
  useEffect(() => {
    if (!ssr && !mounted) {
      setMounted(true);
    }
  }, [ssr, mounted]);

  // Track isOpen state for animations
  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      // Store previously focused element
      previousFocusRef.current = document.activeElement as HTMLElement;
    }
  }, [isOpen]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!mounted || !isOpen || allowScroll) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    // Prevent layout shift from scrollbar
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [mounted, isOpen, allowScroll]);

  // Handle Escape key - passive listener for better performance
  useEffect(() => {
    if (!mounted || !isOpen) return;

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown, { passive: true });
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mounted, isOpen, onClose]);

  // Focus management - only when modal opens
  useEffect(() => {
    if (mounted && isOpen && modalRef.current) {
      // Small delay to ensure modal is rendered
      requestAnimationFrame(() => {
        modalRef.current?.focus();
      });
    }

    return () => {
      // Restore focus when unmounting
      if (!isOpen && previousFocusRef.current) {
        requestAnimationFrame(() => {
          previousFocusRef.current?.focus();
        });
      }
    };
  }, [mounted, isOpen]);

  // Unmount modal after exit animation completes
  const handleAnimationEnd = (): void => {
    if (!isOpen) {
      setMounted(false);
    }
  };

  const handleOverlayClick = (e: MouseEvent<HTMLDivElement>): void => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleModalClick = (e: MouseEvent<HTMLDivElement>): void => {
    e.stopPropagation();
  };

  // Prevent invisible modal from catching clicks when not open
  const modalPointerEventsClass = isOpen
    ? "pointer-events-auto"
    : "pointer-events-none";

  // Don't render during SSR if ssr is false
  if (!ssr && !mounted) return null;
  if (!mounted) return null;

  const root = getPortalRoot();
  if (!root) return null;

  // Render modal as a portal to document.body
  return createPortal(
    <div
      className={`fixed inset-0 z-[10001] ${
        POSITION_CLASSES[position]
      } ${overlayClass} transform transition-opacity duration-300 ease-in-out ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={handleOverlayClick}
      onTransitionEnd={handleAnimationEnd}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
    >
      <div
        ref={modalRef}
        className={`relative ${className} ${modalPointerEventsClass} transform-gpu transition-all duration-300 ease-in-out origin-center ${
          isOpen
            ? "scale-100 translate-y-0 opacity-100"
            : "scale-95 translate-y-4 opacity-0"
        }`}
        onClick={handleModalClick}
        tabIndex={-1}
      >
        {closeButton && (
          <button
            onClick={onClose}
            className={closeButtonClass}
            aria-label="Close modal"
            type="button"
          >
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
        {children}
      </div>
    </div>,
    root
  );
}

// Memoize to prevent unnecessary re-renders
export default memo(Modal);
