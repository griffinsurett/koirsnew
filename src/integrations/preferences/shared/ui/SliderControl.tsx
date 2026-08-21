// Shared slider control for numeric preferences

import { useCallback, useId, useState } from "react";

interface SliderControlProps {
  label: string;
  description?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (value: number) => void;
  id?: string;
}

export default function SliderControl({
  label,
  description,
  value,
  min,
  max,
  step,
  suffix = "",
  onChange,
  id,
}: SliderControlProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const descriptionId = description ? `${controlId}-description` : undefined;
  const [engaged, setEngaged] = useState(false);

  const handleFocus = useCallback(() => setEngaged(true), []);
  const handleBlur = useCallback(() => setEngaged(false), []);
  const handlePointerUp = useCallback(() => setEngaged(false), []);

  return (
    <div className="mb-6">
      <div className="flex justify-between items-baseline mb-2">
        <label className="font-semibold text-heading" htmlFor={controlId}>
          {label}
        </label>
        <span className="text-sm font-mono text-text">
          {value}
          {suffix}
        </span>
      </div>
      {description && (
        <p id={descriptionId} className="text-sm text-text mb-3">
          {description}
        </p>
      )}
      <div
        className={`rounded-xl border px-4 py-3 bg-transparent transition ${
          engaged
            ? "border-primary/60 shadow-[0_0_0_3px_rgba(59,130,246,0.15)]"
            : "border-accent/30"
        }`}
      >
        <input
          id={controlId}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-describedby={descriptionId}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onMouseDown={handleFocus}
          onMouseUp={handlePointerUp}
          onTouchStart={handleFocus}
          onTouchEnd={handlePointerUp}
          className="w-full h-2 bg-text/20 rounded-lg appearance-none cursor-pointer accent-primary"
        />
      </div>
      <div className="flex justify-between text-xs text-text mt-2">
        <span>
          {min}
          {suffix}
        </span>
        <span>
          {max}
          {suffix}
        </span>
      </div>
    </div>
  );
}
