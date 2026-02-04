import { Timer } from './components/Timer';
import { Controls } from './components/Controls';
import './index.css';

function App() {
  return (
    <div className="h-full w-full flex flex-col">
      {/* 3D Scene placeholder - 60% */}
      <div className="flex-[6] flex items-center justify-center bg-gradient-to-b from-[var(--bg-start)] to-[var(--bg-end)]">
        <div className="text-[var(--color-text-muted)] text-sm">
          3D 场景加载中...
        </div>
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
