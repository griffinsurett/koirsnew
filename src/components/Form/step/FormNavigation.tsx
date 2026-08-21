// src/components/forms/FormNavigation.tsx
/**
 * FormNavigation Component
 *
 * Navigation controls for multi-step forms.
 * Automatically shows/hides previous/next/submit buttons based on current step.
 */

import { useFormContext } from "../FormContext";
import type { FormNavigationProps } from "../types";

export default function FormNavigation({
  previousLabel = "Previous",
  nextLabel = "Next",
  submitLabel = "Submit",
  previousButtonClassName = "px-6 py-2 border border-surface rounded-lg text-text hover:bg-text/5 transition-colors",
  nextButtonClassName = "px-6 py-2 bg-primary text-bg rounded-lg hover:bg-primary-700 transition-colors",
  submitButtonClassName = "px-6 py-2 bg-green-600 text-bg rounded-lg hover:bg-green-700 transition-colors",
  navigationContainerClassName = "flex items-center justify-between mt-8 pt-6 border-t border-surface",
  showStepIndicator = false,
  stepIndicatorClassName = "text-sm text-text",
  disablePrevious = false,
  disableNext = false,
  hideOnFirstStep = "previous",
  hideOnLastStep = "next",
}: FormNavigationProps) {
  const form = useFormContext();

  // Only render for multi-step forms
  if (!form.isMultiStep) {
    return null;
  }

  const {
    currentStep,
    totalSteps,
    isFirstStep,
    isLastStep,
    previousStep,
    nextStep,
    isSubmitting,
  } = form;

  // Determine what to show on first step
  const showPrevious = !(
    isFirstStep &&
    (hideOnFirstStep === "previous" || hideOnFirstStep === "all")
  );

  // Determine what to show on last step
  const showNext = !(
    isLastStep &&
    (hideOnLastStep === "next" || hideOnLastStep === "all")
  );

  return (
    <div className={navigationContainerClassName}>
      {/* Previous Button */}
      <div>
        {showPrevious && (
          <button
            type="button"
            onClick={previousStep}
            disabled={disablePrevious || isSubmitting}
            className={previousButtonClassName}
            aria-label="Go to previous step"
          >
            {previousLabel}
          </button>
        )}
      </div>

      {/* Step Indicator */}
      {showStepIndicator && (
        <div className={stepIndicatorClassName} aria-live="polite">
          Step {currentStep + 1} of {totalSteps}
        </div>
      )}

      {/* Next/Submit Button */}
      <div>
        {isLastStep ? (
          <button
            type="submit"
            disabled={isSubmitting}
            className={submitButtonClassName}
            aria-label="Submit form"
          >
            {isSubmitting ? "Submitting..." : submitLabel}
          </button>
        ) : (
          showNext && (
            <button
              type="button"
              onClick={nextStep}
              disabled={disableNext || isSubmitting}
              className={nextButtonClassName}
              aria-label="Go to next step"
            >
              {nextLabel}
            </button>
          )
        )}
      </div>
    </div>
  );
}

FormNavigation.displayName = "FormNavigation";
