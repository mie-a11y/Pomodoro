import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
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
  const plant = useStore((state) => state.plant);
  const timer = useStore((state) => state.timer);

  const stage = getPlantStage(plant.totalGrowth);
  const isRunning = timer.status === 'running';

  // Sway animation - gentle movement when timer is running
  useFrame((state) => {
    if (groupRef.current && isRunning) {
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
    }
  });

  // Scale based on growth stage
  const scale = stage === 'sprout' ? 0.4
    : stage === 'young' ? 0.6
    : stage === 'mature' ? 0.85
    : 1;

  // Crown size based on total growth (max at ~24 pomodoros)
  const growthProgress = Math.min(plant.totalGrowth / 24, 1);
  const crownScale = 0.3 + growthProgress * 0.5;

  return (
    <group ref={groupRef} position={[0, 0.6, 0]} scale={scale}>
      {/* Trunk - cylinder */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 0.8, 8]} />
        <meshStandardMaterial color="#5D4037" roughness={0.9} />
      </mesh>

      {/* Crown - sphere (bonsai foliage) */}
      <mesh position={[0, 0.9, 0]} scale={crownScale}>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshStandardMaterial color="#2D4A3E" roughness={0.8} />
      </mesh>

      {/* Branch clusters - smaller spheres (visible from young stage) */}
      {stage !== 'sprout' && (
        <>
          <mesh position={[-0.3, 0.7, 0.1]} scale={crownScale * 0.6}>
            <sphereGeometry args={[0.4, 12, 12]} />
            <meshStandardMaterial color="#3D5A4E" roughness={0.8} />
          </mesh>
          <mesh position={[0.25, 0.65, -0.15]} scale={crownScale * 0.5}>
            <sphereGeometry args={[0.35, 12, 12]} />
            <meshStandardMaterial color="#4D6A5E" roughness={0.8} />
          </mesh>
        </>
      )}

      {/* Pulse effect - subtle glow when running */}
      {isRunning && (
        <mesh position={[0, 0.9, 0]} scale={crownScale * 1.1}>
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
