// src/components/Form/types.ts
/**
 * Shared type definitions for optional helper components.
 */

export type NavigationHideOption = "previous" | "next" | "all" | "none";

export interface FormNavigationProps {
  previousLabel?: string;
  nextLabel?: string;
  submitLabel?: string;
  previousButtonClassName?: string;
  nextButtonClassName?: string;
  submitButtonClassName?: string;
  navigationContainerClassName?: string;
  showStepIndicator?: boolean;
  stepIndicatorClassName?: string;
  disablePrevious?: boolean;
  disableNext?: boolean;
  hideOnFirstStep?: NavigationHideOption;
  hideOnLastStep?: NavigationHideOption;
}

export interface FormStepIndicatorProps {
  className?: string;
  activeClassName?: string;
  completedClassName?: string;
  inactiveClassName?: string;
  showNumbers?: boolean;
  showTitles?: boolean;
}
