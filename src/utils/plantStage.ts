import type { PlantStage } from '../types';

export const STAGE_NAMES: Record<PlantStage, string> = {
  sprout: '幼苗',
  young: '成长',
  mature: '成熟',
  ancient: '古树',
};

export const STAGE_THRESHOLDS = [0, 1, 3, 8, Infinity];

export function getPlantStage(totalGrowth: number): PlantStage {
  if (totalGrowth < 1) return 'sprout';
  if (totalGrowth < 3) return 'young';
  if (totalGrowth < 8) return 'mature';
  return 'ancient';
}
