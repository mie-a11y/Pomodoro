import { useTimer } from '../hooks/useTimer';
import { useStore } from '../stores/useStore';

export function Controls() {
  const { status, toggle, reset } = useTimer();
  const openSettings = useStore((state) => state.openSettings);
  const openStats = useStore((state) => state.openStats);

  const isRunning = status === 'running';

  return (
    <div className="flex items-center justify-center gap-4 py-6 px-4">
      {/* Stats button */}
      <button
        onClick={openStats}
        className="w-12 h-12 rounded-full flex items-center justify-center
                   bg-white/50 hover:bg-white/80 transition-colors
                   text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        aria-label="统计"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 20h4V10H4v10zm6 0h4V4h-4v16zm6 0h4v-8h-4v8z" />
        </svg>
      </button>

      {/* Reset button */}
      <button
        onClick={reset}
        className="w-12 h-12 rounded-full flex items-center justify-center
                   bg-white/50 hover:bg-white/80 transition-colors
                   text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        aria-label="重置"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>

      {/* Main toggle button */}
      <button
        onClick={toggle}
        className="w-20 h-20 rounded-full flex items-center justify-center
                   bg-[var(--color-primary)] hover:opacity-90 transition-opacity
                   text-white shadow-lg"
        aria-label={isRunning ? '暂停' : '开始'}
      >
        {isRunning ? (
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
        ) : (
          <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      {/* Settings button */}
      <button
        onClick={openSettings}
        className="w-12 h-12 rounded-full flex items-center justify-center
                   bg-white/50 hover:bg-white/80 transition-colors
                   text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        aria-label="设置"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </div>
  );
}
