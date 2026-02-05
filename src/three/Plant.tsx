import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Mesh, MathUtils } from 'three';
import { useStore } from '../stores/useStore';
import type { PlantStage } from '../types';

function getPlantStage(totalGrowth: number): PlantStage {
  if (totalGrowth < 4) return 'sprout';
  if (totalGrowth < 12) return 'young';
  if (totalGrowth < 24) return 'mature';
  return 'ancient';
}

export function Plant() {
  const groupRef = useRef<Group>(null);
  const crownRef = useRef<Mesh>(null);
  const smoothScaleRef = useRef(0.4);
  const smoothCrownRef = useRef(0.3);

  const plant = useStore((state) => state.plant);
  const timer = useStore((state) => state.timer);

  const stage = getPlantStage(plant.totalGrowth);
  const isRunning = timer.status === 'running';

  // Session growth increment (only during work session, max +5%)
  const sessionGrowth = timer.isWorkSession ? plant.currentProgress * 0.05 : 0;

  // Base scale based on growth stage
  const baseScale = stage === 'sprout' ? 0.4
    : stage === 'young' ? 0.6
    : stage === 'mature' ? 0.85
    : 1;
  const scale = baseScale * (1 + sessionGrowth);

  // Crown size based on total growth (max at ~24 pomodoros)
  const growthProgress = Math.min(plant.totalGrowth / 24, 1);
  const baseCrownScale = 0.3 + growthProgress * 0.5;
  const crownScale = baseCrownScale * (1 + sessionGrowth * 2);

  // Animation frame - smooth interpolation and sway
  useFrame((state, delta) => {
    // Smooth scale interpolation
    smoothScaleRef.current = MathUtils.lerp(smoothScaleRef.current, scale, delta * 3);
    smoothCrownRef.current = MathUtils.lerp(smoothCrownRef.current, crownScale, delta * 3);

    // Apply smooth scale to group
    if (groupRef.current) {
      groupRef.current.scale.setScalar(smoothScaleRef.current);

      // Sway animation when timer is running
      if (isRunning) {
        groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
      }
    }

    // Apply smooth scale to crown
    if (crownRef.current) {
      crownRef.current.scale.setScalar(smoothCrownRef.current);
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.6, 0]}>
      {/* Trunk - cylinder */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 0.8, 8]} />
        <meshStandardMaterial color="#5D4037" roughness={0.9} />
      </mesh>

      {/* Crown - sphere (bonsai foliage) */}
      <mesh ref={crownRef} position={[0, 0.9, 0]}>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshStandardMaterial color="#2D4A3E" roughness={0.8} />
      </mesh>

      {/* Branch clusters - smaller spheres (visible from young stage) */}
      {stage !== 'sprout' && (
        <>
          <mesh position={[-0.3, 0.7, 0.1]} scale={smoothCrownRef.current * 0.6}>
            <sphereGeometry args={[0.4, 12, 12]} />
            <meshStandardMaterial color="#3D5A4E" roughness={0.8} />
          </mesh>
          <mesh position={[0.25, 0.65, -0.15]} scale={smoothCrownRef.current * 0.5}>
            <sphereGeometry args={[0.35, 12, 12]} />
            <meshStandardMaterial color="#4D6A5E" roughness={0.8} />
          </mesh>
        </>
      )}

      {/* Pulse effect - subtle glow when running */}
      {isRunning && (
        <mesh position={[0, 0.9, 0]} scale={smoothCrownRef.current * 1.1}>
          <sphereGeometry args={[0.6, 16, 16]} />
          <meshStandardMaterial
            color="#2D4A3E"
            transparent
            opacity={0.2}
          />
        </mesh>
      )}
    </group>
  );
}
