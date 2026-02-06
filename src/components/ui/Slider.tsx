import { useState, useRef, useCallback, useEffect } from 'react';

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}

export function Slider({ value, onChange, min = 0, max = 1, step = 0.05, disabled = false }: SliderProps) {
  const [dragging, setDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const calcValue = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return value;
      const rect = track.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const raw = min + ratio * (max - min);
      return Math.round(raw / step) * step;
    },
    [min, max, step, value],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return;
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setDragging(true);
      onChange(calcValue(e.clientX));
    },
    [disabled, calcValue, onChange],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging || disabled) return;
      onChange(calcValue(e.clientX));
    },
    [dragging, disabled, calcValue, onChange],
  );

  const handlePointerUp = useCallback(() => {
    setDragging(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => setDragging(false);
  }, []);

  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div
      ref={trackRef}
      className={`relative flex h-10 items-center ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      role="slider"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={Math.round(value * 100) / 100}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
    >
      {/* Track */}
      <div className="relative h-[3px] w-full rounded-full bg-black/[0.06]">
        {/* Filled */}
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-[var(--color-primary)] transition-[width] duration-75"
          style={{ width: `${pct}%` }}
        />
        {/* Thumb */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-4 w-4 rounded-full bg-[var(--color-primary)] shadow-[0_1px_4px_rgba(45,74,62,0.25)] transition-transform duration-100 ${
            dragging ? 'scale-[1.2] shadow-[0_2px_8px_rgba(45,74,62,0.3)]' : 'hover:scale-110'
          }`}
          style={{ left: `${pct}%` }}
        />
      </div>
    </div>
  );
}
