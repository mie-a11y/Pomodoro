/**
 * Slider - 自定义滑块组件
 * 任务 #27-31, #107-109
 */

import { useRef, useCallback, useState, useEffect } from 'react';

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}

export function Slider({
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.1,
  disabled = false,
}: SliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // 计算值对应的百分比
  const percentage = ((value - min) / (max - min)) * 100;

  // #109: 根据位置计算值
  const calculateValue = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return value;

      const rect = trackRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, x / rect.width));
      const rawValue = min + ratio * (max - min);

      // 对齐到 step
      const steppedValue = Math.round(rawValue / step) * step;
      return Math.max(min, Math.min(max, steppedValue));
    },
    [min, max, step, value]
  );

  // #107: 鼠标拖动
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return;
      e.preventDefault();
      setIsDragging(true);
      onChange(calculateValue(e.clientX));
    },
    [disabled, calculateValue, onChange]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      onChange(calculateValue(e.clientX));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, calculateValue, onChange]);

  // #108: 触摸拖动
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled) return;
      setIsDragging(true);
      onChange(calculateValue(e.touches[0].clientX));
    },
    [disabled, calculateValue, onChange]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging || disabled) return;
      e.preventDefault();
      onChange(calculateValue(e.touches[0].clientX));
    },
    [isDragging, disabled, calculateValue, onChange]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // #109: 点击轨道跳转
  const handleTrackClick = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return;
      onChange(calculateValue(e.clientX));
    },
    [disabled, calculateValue, onChange]
  );

  return (
    <div
      ref={trackRef}
      className={`relative h-2 rounded-full cursor-pointer select-none
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      style={{ backgroundColor: 'var(--color-border-strong)' }}
      onClick={handleTrackClick}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* #28: 轨道填充 */}
      <div
        className="absolute inset-y-0 left-0 rounded-full transition-all duration-75"
        style={{
          width: `${percentage}%`,
          background: 'linear-gradient(90deg, var(--color-primary-light), var(--color-primary))',
        }}
      />

      {/* #29: 把手 */}
      <div
        className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2
          w-5 h-5 rounded-full bg-white border-2 border-[var(--color-primary)]
          shadow-md transition-transform duration-75
          ${isDragging ? 'scale-110' : 'hover:scale-105'}`}
        style={{ left: `${percentage}%` }}
      />
    </div>
  );
}
