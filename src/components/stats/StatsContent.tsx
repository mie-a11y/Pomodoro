import type { Stats, PlantState } from '../../types';
import { StatsFlow } from './StatsFlow';
import { PlantProgress } from './PlantProgress';

interface StatsContentProps {
  stats: Stats;
  plant: PlantState;
}

export function StatsContent({ stats, plant }: StatsContentProps) {
  return (
    <>
      <StatsFlow stats={stats} />
      <PlantProgress plant={plant} />
    </>
  );
}
