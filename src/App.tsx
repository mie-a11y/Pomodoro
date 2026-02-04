import { Timer } from './components/Timer';
import { Controls } from './components/Controls';
import { Scene } from './three';
import { useAudio } from './hooks/useAudio';
import './index.css';

function App() {
  // Initialize audio system
  useAudio();

  return (
    <div className="h-full w-full flex flex-col">
      {/* 3D Scene - 60% */}
      <div className="flex-[6]">
        <Scene />
      </div>

      {/* Timer display - 15% */}
      <div className="flex-[1.5]">
        <Timer />
      </div>

      {/* Controls - 25% */}
      <div className="flex-[2.5]">
        <Controls />
      </div>
    </div>
  );
}

export default App;
