import { Timer } from './components/Timer';
import { Controls } from './components/Controls';
import { Settings } from './components/Settings';
import { Stats } from './components/Stats';
import { PixelPlant } from './components/PixelPlant';
import { useAudio } from './hooks/useAudio';
import './index.css';

function App() {
  // Initialize audio system
  useAudio();

  return (
    <div className="h-full w-full flex flex-col bg-gradient-to-b from-[#FAF8F5] to-[#F0EBE3]">
      {/* Pixel Plant Scene - 60% */}
      <div className="flex-[6] flex items-center justify-center">
        <PixelPlant />
      </div>

      {/* Timer display - 15% */}
      <div className="flex-[1.5]">
        <Timer />
      </div>

      {/* Controls - 25% */}
      <div className="flex-[2.5]">
        <Controls />
      </div>

      {/* Settings Modal */}
      <Settings />

      {/* Stats Modal */}
      <Stats />
    </div>
  );
}

export default App;
