import { useRef, useCallback } from 'react';

interface StepperProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}

export function Stepper({ label, value, onChange, min, max, step = 1, unit }: StepperProps) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    timeoutRef.current = null;
    intervalRef.current = null;
  }, []);

  const startContinuous = useCallback(
    (direction: 1 | -1) => {
      clearTimers();
      timeoutRef.current = setTimeout(() => {
        intervalRef.current = setInterval(() => {
          onChange(
            Math.min(max, Math.max(min, (prev => prev + step * direction)(value))),
          );
        }, 80);
      }, 500);
    },
    [clearTimers, onChange, min, max, step, value],
  );

  const handleStep = useCallback(
    (direction: 1 | -1) => {
      const next = value + step * direction;
      if (next >= min && next <= max) onChange(next);
    },
    [value, step, min, max, onChange],
  );

  const isMin = value <= min;
  const isMax = value >= max;

  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <span className="text-sm font-normal text-[var(--color-text)]">{label}</span>

      <div className="flex items-center gap-2">
        {/* Decrease */}
        <button
          type="button"
          disabled={isMin}
          onClick={() => handleStep(-1)}
          onMouseDown={() => !isMin && startContinuous(-1)}
          onMouseUp={clearTimers}
          onMouseLeave={clearTimers}
          onTouchEnd={clearTimers}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-transparent transition-all duration-150 hover:bg-black/[0.04] active:scale-95 active:bg-black/[0.06] disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
          aria-label="减少"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-[var(--color-text-muted)]">
            <path d="M3 7h8" />
          </svg>
        </button>

        {/* Value */}
        <span className="min-w-[40px] text-center font-mono text-[15px] font-semibold text-[var(--color-text)]">
          {value}
        </span>

        {/* Increase */}
        <button
          type="button"
          disabled={isMax}
          onClick={() => handleStep(1)}
          onMouseDown={() => !isMax && startContinuous(1)}
          onMouseUp={clearTimers}
          onMouseLeave={clearTimers}
          onTouchEnd={clearTimers}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-transparent transition-all duration-150 hover:bg-black/[0.04] active:scale-95 active:bg-black/[0.06] disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
          aria-label="增加"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-[var(--color-text-muted)]">
            <path d="M7 3v8M3 7h8" />
          </svg>
        </button>

        {/* Unit */}
        {unit && (
          <span className="w-6 text-xs text-[var(--color-text-subtle)]">{unit}</span>
        )}
      </div>
    </div>
  );
}
