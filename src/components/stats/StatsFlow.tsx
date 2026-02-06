import type { Stats } from '../../types';

interface StatsFlowProps {
  stats: Stats;
}

const rows = [
  {
    key: 'totalPomodoros' as const,
    label: '总番茄钟',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13.5 8a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0Z" />
        <path d="m6 8 1.5 1.5L10 6.5" />
      </svg>
    ),
  },
  {
    key: 'todayPomodoros' as const,
    label: '今日完成',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="8" r="3" />
        <path d="M8 2v1.5M8 12.5V14M2 8h1.5M12.5 8H14M3.75 3.75l1.06 1.06M11.19 11.19l1.06 1.06M3.75 12.25l1.06-1.06M11.19 4.81l1.06-1.06" />
      </svg>
    ),
  },
  {
    key: 'streakDays' as const,
    label: '连续天数',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 2c0 2.5-2 4-3 5.5C4 9 4.5 11 6 12.5c.7.7 1.3 1 2 1s1.3-.3 2-1c1.5-1.5 2-3.5 1-5C10 6 8 4.5 8 2Z" />
      </svg>
    ),
  },
] as const;

export function StatsFlow({ stats }: StatsFlowProps) {
  return (
    <section className="mb-5">
      <div className="rounded-2xl border border-white/30 bg-white/30 backdrop-blur-sm">
        {rows.map((row, i) => (
          <div key={row.key}>
            {i > 0 && <div className="mx-4 h-px bg-black/[0.04]" />}
            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary)]/[0.07] text-[var(--color-primary)]">
                  {row.icon}
                </div>
                <span className="text-sm text-[var(--color-text)]">{row.label}</span>
              </div>
              <span className="font-mono text-xl font-bold text-[var(--color-text)]">
                {stats[row.key]}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
