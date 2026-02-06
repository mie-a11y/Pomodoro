import { useStore } from '../../stores/useStore';
import { Modal } from '../ui/Modal';
import { StatsContent } from './StatsContent';

export function StatsModal() {
  const isOpen = useStore((s) => s.isStatsOpen);
  const stats = useStore((s) => s.stats);
  const plant = useStore((s) => s.plant);
  const closeStats = useStore((s) => s.closeStats);

  return (
    <Modal isOpen={isOpen} onClose={closeStats} title="统计" subtitle="您的专注成就">
      <StatsContent stats={stats} plant={plant} />
    </Modal>
  );
}
