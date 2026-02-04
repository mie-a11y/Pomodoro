import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Pot } from './Pot';
import { Plant } from './Plant';

export function Scene() {
  return (
    <Canvas>
      {/* Camera - positioned for viewing bonsai */}
      <PerspectiveCamera
        makeDefault
        position={[0, 2, 5]}
        fov={45}
      />

      {/* Lighting - soft ambient light for zen atmosphere */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[5, 5, 5]}
        intensity={0.8}
        castShadow
      />

      {/* OrbitControls - limited rotation for focused view */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2}
      />

      {/* Pot component */}
      <Pot />

      {/* Plant component */}
      <Plant />
    </Canvas>
  );
}
