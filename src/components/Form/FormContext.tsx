// src/components/Form/FormContext.tsx
/**
 * Lightweight Form Context used by optional helpers (navigation, indicators).
 * State is fully managed inside FormWrapper and exposed here for composition.
 */

import { createContext, useContext } from "react";

export interface FormContextValue {
  isMultiStep: boolean;
  currentStep: number;
  totalSteps: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  isSubmitting: boolean;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: number) => void;
}

export const FormContext = createContext<FormContextValue | null>(null);

export function useFormContext(): FormContextValue {
  const context = useContext(FormContext);

  if (!context) {
    throw new Error(
      "useFormContext must be used within a FormContext.Provider. " +
        "Wrap your form content with FormWrapper."
    );
  }

  return context;
}
