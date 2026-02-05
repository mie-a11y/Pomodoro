/**
 * Plant - 盆栽组件（形态语义重构版）
 *
 * 设计原则：
 * 1. 植物不是对称物 - 主干倾斜，左右不对称
 * 2. 叶子是"片"不是"体" - 使用 PlaneGeometry
 * 3. 清晰的结构层级 - Trunk → Branch → Leaf
 * 4. 不完美是必需的 - 使用随机性创造自然感
 */

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Group, MathUtils, Color, DoubleSide } from 'three';
import { useStore } from '../stores/useStore';
import { TRUNK_CONFIG, BRANCH_CONFIG, LEAF_CONFIG, getPlantStage } from './plantConfig';
import type { PlantStage } from '../types';

// ===== M1: 固定种子伪随机数生成器 =====
function createSeededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

// ===== 叶片颜色生成 =====
function generateLeafColor(random: () => number): Color {
  const baseColor = new Color(LEAF_CONFIG.baseColor);
  const hsl = { h: 0, s: 0, l: 0 };
  baseColor.getHSL(hsl);
  // L5: 颜色微小变化
  hsl.l += (random() - 0.5) * LEAF_CONFIG.colorVariation * 2;
  return new Color().setHSL(hsl.h, hsl.s, Math.max(0.1, Math.min(0.9, hsl.l)));
}

// ===== 单片叶子组件（带独立摆动动画）=====
interface LeafProps {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  color: Color;
  phaseOffset: number; // P2: 每片叶子独立的相位偏移
  isAnimating: boolean; // 是否启用动画
}

function Leaf({ position, rotation, scale, color, phaseOffset, isAnimating }: LeafProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const baseRotation = useRef(rotation);

  useFrame((state) => {
    if (!meshRef.current || !isAnimating) return;

    // P2: 叶片独立轻微摆动
    const time = state.clock.elapsedTime;
    // 使用不同频率组合产生自然摆动
    const swayX = Math.sin(time * 1.2 + phaseOffset) * 0.03;
    const swayZ = Math.sin(time * 0.8 + phaseOffset * 1.5) * 0.02;

    meshRef.current.rotation.x = baseRotation.current[0] + swayX;
    meshRef.current.rotation.z = baseRotation.current[2] + swayZ;
  });

  return (
    <mesh ref={meshRef} position={position} rotation={rotation} scale={scale}>
      <planeGeometry args={[LEAF_CONFIG.width, LEAF_CONFIG.height]} />
      <meshStandardMaterial
        color={color}
        side={DoubleSide}
        transparent
        opacity={LEAF_CONFIG.opacity}
        roughness={LEAF_CONFIG.roughness}
      />
    </mesh>
  );
}

// ===== 叶片组组件 =====
interface LeafGroupProps {
  count: number;
  random: () => number;
  scale: number;
  isAnimating?: boolean; // P2: 是否启用叶片动画
}

function LeafGroup({ count, random, scale, isAnimating = false }: LeafGroupProps) {
  const leaves = useMemo(() => {
    const result: Omit<LeafProps, 'isAnimating'>[] = [];
    for (let i = 0; i < count; i++) {
      // L3: 叶片朝向差异化
      const yawAngle = (i / count) * LEAF_CONFIG.yawSpread + (random() - 0.5) * 0.5;
      const pitch = (random() - 0.5) * LEAF_CONFIG.pitchRange * 2;
      const roll = (random() - 0.5) * LEAF_CONFIG.rollRange * 2;

      // 位置围绕中心点轻微分布
      const offsetX = (random() - 0.5) * 0.03;
      const offsetY = (random() - 0.5) * 0.02;
      const offsetZ = (random() - 0.5) * 0.03;

      // P2: 每片叶子独立的相位偏移，确保摆动不同步
      const phaseOffset = random() * Math.PI * 2;

      result.push({
        position: [offsetX, offsetY, offsetZ],
        rotation: [pitch, yawAngle, roll],
        scale: scale * (0.85 + random() * 0.3), // M4: 尺寸随机
        color: generateLeafColor(random),
        phaseOffset,
      });
    }
    return result;
  }, [count, random, scale]);

  return (
    <group>
      {leaves.map((leaf, i) => (
        <Leaf key={i} {...leaf} isAnimating={isAnimating} />
      ))}
    </group>
  );
}

// ===== 枝条组件 =====
interface BranchProps {
  config: typeof BRANCH_CONFIG.branches[0];
  trunkHeight: number;
  random: () => number;
  leafCount: number;
  leafScale: number;
  visible: boolean;
  isAnimating: boolean; // P2: 是否启用叶片动画
}

