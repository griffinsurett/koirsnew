// src/components/Form/messages/LoadingMessage.tsx
/**
 * LoadingMessage Component
 * Internal component used by FormWrapper
 */

import type { ReactNode } from "react";
import FormMessage from "./FormMessage";

interface LoadingMessageProps {
  children: ReactNode;
}

export default function LoadingMessage({ children }: LoadingMessageProps) {
  return <FormMessage type="loading">{children}</FormMessage>;
}
