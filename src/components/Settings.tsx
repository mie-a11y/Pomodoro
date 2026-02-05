import { useStore } from '../stores/useStore';

export function Settings() {
  const {
    isSettingsOpen,
    closeSettings,
    settings,
    updateSettings,
    volume,
    setVolume,
    isMuted,
    toggleMute,
  } = useStore();

  if (!isSettingsOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
      onClick={closeSettings}
    >
      <div
        className="bg-white rounded-2xl p-6 w-80 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium">设置</h2>
          <button
            onClick={closeSettings}
            className="p-1 hover:bg-gray-100 rounded"
            aria-label="关闭"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Work Duration */}
        <div className="mb-4">
          <label className="block text-sm text-[var(--color-text-muted)] mb-1">工作时长 (分钟)</label>
          <input
            type="number"
            value={settings.workDuration / 60}
            onChange={(e) => updateSettings({ workDuration: Number(e.target.value) * 60 })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            min={1}
            max={60}
          />
        </div>

        {/* Short Break */}
        <div className="mb-4">
          <label className="block text-sm text-[var(--color-text-muted)] mb-1">短休息 (分钟)</label>
          <input
            type="number"
            value={settings.shortBreak / 60}
            onChange={(e) => updateSettings({ shortBreak: Number(e.target.value) * 60 })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            min={1}
            max={30}
          />
        </div>

        {/* Long Break */}
        <div className="mb-4">
          <label className="block text-sm text-[var(--color-text-muted)] mb-1">长休息 (分钟)</label>
          <input
            type="number"
            value={settings.longBreak / 60}
            onChange={(e) => updateSettings({ longBreak: Number(e.target.value) * 60 })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            min={5}
            max={60}
          />
        </div>

        {/* Long Break Interval */}
        <div className="mb-4">
          <label className="block text-sm text-[var(--color-text-muted)] mb-1">长休息间隔 (番茄钟数)</label>
          <input
            type="number"
            value={settings.longBreakInterval}
            onChange={(e) => updateSettings({ longBreakInterval: Number(e.target.value) })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            min={2}
            max={10}
          />
        </div>

        {/* Volume */}
        <div className="mb-4">
          <label className="block text-sm text-[var(--color-text-muted)] mb-1">
            音量 ({Math.round(volume * 100)}%)
          </label>
          <input
            type="range"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-full accent-[var(--color-primary)]"
            min={0}
            max={1}
            step={0.1}
          />
        </div>

        {/* Mute Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm">静音</span>
          <button
            onClick={toggleMute}
            className={`w-12 h-6 rounded-full transition-colors ${
              isMuted ? 'bg-gray-300' : 'bg-[var(--color-primary)]'
            }`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                isMuted ? 'translate-x-0.5' : 'translate-x-6'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
