/**
 * Settings - 设置弹窗（重构版）
 * 任务 #37-41, #113-118
 */

import { useState, useCallback } from 'react';
import { useStore } from '../stores/useStore';
import { Modal } from './ui/Modal';
import { Slider } from './ui/Slider';
import { Toggle } from './ui/Toggle';
import { Stepper } from './Stepper';
import type { TimerSettings } from '../types';

// 音量图标组件
function VolumeIcon({ level, muted }: { level: number; muted: boolean }) {
  if (muted || level === 0) {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
      </svg>
    );
  }
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    </svg>
  );
}

interface SettingsContentProps {
  initialSettings: TimerSettings;
  initialVolume: number;
  initialMuted: boolean;
  onSave: (settings: TimerSettings, volume: number, muted: boolean) => void;
  onCancel: () => void;
}

function SettingsContent({
  initialSettings,
  initialVolume,
  initialMuted,
  onSave,
  onCancel,
}: SettingsContentProps) {
  const [draftSettings, setDraftSettings] = useState(initialSettings);
  const [draftVolume, setDraftVolume] = useState(initialVolume);
  const [draftMuted, setDraftMuted] = useState(initialMuted);

  const handleSave = useCallback(() => {
    onSave(draftSettings, draftVolume, draftMuted);
  }, [draftSettings, draftVolume, draftMuted, onSave]);

  return (
    <div className="p-6">
      {/* 头部区域 */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center">
          <svg className="w-5 h-5 text-[var(--color-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text)]">设置</h2>
          <p className="text-sm text-[var(--color-text-muted)]">调整您的专注体验</p>
        </div>
      </div>

      {/* 时间设置分组 */}
      <div className="bg-[var(--color-surface)] rounded-xl p-4 mb-4 border border-[var(--color-border)]">
        <h3 className="text-sm font-medium text-[var(--color-primary)] mb-2 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          时间设置
        </h3>

        <Stepper
          label="工作时长"
          value={draftSettings.workDuration / 60}
          onChange={(v) => setDraftSettings({ ...draftSettings, workDuration: v * 60 })}
          min={1}
          max={60}
          unit="分钟"
        />

        <Stepper
          label="短休息"
          value={draftSettings.shortBreak / 60}
          onChange={(v) => setDraftSettings({ ...draftSettings, shortBreak: v * 60 })}
          min={1}
          max={30}
          unit="分钟"
        />

        <Stepper
          label="长休息"
          value={draftSettings.longBreak / 60}
          onChange={(v) => setDraftSettings({ ...draftSettings, longBreak: v * 60 })}
          min={5}
          max={60}
          unit="分钟"
        />

        <Stepper
          label="长休息间隔"
          value={draftSettings.longBreakInterval}
          onChange={(v) => setDraftSettings({ ...draftSettings, longBreakInterval: v })}
          min={2}
          max={10}
          unit="轮"
        />
      </div>

      {/* 音频设置分组 */}
      <div className="bg-[var(--color-surface)] rounded-xl p-4 mb-6 border border-[var(--color-border)]">
        <h3 className="text-sm font-medium text-[var(--color-primary)] mb-4 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
          音频设置
        </h3>

        {/* 音量滑块 */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
              <VolumeIcon level={draftVolume} muted={draftMuted} />
              <span className="text-sm">音量</span>
            </div>
            <span className="text-sm font-medium text-[var(--color-text)]">
              {Math.round(draftVolume * 100)}%
            </span>
          </div>
          <Slider
            value={draftVolume}
            onChange={setDraftVolume}
            min={0}
            max={1}
            step={0.05}
            disabled={draftMuted}
          />
        </div>

        {/* 静音开关 */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--color-text-muted)]">静音</span>
          <Toggle
            checked={draftMuted}
            onChange={setDraftMuted}
            aria-label="切换静音"
          />
        </div>
      </div>

      {/* 底部按钮组 */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl border border-[var(--color-border-strong)]
            text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]
            transition-colors duration-200 font-medium"
        >
          取消
        </button>
        <button
          onClick={handleSave}
          className="flex-1 py-3 rounded-xl bg-[var(--color-primary)]
            text-white hover:bg-[var(--color-primary-dark)]
            transition-colors duration-200 font-medium
            active:scale-[0.98]"
        >
          保存
        </button>
      </div>
    </div>
  );
}

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

  const handleSave = useCallback((newSettings: TimerSettings, newVolume: number, newMuted: boolean) => {
    updateSettings(newSettings);
    setVolume(newVolume);
    if (newMuted !== isMuted) {
      toggleMute();
    }
    closeSettings();
  }, [updateSettings, setVolume, isMuted, toggleMute, closeSettings]);

  return (
    <Modal isOpen={isSettingsOpen} onClose={closeSettings}>
      <SettingsContent
        initialSettings={settings}
        initialVolume={volume}
        initialMuted={isMuted}
        onSave={handleSave}
        onCancel={closeSettings}
      />
    </Modal>
  );
}
