// src/components/Form/messages/FormMessage.tsx
/**
 * FormMessage Component
 * Internal component used by FormWrapper
 */

import type { ReactNode } from "react";

export type MessageType = "success" | "error" | "loading";

interface FormMessageProps {
  type: MessageType;
  children: ReactNode;
  onDismiss?: () => void;
}

const messageStyles: Record<MessageType, string> = {
  success: "bg-green-50 text-green-800 border border-green-200",
  error: "bg-red-50 text-red-800 border border-red-200",
  loading: "bg-primary/10 text-primary border border-primary-200",
};

const messageIcons: Record<MessageType, string> = {
  success: "✓",
  error: "⚠️",
  loading: "",
};

export default function FormMessage({
  type,
  children,
  onDismiss,
}: FormMessageProps) {
  if (type === "loading") {
    return (
      <div
        className="flex items-center justify-center p-4 mb-4"
        role="status"
        aria-live="polite"
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-MainDark" />
        <span className="ml-3 text-text">{children}</span>
      </div>
    );
  }

  return (
    <div
      className={`p-4 rounded-lg mb-4 ${messageStyles[type]}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2">
          <span className="flex-shrink-0" aria-hidden="true">
            {messageIcons[type]}
          </span>
          <div className="flex-1">{children}</div>
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="flex-shrink-0 ml-4 text-current opacity-50 hover:opacity-100 transition-opacity"
            aria-label="Dismiss message"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
