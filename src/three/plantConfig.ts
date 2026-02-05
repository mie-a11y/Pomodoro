/**
 * Plant Geometry Configuration
 * 盆栽几何参数配置
 */

import type { PlantStage } from '../types';

// ===== I2: 主干几何参数规范 =====
export const TRUNK_CONFIG = {
  // 基础尺寸
  height: 0.7,
  radiusBottom: 0.10,
  radiusTop: 0.06,
  radialSegments: 8,

  // 倾斜角度范围 (弧度)
  tiltMin: 0.05,  // ~3°
  tiltMax: 0.14,  // ~8°

  // 材质
  color: '#5D4037',
  roughness: 0.9,

  // 各阶段缩放
  stageScale: {
    sprout: 0.5,
    young: 0.7,
    mature: 0.85,
    ancient: 1.0,
  } as Record<PlantStage, number>,
};

// ===== I3: 枝条几何参数规范 =====
export const BRANCH_CONFIG = {
  // 枝条数量配置
  count: {
    sprout: 0,
    young: 1,
    mature: 2,
    ancient: 3,
  } as Record<PlantStage, number>,

  // 枝条参数 (每根枝条独立配置)
  branches: [
    {
      // 枝条 1: 左侧低位
      id: 1,
      heightRatio: 0.4,  // 相对主干高度
      length: 0.18,
      radius: 0.025,
      // 旋转角度 (弧度)
      rotationX: 0.26,   // ~15° 向上
      rotationZ: 0.79,   // ~45° 向左外
      positionOffset: { x: -0.02, z: 0.01 },
    },
    {
      // 枝条 2: 右侧中位
      id: 2,
      heightRatio: 0.6,
      length: 0.15,
      radius: 0.02,
      rotationX: 0.35,   // ~20° 向上
      rotationZ: -0.87,  // ~50° 向右外
      positionOffset: { x: 0.02, z: -0.01 },
    },
    {
      // 枝条 3: 左侧高位 (ancient 专属)
      id: 3,
      heightRatio: 0.8,
      length: 0.12,
      radius: 0.018,
      rotationX: 0.44,   // ~25° 向上
      rotationZ: 0.70,   // ~40° 向左后外
      positionOffset: { x: -0.01, z: -0.02 },
    },
  ],

  // 材质 (与主干相同或略浅)
  color: '#5D4037',
  roughness: 0.85,
  radialSegments: 6,
};

// ===== I4: 叶片几何参数规范 =====
export const LEAF_CONFIG = {
  // 基础尺寸
  width: 0.10,
  height: 0.15,

  // 材质
  baseColor: '#2D4A3E',
  colorVariation: 0.1,  // HSL 亮度变化范围 ±10%
  roughness: 0.7,
  opacity: 0.95,

  // 朝向随机范围 (弧度)
  pitchRange: 0.35,  // ±20°
  yawSpread: Math.PI * 2,  // 围绕枝条 360°
  rollRange: 0.17,   // ±10°

  // 每个位置的叶片数量
  leavesPerBranch: {
    sprout: 0,
    young: 2,
    mature: 2,
    ancient: 3,
  } as Record<PlantStage, number>,

  leavesOnTrunkTop: {
    sprout: 2,
    young: 1,
    mature: 1,
    ancient: 2,
  } as Record<PlantStage, number>,

  // 各阶段叶片尺寸缩放
  stageScale: {
    sprout: 0.6,
    young: 0.8,
    mature: 0.9,
    ancient: 1.0,
  } as Record<PlantStage, number>,
};

// ===== 阶段阈值 (保持与原有逻辑一致) =====
export const STAGE_THRESHOLDS = {
  sprout: 0,   // 0 pomodoros
  young: 1,    // 1-2 pomodoros
  mature: 3,   // 3-7 pomodoros
  ancient: 8,  // 8+ pomodoros
};

export function getPlantStage(totalGrowth: number): PlantStage {
  if (totalGrowth < STAGE_THRESHOLDS.young) return 'sprout';
  if (totalGrowth < STAGE_THRESHOLDS.mature) return 'young';
  if (totalGrowth < STAGE_THRESHOLDS.ancient) return 'mature';
  return 'ancient';
}
