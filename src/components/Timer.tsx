import { useTimer } from '../hooks/useTimer';

export function Timer() {
  const { formattedTime, isWorkSession, currentSession } = useTimer();

  return (
    <div className="flex flex-col items-center justify-center py-4">
      {/* Session indicator */}
      <div className="text-sm text-[var(--color-text-muted)] mb-2">
        {isWorkSession ? '专注中' : '休息中'} · 第 {currentSession} 轮
      </div>

      {/* Time display */}
      <div
        className="text-6xl sm:text-7xl md:text-8xl font-light tracking-wider"
        style={{ fontFamily: 'var(--font-timer)' }}
      >
        {formattedTime}
      </div>
    </div>
  );
}
