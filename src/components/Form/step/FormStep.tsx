// src/components/Form/step/FormStep.tsx
/**
 * FormStep Component
 * Wraps a single step in a multi-step form
 */

import type { ReactNode } from "react";

interface FormStepProps {
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

function FormStep({
  children,
  title,
  description,
  className = "",
}: FormStepProps) {
  return (
    <div className={className}>
      {(title || description) && (
        <div className="mb-6">
          {title && (
            <h3 className="text-2xl font-bold text-heading mb-2">{title}</h3>
          )}
          {description && <p className="text-text">{description}</p>}
        </div>
      )}

      {children}
    </div>
  );
}

FormStep.displayName = "FormStep";

export default FormStep;
