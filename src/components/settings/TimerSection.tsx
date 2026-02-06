import type { TimerSettings } from '../../types';
import { Stepper } from '../ui/Stepper';

interface TimerSectionProps {
  settings: TimerSettings;
  onFieldChange: (field: keyof TimerSettings, value: number) => void;
}

export function TimerSection({ settings, onFieldChange }: TimerSectionProps) {
  return (
    <section className="mb-5">
      <h3 className="mb-2.5 text-xs font-medium uppercase tracking-widest text-[var(--color-text-subtle)]">
        时间
      </h3>
      <div className="rounded-2xl border border-white/30 bg-white/30 backdrop-blur-sm">
        <Stepper
          label="工作时长"
          value={settings.workDuration / 60}
          onChange={(v) => onFieldChange('workDuration', v * 60)}
          min={1}
          max={60}
          unit="分钟"
        />
        <div className="mx-4 h-px bg-black/[0.04]" />
        <Stepper
          label="短休息"
          value={settings.shortBreak / 60}
          onChange={(v) => onFieldChange('shortBreak', v * 60)}
          min={1}
          max={30}
          unit="分钟"
        />
        <div className="mx-4 h-px bg-black/[0.04]" />
        <Stepper
          label="长休息"
          value={settings.longBreak / 60}
          onChange={(v) => onFieldChange('longBreak', v * 60)}
          min={5}
          max={60}
          step={5}
          unit="分钟"
        />
        <div className="mx-4 h-px bg-black/[0.04]" />
        <Stepper
          label="长休息间隔"
          value={settings.longBreakInterval}
          onChange={(v) => onFieldChange('longBreakInterval', v)}
          min={2}
          max={10}
          unit="轮"
        />
      </div>
    </section>
  );
}
