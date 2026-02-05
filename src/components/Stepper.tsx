import { useRef, useCallback, useEffect } from 'react';

interface StepperProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}

export function Stepper({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = '分钟',
}: StepperProps) {
  // #104-106: 长按定时器 refs
  const timeoutRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  const handleDecrease = useCallback(() => {
    if (value > min) {
      onChange(Math.max(min, value - step));
    }
  }, [value, min, step, onChange]);

  const handleIncrease = useCallback(() => {
    if (value < max) {
      onChange(Math.min(max, value + step));
    }
  }, [value, max, step, onChange]);

  // #106: 清理所有定时器
  const clearAllTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // #104-105: 长按开始
  const startLongPress = useCallback(
    (action: () => void) => {
      action(); // 立即执行一次
      timeoutRef.current = window.setTimeout(() => {
        intervalRef.current = window.setInterval(action, 100);
      }, 500);
    },
    []
  );

  // 组件卸载时清理
  useEffect(() => {
    return clearAllTimers;
  }, [clearAllTimers]);

  // 按钮基础样式
  const buttonClass = `
    w-11 h-11 rounded-full flex items-center justify-center
    bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)]
    border border-[var(--color-border)]
    text-[var(--color-primary)] hover:text-[var(--color-primary-dark)]
    disabled:opacity-40 disabled:cursor-not-allowed
    transition-all duration-150
    active:scale-95
    focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]
    select-none cursor-pointer
  `;

  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-[var(--color-text-muted)] font-medium">{label}</span>
      <div className="flex items-center gap-2">
        {/* #22: 减少按钮 */}
        <button
          onMouseDown={() => startLongPress(handleDecrease)}
          onMouseUp={clearAllTimers}
          onMouseLeave={clearAllTimers}
          onTouchStart={() => startLongPress(handleDecrease)}
          onTouchEnd={clearAllTimers}
          disabled={value <= min}
          className={buttonClass}
          aria-label={`减少${label}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
          </svg>
        </button>

        {/* #23: 数值显示区域 */}
        <div className="w-16 h-11 flex items-center justify-center bg-white/60 rounded-xl border border-[var(--color-border)]">
          <span className="font-mono text-lg font-semibold text-[var(--color-text)]">
            {value}
          </span>
        </div>

        {/* #22: 增加按钮 */}
        <button
          onMouseDown={() => startLongPress(handleIncrease)}
          onMouseUp={clearAllTimers}
          onMouseLeave={clearAllTimers}
          onTouchStart={() => startLongPress(handleIncrease)}
          onTouchEnd={clearAllTimers}
          disabled={value >= max}
          className={buttonClass}
          aria-label={`增加${label}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>

        {/* 单位显示 */}
        <span className="text-xs text-[var(--color-text-subtle)] w-8 ml-1">{unit}</span>
      </div>
    </div>
  );
}
