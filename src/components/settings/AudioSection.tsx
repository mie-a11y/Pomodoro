import { Slider } from '../ui/Slider';
import { Toggle } from '../ui/Toggle';

interface AudioSectionProps {
  volume: number;
  onVolumeChange: (volume: number) => void;
  isMuted: boolean;
  onMutedChange: (muted: boolean) => void;
}

export function AudioSection({ volume, onVolumeChange, isMuted, onMutedChange }: AudioSectionProps) {
  return (
    <section className="mb-6">
      <h3 className="mb-2.5 text-xs font-medium uppercase tracking-widest text-[var(--color-text-subtle)]">
        音频
      </h3>
      <div className="rounded-2xl border border-white/30 bg-white/30 backdrop-blur-sm">
        {/* Volume */}
        <div className="flex flex-col gap-2.5 px-4 py-3.5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--color-text)]">音量</span>
            <span className="font-mono text-[13px] text-[var(--color-text-muted)]">
              {Math.round(volume * 100)}%
            </span>
          </div>
          <Slider value={volume} onChange={onVolumeChange} disabled={isMuted} />
        </div>

        <div className="mx-4 h-px bg-black/[0.04]" />

        {/* Mute */}
        <div className="flex items-center justify-between px-4 py-3.5">
          <span className="text-sm text-[var(--color-text)]">静音</span>
          <Toggle checked={isMuted} onChange={onMutedChange} />
        </div>
      </div>
    </section>
  );
}