function Branch({ config, trunkHeight, random, leafCount, leafScale, visible, isAnimating }: BranchProps) {
  if (!visible) return null;

  // K4: 计算连接点位置
  const connectionY = trunkHeight * config.heightRatio;

  // M3: 应用枝条参数随机
  const length = config.length * (0.9 + random() * 0.2);
  const rotX = config.rotationX + (random() - 0.5) * 0.1;
  const rotZ = config.rotationZ + (random() - 0.5) * 0.1;

  return (
    <group position={[config.positionOffset.x, connectionY, config.positionOffset.z]}>
      <group rotation={[rotX, 0, rotZ]}>
        {/* 枝条 Cylinder - 原点在底部 */}
        <mesh position={[0, length / 2, 0]}>
          <cylinderGeometry args={[
            config.radius * 0.7,  // 顶部更细
            config.radius,
            length,
            BRANCH_CONFIG.radialSegments
          ]} />
          <meshStandardMaterial
            color={BRANCH_CONFIG.color}
            roughness={BRANCH_CONFIG.roughness}
          />
        </mesh>

        {/* L4: 叶片组在枝条末端 */}
        <group position={[0, length, 0]}>
          <LeafGroup count={leafCount} random={random} scale={leafScale} isAnimating={isAnimating} />
        </group>
      </group>
    </group>
  );
}

// ===== 主组件 =====
export function Plant() {
  const groupRef = useRef<Group>(null);
  const smoothScaleRef = useRef(0.4);

  // N5.3: 阶段过渡状态管理
  const prevStageRef = useRef<PlantStage>('sprout');
  const stageTransitionRef = useRef(1); // 0-1, 1 = 完全过渡完成

  const plant = useStore((state) => state.plant);
  const timer = useStore((state) => state.timer);
  const consumeGrowthPulse = useStore((state) => state.consumeGrowthPulse);

  const stage = getPlantStage(plant.totalGrowth);
  const isRunning = timer.status === 'running';

  // N5.3: 检测阶段变化，触发过渡动画（使用 useEffect 避免渲染期间访问 ref）
  useEffect(() => {
    if (prevStageRef.current !== stage) {
      prevStageRef.current = stage;
      stageTransitionRef.current = 0; // 重置过渡进度
    }
  }, [stage]);

  // 创建固定种子随机数生成器
  const random = useMemo(() => createSeededRandom(12345), []);

  // M2: 主干倾斜随机（固定值）
  const trunkTilt = useMemo(() => {
    const r = createSeededRandom(54321);
    const angle = TRUNK_CONFIG.tiltMin + r() * (TRUNK_CONFIG.tiltMax - TRUNK_CONFIG.tiltMin);
    return r() > 0.5 ? angle : -angle;
  }, []);

  // 阶段相关计算
  const trunkScale = TRUNK_CONFIG.stageScale[stage];
  const trunkHeight = TRUNK_CONFIG.height * trunkScale;
  const leafScale = LEAF_CONFIG.stageScale[stage];
  const branchCount = BRANCH_CONFIG.count[stage];
  const leavesPerBranch = LEAF_CONFIG.leavesPerBranch[stage];
  const leavesOnTop = LEAF_CONFIG.leavesOnTrunkTop[stage];

  // 整体缩放（基于阶段 + 会话进度）
  const sessionGrowth = timer.isWorkSession ? plant.currentProgress * 0.02 : 0;
  const targetScale = trunkScale * (1 + sessionGrowth);

  // 脉冲动画
  const pulseRef = useRef(0);

  useFrame((state, delta) => {
    // N5.1: 平滑缩放插值过渡
    smoothScaleRef.current = MathUtils.lerp(smoothScaleRef.current, targetScale, delta * 3);

    // N5.2: 阶段过渡动画（新元素渐入）
    if (stageTransitionRef.current < 1) {
      stageTransitionRef.current = Math.min(1, stageTransitionRef.current + delta * 1.5);
    }

    // 脉冲效果
    if (plant.growthPulse > 0 && pulseRef.current === 0) {
      pulseRef.current = 1;
      consumeGrowthPulse();
    }
    if (pulseRef.current > 0.01) {
      pulseRef.current *= 0.92;
    } else {
      pulseRef.current = 0;
    }

    const pulseScale = 1 + pulseRef.current * 0.1;

    if (groupRef.current) {
      groupRef.current.scale.setScalar(smoothScaleRef.current * pulseScale);

      // P1: 整体摇摆动画
      if (isRunning) {
        groupRef.current.rotation.z = trunkTilt + Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
      } else {
        groupRef.current.rotation.z = trunkTilt;
      }
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.6, 0]}>
      {/* ===== J1-J4: 主干 ===== */}
      <mesh position={[0, trunkHeight / 2, 0]}>
        <cylinderGeometry args={[
          TRUNK_CONFIG.radiusTop * trunkScale,
          TRUNK_CONFIG.radiusBottom * trunkScale,
          trunkHeight,
          TRUNK_CONFIG.radialSegments
        ]} />
        <meshStandardMaterial
          color={TRUNK_CONFIG.color}
          roughness={TRUNK_CONFIG.roughness}
        />
      </mesh>

      {/* ===== K1-K3: 枝条 ===== */}
      {BRANCH_CONFIG.branches.map((branchConfig, index) => (
        <Branch
          key={branchConfig.id}
          config={branchConfig}
          trunkHeight={trunkHeight}
          random={() => random()}
          leafCount={leavesPerBranch}
          leafScale={leafScale}
          visible={index < branchCount}
          isAnimating={isRunning}
        />
      ))}

      {/* ===== L4.4: 主干顶部叶片 ===== */}
      <group position={[0, trunkHeight, 0]}>
        <LeafGroup
          count={leavesOnTop}
          random={() => random()}
          scale={leafScale * 0.9}
          isAnimating={isRunning}
        />
      </group>
    </group>
  );
}
