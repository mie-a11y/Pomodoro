import type { TimerSettings } from '../../types';
import { TimerSection } from './TimerSection';
import { AudioSection } from './AudioSection';
import { ActionButtons } from './ActionButtons';

interface SettingsContentProps {
  settings: TimerSettings;
  onSettingsChange: (settings: TimerSettings) => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
  isMuted: boolean;
  onMutedChange: (muted: boolean) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function SettingsContent({
  settings,
  onSettingsChange,
  volume,
  onVolumeChange,
  isMuted,
  onMutedChange,
  onSave,
  onCancel,
}: SettingsContentProps) {
  const updateField = (field: keyof TimerSettings, value: number) => {
    onSettingsChange({ ...settings, [field]: value });
  };

  return (
    <>
      <TimerSection settings={settings} onFieldChange={updateField} />
      <AudioSection
        volume={volume}
        onVolumeChange={onVolumeChange}
        isMuted={isMuted}
        onMutedChange={onMutedChange}
      />
      <ActionButtons onSave={onSave} onCancel={onCancel} />
    </>
  );
}
