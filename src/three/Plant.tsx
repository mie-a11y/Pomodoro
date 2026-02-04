import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import { useStore } from '../stores/useStore';
import type { PlantStage } from '../types';

function getPlantStage(progress: number): PlantStage {
  if (progress < 25) return 'seed';
  if (progress < 50) return 'sprout';
  if (progress < 75) return 'growing';
  return 'mature';
}

export function Plant() {
  const groupRef = useRef<Group>(null);
  const plant = useStore((state) => state.plant);
  const timer = useStore((state) => state.timer);

  const stage = getPlantStage(plant.progress);
  const isRunning = timer.status === 'running';

  // Sway animation - gentle movement when timer is running
  useFrame((state) => {
    if (groupRef.current && isRunning) {
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
    }
  });

  // Scale based on growth stage
  const scale = stage === 'seed' ? 0.3
    : stage === 'sprout' ? 0.5
    : stage === 'growing' ? 0.75
    : 1;

  // Crown size based on progress
  const crownScale = 0.3 + (plant.progress / 100) * 0.5;

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

      {/* Branch clusters - smaller spheres */}
      {stage !== 'seed' && (
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
