/**
 * Stats - 统计弹窗（重构版）
 * 任务 #44-48, #49-53, #54-57, #119-121
 */

import { useStore } from '../stores/useStore';
import { Modal } from './ui/Modal';
import type { PlantStage } from '../types';

// 阶段名称映射
const STAGE_NAMES: Record<PlantStage, string> = {
  sprout: '幼苗',
  young: '成长',
  mature: '成熟',
  ancient: '古树',
};

// 阶段阈值
const STAGE_THRESHOLDS = [0, 1, 3, 8, Infinity];

function getPlantStage(totalGrowth: number): PlantStage {
  if (totalGrowth < 1) return 'sprout';
  if (totalGrowth < 3) return 'young';
  if (totalGrowth < 8) return 'mature';
  return 'ancient';
}

// #44-48: StatCard 组件
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}

function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <div className="bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border)]
      hover:bg-[var(--color-surface-hover)] hover:-translate-y-0.5 hover:shadow-md
      transition-all duration-200 cursor-pointer">
      <div className="text-[var(--color-primary)] mb-2">{icon}</div>
      <div className="text-2xl font-bold text-[var(--color-text)] font-mono">{value}</div>
      <div className="text-xs text-[var(--color-text-muted)] mt-1">{label}</div>
    </div>
  );
}

// #49-53: 阶段进度条组件
interface StageProgressProps {
  currentStage: PlantStage;
  totalGrowth: number;
}

function StageProgress({ currentStage, totalGrowth }: StageProgressProps) {
  const stages: PlantStage[] = ['sprout', 'young', 'mature', 'ancient'];
  const stageIndex = stages.indexOf(currentStage);

  // 计算总体进度 (基于 24 番茄为满)
  const overallProgress = Math.min(100, (totalGrowth / 24) * 100);

  // 计算到下一阶段所需的番茄数
  const nextThreshold = STAGE_THRESHOLDS[stageIndex + 1];

  return (
    <div className="bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border)]">
      <h3 className="text-sm font-medium text-[var(--color-primary)] mb-4 flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
        植物成长
      </h3>

      {/* 当前阶段显示 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path d="M12 19c-4.3 0-8-1.8-8-4V9c0 2.2 3.7 4 8 4s8-1.8 8-4v6c0 2.2-3.7 4-8 4z" />
              <path d="M12 5c4.3 0 8 1.8 8 4s-3.7 4-8 4-8-1.8-8-4 3.7-4 8-4z" />
            </svg>
          </div>
          <span className="text-lg font-bold text-[var(--color-text)]">
            {STAGE_NAMES[currentStage]}
          </span>
        </div>
        {currentStage !== 'ancient' && (
          <span className="text-xs text-[var(--color-text-muted)]">
            还需 {Math.ceil(nextThreshold - totalGrowth)} 番茄
          </span>
        )}
      </div>

      {/* 进度条 */}
      <div className="relative">
        {/* 轨道 */}
        <div className="h-2.5 rounded-full bg-gray-200 overflow-hidden">
          {/* 填充 */}
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${overallProgress}%`,
              background: 'linear-gradient(90deg, var(--color-primary-light), var(--color-primary))',
            }}
          />
        </div>

        {/* 里程碑标记 */}
        <div className="absolute inset-x-0 top-0 h-2.5 flex items-center">
          {[1, 3, 8].map((threshold, i) => {
            const position = (threshold / 24) * 100;
            const reached = totalGrowth >= threshold;
            return (
              <div
                key={i}
                className={`absolute w-0.5 h-full ${reached ? 'bg-white/50' : 'bg-gray-400/50'}`}
                style={{ left: `${position}%` }}
              />
            );
          })}
        </div>
      </div>

      {/* 阶段标签 */}
      <div className="flex justify-between mt-2">
        {stages.map((stage) => (
          <span
            key={stage}
            className={`text-xs ${
              stage === currentStage
                ? 'text-[var(--color-primary)] font-medium'
                : 'text-[var(--color-text-subtle)]'
            }`}
          >
            {STAGE_NAMES[stage]}
          </span>
        ))}
      </div>

      {/* 古树阶段特殊提示 */}
      {currentStage === 'ancient' && (
        <p className="text-xs text-[var(--color-text-muted)] mt-3 text-center">
          您的植物已达到最高阶段，继续专注让它更加繁茂
        </p>
      )}
    </div>
  );
}

function StatsContent() {
  const stats = useStore((state) => state.stats);
  const plant = useStore((state) => state.plant);

  const currentStage = getPlantStage(plant.totalGrowth);

  return (
    <div className="p-6">
      {/* 头部区域 */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center">
          <svg className="w-5 h-5 text-[var(--color-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M3 3v18h18" />
            <path d="M18 17V9" />
            <path d="M13 17V5" />
            <path d="M8 17v-3" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text)]">统计</h2>
          <p className="text-sm text-[var(--color-text-muted)]">您的专注成就</p>
        </div>
      </div>

      {/* 统计卡片网格 */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatCard
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          }
          label="总番茄钟"
          value={stats.totalPomodoros}
        />
        <StatCard
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          }
          label="今日番茄钟"
          value={stats.todayPomodoros}
        />
        <StatCard
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          }
          label="连续天数"
          value={stats.streakDays}
        />
        <StatCard
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path d="M12 2a10 10 0 0 1 0 20 10 10 0 0 1 0-20" />
              <path d="M12 6a6 6 0 0 1 0 12 6 6 0 0 1 0-12" />
              <circle cx="12" cy="12" r="2" />
            </svg>
          }
          label="植物生长"
          value={plant.totalGrowth}
        />
      </div>

      {/* 植物阶段进度 */}
      <StageProgress currentStage={currentStage} totalGrowth={plant.totalGrowth} />
    </div>
  );
}

export function Stats() {
  const isStatsOpen = useStore((state) => state.isStatsOpen);
  const closeStats = useStore((state) => state.closeStats);

  return (
    <Modal isOpen={isStatsOpen} onClose={closeStats}>
      <StatsContent />
    </Modal>
  );
}
