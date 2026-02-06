import type { PlantState, PlantStage } from '../../types';
import { getPlantStage, STAGE_NAMES } from '../../utils/plantStage';

interface PlantProgressProps {
  plant: PlantState;
}

const MAX_GROWTH = 24;
const MILESTONES = [1, 3, 8];
const STAGES: PlantStage[] = ['sprout', 'young', 'mature', 'ancient'];

export function PlantProgress({ plant }: PlantProgressProps) {
  const currentStage = getPlantStage(plant.totalGrowth);
  const currentIdx = STAGES.indexOf(currentStage);
  const pct = Math.min(100, (plant.totalGrowth / MAX_GROWTH) * 100);

  // Calculate remaining pomodoros to next stage
  const thresholds = [1, 3, 8];
  const nextThreshold = thresholds.find((t) => plant.totalGrowth < t);
  const remaining = nextThreshold ? nextThreshold - plant.totalGrowth : 0;

  return (
    <section>
      <h3 className="mb-2.5 text-xs font-medium uppercase tracking-widest text-[var(--color-text-subtle)]">
        植物成长
      </h3>
      <div className="rounded-2xl border border-white/30 bg-white/30 backdrop-blur-sm">
        {/* Stage header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-primary)]/[0.07] text-[var(--color-primary)]">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 18v-8" />
                <path d="M10 10c-2-3-6-4-7-2s1 5 4 5" />
                <path d="M10 10c2-3 6-4 7-2s-1 5-4 5" />
                <path d="M10 6c0-3 2-4 3-4s1 2-1 4" />
              </svg>
            </div>
            <span className="text-base font-semibold text-[var(--color-text)]">
              {STAGE_NAMES[currentStage]}
            </span>
          </div>
          {currentStage !== 'ancient' && remaining > 0 && (
            <span className="rounded-full bg-[var(--color-accent)]/10 px-2.5 py-0.5 text-[11px] font-medium text-[var(--color-accent)]">
              还需 {remaining} 番茄
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="relative px-4 pb-2">
          <div className="relative h-1.5 overflow-hidden rounded-full bg-black/[0.04]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--color-primary-light)] to-[var(--color-primary)] transition-all duration-700 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
          {/* Milestone dots */}
          <div className="absolute inset-x-4 top-0 flex h-1.5 items-center">
            {MILESTONES.map((m) => {
              const left = (m / MAX_GROWTH) * 100;
              const reached = plant.totalGrowth >= m;
              return (
                <div
                  key={m}
                  className={`absolute h-1.5 w-1.5 -translate-x-1/2 rounded-full ${
                    reached
                      ? 'bg-white ring-1 ring-[var(--color-primary)]/40'
                      : 'bg-black/[0.08]'
                  }`}
                  style={{ left: `${left}%` }}
                />
              );
            })}
          </div>
        </div>

        {/* Stage labels */}
        <div className="flex justify-between px-4 pb-4 pt-1.5">
          {STAGES.map((stage, i) => {
            let color: string;
            if (i === currentIdx) {
              color = 'text-[var(--color-primary)] font-medium';
            } else if (i < currentIdx) {
              color = 'text-[var(--color-primary)]/40';
            } else {
              color = 'text-[var(--color-text-subtle)]/50';
            }
            return (
              <span key={stage} className={`text-[11px] tracking-wide ${color}`}>
                {STAGE_NAMES[stage]}
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}
