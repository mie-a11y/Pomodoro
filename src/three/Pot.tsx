import { useRef } from 'react';
import { Group } from 'three';

export function Pot() {
  const groupRef = useRef<Group>(null);

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Pot body - cylinder */}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.8, 0.6, 0.6, 32]} />
        <meshStandardMaterial color="#8B7355" roughness={0.8} />
      </mesh>

      {/* Pot rim - torus */}
      <mesh position={[0, 0.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.8, 0.05, 16, 32]} />
        <meshStandardMaterial color="#6B5344" roughness={0.7} />
      </mesh>

      {/* Soil - cylinder */}
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.75, 0.75, 0.1, 32]} />
        <meshStandardMaterial color="#3D2817" roughness={1} />
      </mesh>
    </group>
  );
}
