// src/components/forms/FormStepIndicator.tsx
/**
 * FormStepIndicator Component
 *
 * Visual progress indicator for multi-step forms.
 * Shows completed, active, and upcoming steps.
 */

import { useFormContext } from "../FormContext";
import type { FormStepIndicatorProps } from "../types";

export default function FormStepIndicator({
  className = "flex items-center justify-between mb-8",
  activeClassName = "bg-primary text-bg",
  completedClassName = "bg-green-600 text-bg",
  inactiveClassName = "bg-text text-text",
  showNumbers = true,
  showTitles = true,
}: FormStepIndicatorProps) {
  const form = useFormContext();

  // Only render for multi-step forms
  if (!form.isMultiStep) {
    return null;
  }

  const { currentStep, totalSteps } = form;

  // Create array of steps
  const steps = Array.from({ length: totalSteps }, (_, i) => ({
    number: i + 1,
    isActive: i === currentStep,
    isCompleted: i < currentStep,
  }));

  return (
    <div className={className} role="navigation" aria-label="Form progress">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;

        return (
          <div key={step.number} className="flex items-center flex-1">
            {/* Step Circle */}
            <button
              type="button"
              onClick={() => form.goToStep(index)}
              disabled={!step.isCompleted && !step.isActive}
              className={`
                w-10 h-10 rounded-full flex items-center justify-center font-semibold
                transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary
                ${step.isCompleted ? completedClassName : ""}
                ${step.isActive ? activeClassName : ""}
                ${!step.isCompleted && !step.isActive ? inactiveClassName : ""}
              `}
              aria-label={`${
                step.isCompleted
                  ? "Completed"
                  : step.isActive
                  ? "Current"
                  : "Upcoming"
              } step ${step.number}`}
              aria-current={step.isActive ? "step" : undefined}
            >
              {showNumbers &&
                (step.isCompleted ? (
                  <span aria-hidden="true">✓</span>
                ) : (
                  step.number
                ))}
            </button>

            {/* Connector Line */}
            {!isLast && (
              <div
                className={`
                  flex-1 h-1 mx-2
                  ${step.isCompleted ? "bg-green-600" : "bg-text"}
                `}
                aria-hidden="true"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
