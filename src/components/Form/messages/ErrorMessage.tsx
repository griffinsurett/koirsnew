// src/components/Form/messages/ErrorMessage.tsx
/**
 * ErrorMessage Component
 * Internal component used by FormWrapper
 */

import type { ReactNode } from "react";
import FormMessage from "./FormMessage";

interface ErrorMessageProps {
  children: ReactNode;
  onDismiss?: () => void;
}

export default function ErrorMessage({ children, onDismiss }: ErrorMessageProps) {
  return (
    <FormMessage type="error" onDismiss={onDismiss}>
      {children}
    </FormMessage>
  );
}
