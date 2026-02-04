# Zen-Station Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Zen-style 3D Pomodoro timer PWA with a growing bonsai plant that responds to focus time.

**Architecture:** React SPA with Three.js/R3F for 3D rendering, Zustand for state, localStorage for persistence. Mobile-first responsive design with bottom control panel layout.

**Tech Stack:** React 18, TypeScript, Vite, React Three Fiber, @react-three/drei, Tailwind CSS 4, Zustand, Howler.js, vite-plugin-pwa

---

## Phase 1: Project Setup

### Task 1: Initialize Vite Project

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `index.html`

**Step 1: Create Vite React TypeScript project**

Run:
```bash
cd /opt/projects/web-h5/Zen-Station
npm create vite@latest . -- --template react-ts
```

Expected: Project scaffolded with React + TypeScript template

**Step 2: Verify project structure**

Run:
```bash
ls -la src/
```

Expected: See `App.tsx`, `main.tsx`, etc.

**Step 3: Commit initial setup**

```bash
git init
git add .
git commit -m "chore: initialize vite react-ts project"
```

---

### Task 2: Install Core Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install production dependencies**

Run:
```bash
npm install three @react-three/fiber @react-three/drei zustand howler
```

Expected: Dependencies added to package.json

**Step 2: Install dev dependencies**

Run:
```bash
npm install -D @types/three @types/howler vite-plugin-pwa tailwindcss @tailwindcss/vite
```

Expected: Dev dependencies added

**Step 3: Verify installation**

Run:
```bash
npm ls three zustand tailwindcss
```

Expected: Shows installed versions

**Step 4: Commit dependencies**

```bash
git add package.json package-lock.json
git commit -m "chore: install core dependencies (R3F, Zustand, Tailwind, PWA)"
```

---

### Task 3: Configure Tailwind CSS

**Files:**
- Create: `src/index.css`
- Modify: `vite.config.ts`

**Step 1: Update vite.config.ts with Tailwind plugin**

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

**Step 2: Create index.css with Tailwind and theme variables**

```css
/* src/index.css */
@import "tailwindcss";

:root {
  /* Zen Garden Theme */
  --bg-start: #FAF8F5;
  --bg-end: #F0EBE3;
  --color-primary: #2D4A3E;
  --color-accent: #C9B99A;
  --color-text: #333333;
  --color-text-muted: #666666;

  /* Font */
  --font-timer: 'Roboto Mono', monospace;
  --font-ui: 'Inter', system-ui, sans-serif;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #root {
  height: 100%;
  width: 100%;
  overflow: hidden;
}

body {
  font-family: var(--font-ui);
  color: var(--color-text);
  background: linear-gradient(180deg, var(--bg-start) 0%, var(--bg-end) 100%);
}
```

**Step 3: Verify Tailwind works**

Run:
```bash
npm run dev
```

Expected: Dev server starts, no errors

**Step 4: Commit Tailwind setup**

```bash
git add vite.config.ts src/index.css
git commit -m "chore: configure Tailwind CSS with zen theme variables"
```

---

### Task 4: Create Directory Structure

**Files:**
- Create: `src/components/.gitkeep`
- Create: `src/three/.gitkeep`
- Create: `src/hooks/.gitkeep`
- Create: `src/stores/.gitkeep`
- Create: `src/themes/.gitkeep`
- Create: `src/types/.gitkeep`
- Create: `public/sounds/.gitkeep`
- Create: `public/icons/.gitkeep`

**Step 1: Create all directories**

Run:
```bash
mkdir -p src/{components,three,hooks,stores,themes,types}
mkdir -p public/{sounds,icons}
touch src/{components,three,hooks,stores,themes,types}/.gitkeep
touch public/{sounds,icons}/.gitkeep
```

**Step 2: Verify structure**

Run:
```bash
find src -type d
```

Expected: All directories listed

**Step 3: Commit structure**

```bash
git add .
git commit -m "chore: create project directory structure"
```

---

## Phase 2: Types & State Management

### Task 5: Create TypeScript Type Definitions

**Files:**
- Create: `src/types/index.ts`

**Step 1: Write type definitions**

```typescript
// src/types/index.ts

// Timer types
export type TimerStatus = 'idle' | 'running' | 'paused' | 'break';

export interface TimerSettings {
  workDuration: number;      // seconds
  shortBreak: number;        // seconds
  longBreak: number;         // seconds
  longBreakInterval: number; // number of work sessions before long break
}

export interface TimerState {
  status: TimerStatus;
  timeRemaining: number;     // seconds
  currentSession: number;    // current pomodoro number (1-based)
  isWorkSession: boolean;    // true = work, false = break
}

// Stats types
export interface Stats {
  totalPomodoros: number;
  todayPomodoros: number;
  streakDays: number;
  lastActiveDate: string;    // ISO date string YYYY-MM-DD
}

// Plant types
export type PlantStage = 'sprout' | 'young' | 'mature' | 'ancient';

export interface PlantState {
  type: string;              // plant type ID
  totalGrowth: number;       // total completed pomodoros
  currentProgress: number;   // 0-1, progress within current session
}

// Theme types
export interface ThemeColors {
  background: [string, string]; // gradient start, end
  primary: string;
  accent: string;
  text: string;
}

export interface Theme {
  id: string;
  name: string;
  colors: ThemeColors;
  lighting: 'soft' | 'bright' | 'dark';
  sounds: string;
}

// Store types
export interface StoreState {
  // Timer
  timer: TimerState;
  settings: TimerSettings;

  // Stats
  stats: Stats;

  // Plant
  plant: PlantState;

  // Theme
  themeId: string;

  // Audio
  volume: number;
  isMuted: boolean;
}

export interface StoreActions {
  // Timer actions
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  tick: () => void;

  // Settings actions
  updateSettings: (settings: Partial<TimerSettings>) => void;

  // Stats actions
  completePomodoro: () => void;

  // Plant actions
  updatePlantProgress: (progress: number) => void;

  // Audio actions
  setVolume: (volume: number) => void;
  toggleMute: () => void;
}
```

**Step 2: Commit types**

```bash
git add src/types/index.ts
git commit -m "feat: add TypeScript type definitions"
```

---

### Task 6: Create Zustand Store

**Files:**
- Create: `src/stores/useStore.ts`

**Step 1: Write Zustand store with persistence**

```typescript
// src/stores/useStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  StoreState,
  StoreActions,
  TimerSettings,
  TimerState,
  Stats,
  PlantState
} from '../types';

const DEFAULT_SETTINGS: TimerSettings = {
  workDuration: 25 * 60,      // 25 minutes
  shortBreak: 5 * 60,         // 5 minutes
  longBreak: 15 * 60,         // 15 minutes
  longBreakInterval: 4,
};

const DEFAULT_TIMER: TimerState = {
  status: 'idle',
  timeRemaining: DEFAULT_SETTINGS.workDuration,
  currentSession: 1,
  isWorkSession: true,
};

const DEFAULT_STATS: Stats = {
  totalPomodoros: 0,
  todayPomodoros: 0,
  streakDays: 0,
  lastActiveDate: '',
};

const DEFAULT_PLANT: PlantState = {
  type: 'bonsai',
  totalGrowth: 0,
  currentProgress: 0,
};

const getTodayDate = () => new Date().toISOString().split('T')[0];

export const useStore = create<StoreState & StoreActions>()(
  persist(
    (set, get) => ({
      // Initial state
      timer: DEFAULT_TIMER,
      settings: DEFAULT_SETTINGS,
      stats: DEFAULT_STATS,
      plant: DEFAULT_PLANT,
      themeId: 'zen-garden',
      volume: 0.7,
      isMuted: false,

      // Timer actions
      startTimer: () => set((state) => ({
        timer: { ...state.timer, status: 'running' }
      })),

      pauseTimer: () => set((state) => ({
        timer: { ...state.timer, status: 'paused' }
      })),

      resetTimer: () => set((state) => ({
        timer: {
          ...DEFAULT_TIMER,
          timeRemaining: state.timer.isWorkSession
            ? state.settings.workDuration
            : state.settings.shortBreak,
          currentSession: state.timer.currentSession,
          isWorkSession: state.timer.isWorkSession,
        },
        plant: { ...state.plant, currentProgress: 0 }
      })),

      tick: () => {
        const { timer, settings } = get();

        if (timer.status !== 'running' || timer.timeRemaining <= 0) {
          return;
        }

        const newTimeRemaining = timer.timeRemaining - 1;

        if (newTimeRemaining <= 0) {
          // Session complete
          if (timer.isWorkSession) {
            get().completePomodoro();
          }

          // Determine next session
          const isLongBreak = timer.isWorkSession &&
            timer.currentSession % settings.longBreakInterval === 0;
          const nextIsWork = !timer.isWorkSession;
          const nextDuration = nextIsWork
            ? settings.workDuration
            : (isLongBreak ? settings.longBreak : settings.shortBreak);

          set({
            timer: {
              status: 'idle',
              timeRemaining: nextDuration,
              currentSession: nextIsWork ? timer.currentSession + 1 : timer.currentSession,
              isWorkSession: nextIsWork,
            },
            plant: { ...get().plant, currentProgress: 0 }
          });
        } else {
          // Update progress
          const totalDuration = timer.isWorkSession
            ? settings.workDuration
            : settings.shortBreak;
          const progress = 1 - (newTimeRemaining / totalDuration);

          set({
            timer: { ...timer, timeRemaining: newTimeRemaining },
            plant: { ...get().plant, currentProgress: timer.isWorkSession ? progress : 0 }
          });
        }
      },

      // Settings actions
      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings },
        timer: state.timer.status === 'idle'
          ? {
              ...state.timer,
              timeRemaining: newSettings.workDuration ?? state.settings.workDuration
            }
          : state.timer
      })),

      // Stats actions
      completePomodoro: () => set((state) => {
        const today = getTodayDate();
        const isNewDay = state.stats.lastActiveDate !== today;
        const isConsecutiveDay = state.stats.lastActiveDate ===
          new Date(Date.now() - 86400000).toISOString().split('T')[0];

        return {
          stats: {
            totalPomodoros: state.stats.totalPomodoros + 1,
            todayPomodoros: isNewDay ? 1 : state.stats.todayPomodoros + 1,
            streakDays: isNewDay
              ? (isConsecutiveDay ? state.stats.streakDays + 1 : 1)
              : state.stats.streakDays,
            lastActiveDate: today,
          },
          plant: {
            ...state.plant,
            totalGrowth: state.plant.totalGrowth + 1,
          }
        };
      }),

      // Plant actions
      updatePlantProgress: (progress) => set((state) => ({
        plant: { ...state.plant, currentProgress: progress }
      })),

      // Audio actions
      setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),
      toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
    }),
    {
      name: 'zen-station-storage',
      partialize: (state) => ({
        settings: state.settings,
        stats: state.stats,
        plant: state.plant,
        themeId: state.themeId,
        volume: state.volume,
        isMuted: state.isMuted,
      }),
    }
  )
);
```

**Step 2: Commit store**

```bash
git add src/stores/useStore.ts
git commit -m "feat: add Zustand store with timer, stats, and plant state"
```

---

### Task 7: Create Timer Hook

**Files:**
- Create: `src/hooks/useTimer.ts`

**Step 1: Write timer hook with interval management**

```typescript
// src/hooks/useTimer.ts
import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '../stores/useStore';

export function useTimer() {
  const intervalRef = useRef<number | null>(null);

  const {
    timer,
    settings,
    startTimer,
    pauseTimer,
    resetTimer,
    tick,
  } = useStore();

  // Clear interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Manage interval based on timer status
  useEffect(() => {
    if (timer.status === 'running') {
      intervalRef.current = window.setInterval(() => {
        tick();
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timer.status, tick]);

  const toggle = useCallback(() => {
    if (timer.status === 'running') {
      pauseTimer();
    } else {
      startTimer();
    }
  }, [timer.status, startTimer, pauseTimer]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    status: timer.status,
    timeRemaining: timer.timeRemaining,
    formattedTime: formatTime(timer.timeRemaining),
    currentSession: timer.currentSession,
    isWorkSession: timer.isWorkSession,
    settings,
    toggle,
    start: startTimer,
    pause: pauseTimer,
    reset: resetTimer,
  };
}
```

**Step 2: Commit hook**

```bash
git add src/hooks/useTimer.ts
git commit -m "feat: add useTimer hook with interval management"
```

---

## Phase 3: UI Components

### Task 8: Create Theme Configuration

**Files:**
- Create: `src/themes/zen-garden.ts`
- Create: `src/themes/index.ts`

**Step 1: Write zen garden theme**

```typescript
// src/themes/zen-garden.ts
import type { Theme } from '../types';

export const zenGarden: Theme = {
  id: 'zen-garden',
  name: '禅意花园',
  colors: {
    background: ['#FAF8F5', '#F0EBE3'],
    primary: '#2D4A3E',
    accent: '#C9B99A',
    text: '#333333',
  },
  lighting: 'soft',
  sounds: 'bowl',
};
```

**Step 2: Write theme index**

```typescript
// src/themes/index.ts
import { zenGarden } from './zen-garden';
import type { Theme } from '../types';

export const themes: Record<string, Theme> = {
  'zen-garden': zenGarden,
};

export function getTheme(id: string): Theme {
  return themes[id] ?? zenGarden;
}

export { zenGarden };
```

**Step 3: Commit themes**

```bash
git add src/themes/
git commit -m "feat: add zen garden theme configuration"
```

---

### Task 9: Create Timer Display Component

**Files:**
- Create: `src/components/Timer.tsx`

**Step 1: Write Timer component**

```typescript
// src/components/Timer.tsx
import { useTimer } from '../hooks/useTimer';

export function Timer() {
  const { formattedTime, isWorkSession, currentSession } = useTimer();

  return (
    <div className="flex flex-col items-center justify-center py-4">
      {/* Session indicator */}
      <div className="text-sm text-[var(--color-text-muted)] mb-2">
        {isWorkSession ? '专注中' : '休息中'} · 第 {currentSession} 轮
      </div>

      {/* Time display */}
      <div
        className="text-6xl sm:text-7xl md:text-8xl font-light tracking-wider"
        style={{ fontFamily: 'var(--font-timer)' }}
      >
        {formattedTime}
      </div>
    </div>
  );
}
```

**Step 2: Commit Timer component**

```bash
git add src/components/Timer.tsx
git commit -m "feat: add Timer display component"
```

---

### Task 10: Create Controls Component

**Files:**
- Create: `src/components/Controls.tsx`

**Step 1: Write Controls component**

```typescript
// src/components/Controls.tsx
import { useTimer } from '../hooks/useTimer';

export function Controls() {
  const { status, toggle, reset } = useTimer();

  const isRunning = status === 'running';
  const isPaused = status === 'paused';

  return (
    <div className="flex items-center justify-center gap-4 py-6 px-4">
      {/* Reset button */}
      <button
        onClick={reset}
        className="w-12 h-12 rounded-full flex items-center justify-center
                   bg-white/50 hover:bg-white/80 transition-colors
                   text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        aria-label="重置"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>

      {/* Main toggle button */}
      <button
        onClick={toggle}
        className="w-20 h-20 rounded-full flex items-center justify-center
                   bg-[var(--color-primary)] hover:opacity-90 transition-opacity
                   text-white shadow-lg"
        aria-label={isRunning ? '暂停' : '开始'}
      >
        {isRunning ? (
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
        ) : (
          <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      {/* Settings button (placeholder) */}
      <button
        className="w-12 h-12 rounded-full flex items-center justify-center
                   bg-white/50 hover:bg-white/80 transition-colors
                   text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        aria-label="设置"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </div>
  );
}
```

**Step 2: Commit Controls component**

```bash
git add src/components/Controls.tsx
git commit -m "feat: add Controls component with start/pause/reset"
```

---

### Task 11: Create Main App Layout

**Files:**
- Modify: `src/App.tsx`

**Step 1: Write App layout**

```typescript
// src/App.tsx
import { Timer } from './components/Timer';
import { Controls } from './components/Controls';

function App() {
  return (
    <div className="h-full flex flex-col">
      {/* 3D Scene Area - 60% */}
      <div className="flex-[6] relative flex items-center justify-center">
        {/* Placeholder for 3D scene */}
        <div className="text-[var(--color-accent)] text-lg">
          3D 场景加载中...
        </div>
      </div>

      {/* Timer Display - 15% */}
      <div className="flex-[1.5] flex items-center justify-center">
        <Timer />
      </div>

      {/* Controls - 25% */}
      <div className="flex-[2.5] flex items-end justify-center pb-safe">
        <Controls />
      </div>
    </div>
  );
}

export default App;
```

**Step 2: Verify app runs**

Run:
```bash
npm run dev
```

Expected: App shows timer display and controls, timer can be started/paused

**Step 3: Commit App layout**

```bash
git add src/App.tsx
git commit -m "feat: create main app layout with timer and controls"
```

---

## Phase 4: 3D Scene

### Task 12: Create Base Canvas Scene

**Files:**
- Create: `src/three/Scene.tsx`

**Step 1: Write Scene component**

```typescript
// src/three/Scene.tsx
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Suspense } from 'react';

interface SceneProps {
  children?: React.ReactNode;
}

export function Scene({ children }: SceneProps) {
  return (
    <Canvas
      className="touch-none"
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <PerspectiveCamera
        makeDefault
        position={[0, 2, 5]}
        fov={45}
      />

      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={0.8}
        castShadow
      />

      {/* Allow subtle rotation */}
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={Math.PI / 4}
        maxAzimuthAngle={Math.PI / 6}
        minAzimuthAngle={-Math.PI / 6}
      />

      <Suspense fallback={null}>
        {children}
      </Suspense>
    </Canvas>
  );
}
```

**Step 2: Commit Scene**

```bash
git add src/three/Scene.tsx
git commit -m "feat: add base Canvas scene with camera and lighting"
```

---

### Task 13: Create Pot Component

**Files:**
- Create: `src/three/Pot.tsx`

**Step 1: Write Pot component**

```typescript
// src/three/Pot.tsx
import { useRef } from 'react';
import { Mesh } from 'three';

export function Pot() {
  const meshRef = useRef<Mesh>(null);

  return (
    <group position={[0, -0.5, 0]}>
      {/* Pot body - cylinder */}
      <mesh ref={meshRef} castShadow receiveShadow>
        <cylinderGeometry args={[0.6, 0.5, 0.8, 32]} />
        <meshStandardMaterial
          color="#8B7355"
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {/* Pot rim */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <torusGeometry args={[0.62, 0.05, 16, 32]} />
        <meshStandardMaterial
          color="#7A6548"
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>

      {/* Soil */}
      <mesh position={[0, 0.3, 0]} receiveShadow>
        <cylinderGeometry args={[0.55, 0.55, 0.1, 32]} />
        <meshStandardMaterial
          color="#3D2817"
          roughness={1}
          metalness={0}
        />
      </mesh>
    </group>
  );
}
```

**Step 2: Commit Pot**

```bash
git add src/three/Pot.tsx
git commit -m "feat: add 3D pot component with terracotta material"
```

---

### Task 14: Create Plant Component

**Files:**
- Create: `src/three/Plant.tsx`

**Step 1: Write Plant component with growth animation**

```typescript
// src/three/Plant.tsx
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, MathUtils } from 'three';
import { useStore } from '../stores/useStore';

// Calculate plant stage based on total growth
function getPlantStage(totalGrowth: number): {
  trunkHeight: number;
  trunkRadius: number;
  branchCount: number;
  leafScale: number;
} {
  if (totalGrowth < 10) {
    // Sprout: 0-10
    const t = totalGrowth / 10;
    return {
      trunkHeight: 0.3 + t * 0.3,
      trunkRadius: 0.02 + t * 0.01,
      branchCount: 0,
      leafScale: 0.3 + t * 0.2,
    };
  } else if (totalGrowth < 50) {
    // Young: 11-50
    const t = (totalGrowth - 10) / 40;
    return {
      trunkHeight: 0.6 + t * 0.4,
      trunkRadius: 0.03 + t * 0.02,
      branchCount: Math.floor(t * 3),
      leafScale: 0.5 + t * 0.3,
    };
  } else if (totalGrowth < 200) {
    // Mature: 51-200
    const t = (totalGrowth - 50) / 150;
    return {
      trunkHeight: 1.0 + t * 0.5,
      trunkRadius: 0.05 + t * 0.02,
      branchCount: 3 + Math.floor(t * 3),
      leafScale: 0.8 + t * 0.2,
    };
  } else {
    // Ancient: 200+
    return {
      trunkHeight: 1.5,
      trunkRadius: 0.07,
      branchCount: 6,
      leafScale: 1.0,
    };
  }
}

export function Plant() {
  const groupRef = useRef<Group>(null);
  const { plant, timer } = useStore();

  // Calculate base stage from total growth
  const baseStage = useMemo(() =>
    getPlantStage(plant.totalGrowth),
    [plant.totalGrowth]
  );

  // Animate growth during work session
  useFrame((state) => {
    if (!groupRef.current) return;

    // Subtle sway animation
    const t = state.clock.elapsedTime;
    groupRef.current.rotation.z = Math.sin(t * 0.5) * 0.02;

    // Growth pulse when working
    if (timer.status === 'running' && timer.isWorkSession) {
      const pulse = 1 + Math.sin(t * 2) * 0.01 * plant.currentProgress;
      groupRef.current.scale.setScalar(pulse);
    }
  });

  // Apply current session progress
  const progressBonus = timer.isWorkSession ? plant.currentProgress * 0.1 : 0;
  const trunkHeight = baseStage.trunkHeight * (1 + progressBonus);
  const leafScale = baseStage.leafScale * (1 + progressBonus * 0.5);

  return (
    <group ref={groupRef} position={[0, 0.3, 0]}>
      {/* Trunk */}
      <mesh castShadow position={[0, trunkHeight / 2, 0]}>
        <cylinderGeometry args={[
          baseStage.trunkRadius * 0.7,
          baseStage.trunkRadius,
          trunkHeight,
          8
        ]} />
        <meshStandardMaterial
          color="#4A3728"
          roughness={0.9}
        />
      </mesh>

      {/* Leaves/Crown - simple sphere for now */}
      <mesh
        castShadow
        position={[0, trunkHeight + leafScale * 0.3, 0]}
      >
        <sphereGeometry args={[leafScale * 0.5, 16, 16]} />
        <meshStandardMaterial
          color="#2D4A3E"
          roughness={0.8}
        />
      </mesh>

      {/* Additional leaf clusters based on branch count */}
      {Array.from({ length: baseStage.branchCount }).map((_, i) => {
        const angle = (i / baseStage.branchCount) * Math.PI * 2;
        const height = trunkHeight * 0.6 + (i % 2) * 0.2;
        const radius = 0.3 + (i % 2) * 0.1;
        return (
          <mesh
            key={i}
            castShadow
            position={[
              Math.cos(angle) * radius,
              height,
              Math.sin(angle) * radius
            ]}
          >
            <sphereGeometry args={[leafScale * 0.25, 12, 12]} />
            <meshStandardMaterial
              color="#3A5F4A"
              roughness={0.8}
            />
          </mesh>
        );
      })}
    </group>
  );
}
```

**Step 2: Commit Plant**

```bash
git add src/three/Plant.tsx
git commit -m "feat: add 3D plant component with growth stages and animation"
```

---

### Task 15: Integrate 3D Scene into App

**Files:**
- Modify: `src/App.tsx`

**Step 1: Update App with 3D scene**

```typescript
// src/App.tsx
import { Timer } from './components/Timer';
import { Controls } from './components/Controls';
import { Scene } from './three/Scene';
import { Plant } from './three/Plant';
import { Pot } from './three/Pot';

function App() {
  return (
    <div className="h-full flex flex-col">
      {/* 3D Scene Area - 60% */}
      <div className="flex-[6] relative">
        <Scene>
          <Pot />
          <Plant />
        </Scene>
      </div>

      {/* Timer Display - 15% */}
      <div className="flex-[1.5] flex items-center justify-center">
        <Timer />
      </div>

      {/* Controls - 25% */}
      <div className="flex-[2.5] flex items-end justify-center pb-safe">
        <Controls />
      </div>
    </div>
  );
}

export default App;
```

**Step 2: Verify 3D scene renders**

Run:
```bash
npm run dev
```

Expected: 3D pot and plant visible, plant sways gently

**Step 3: Commit integration**

```bash
git add src/App.tsx
git commit -m "feat: integrate 3D scene with pot and plant into app"
```

---

## Phase 5: Audio System

### Task 16: Create Audio Hook

**Files:**
- Create: `src/hooks/useAudio.ts`
- Create: `public/sounds/bowl.mp3` (placeholder)

**Step 1: Write audio hook**

```typescript
// src/hooks/useAudio.ts
import { useCallback, useEffect, useRef } from 'react';
import { Howl } from 'howler';
import { useStore } from '../stores/useStore';

const SOUNDS = {
  start: '/sounds/bowl-start.mp3',
  complete: '/sounds/chime.mp3',
  breakEnd: '/sounds/bowl-end.mp3',
};

export function useAudio() {
  const { volume, isMuted, timer } = useStore();
  const soundsRef = useRef<Record<string, Howl>>({});
  const prevStatusRef = useRef(timer.status);

  // Initialize sounds
  useEffect(() => {
    soundsRef.current = {
      start: new Howl({ src: [SOUNDS.start], volume }),
      complete: new Howl({ src: [SOUNDS.complete], volume }),
      breakEnd: new Howl({ src: [SOUNDS.breakEnd], volume }),
    };

    return () => {
      Object.values(soundsRef.current).forEach(sound => sound.unload());
    };
  }, []);

  // Update volume
  useEffect(() => {
    Object.values(soundsRef.current).forEach(sound => {
      sound.volume(isMuted ? 0 : volume);
    });
  }, [volume, isMuted]);

  // Play sounds on state changes
  useEffect(() => {
    const prevStatus = prevStatusRef.current;
    const currentStatus = timer.status;

    if (prevStatus !== currentStatus) {
      if (prevStatus === 'idle' && currentStatus === 'running') {
        // Started
        soundsRef.current.start?.play();
      } else if (prevStatus === 'running' && currentStatus === 'idle') {
        // Completed (session ended)
        if (timer.isWorkSession) {
          soundsRef.current.breakEnd?.play();
        } else {
          soundsRef.current.complete?.play();
        }
      }
    }

    prevStatusRef.current = currentStatus;
  }, [timer.status, timer.isWorkSession]);

  const playSound = useCallback((name: keyof typeof SOUNDS) => {
    if (!isMuted && soundsRef.current[name]) {
      soundsRef.current[name].play();
    }
  }, [isMuted]);

  return { playSound };
}
```

**Step 2: Create placeholder audio files note**

Create a README for sounds:

```bash
echo "# Sound Files\n\nPlace the following audio files here:\n- bowl-start.mp3 - Singing bowl sound for starting focus\n- chime.mp3 - Wind chime for completing pomodoro\n- bowl-end.mp3 - Soft bowl sound for break end\n\nRecommended sources:\n- freesound.org\n- pixabay.com/sound-effects" > public/sounds/README.md
```

**Step 3: Add audio hook to App**

Update App.tsx to initialize audio:

```typescript
// Add to src/App.tsx imports:
import { useAudio } from './hooks/useAudio';

// Add inside App function:
function App() {
  useAudio(); // Initialize audio system
  // ... rest of component
}
```

**Step 4: Commit audio system**

```bash
git add src/hooks/useAudio.ts public/sounds/README.md src/App.tsx
git commit -m "feat: add audio system with howler.js"
```

---

## Phase 6: PWA & Polish

### Task 17: Configure PWA

**Files:**
- Modify: `vite.config.ts`
- Create: `public/icons/icon-192.png` (placeholder)
- Create: `public/icons/icon-512.png` (placeholder)

**Step 1: Update vite.config.ts with PWA plugin**

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png', 'sounds/*.mp3'],
      manifest: {
        name: 'Zen Station - 禅意番茄钟',
        short_name: 'Zen Station',
        description: '禅意风格的 3D 番茄钟应用',
        theme_color: '#2D4A3E',
        background_color: '#FAF8F5',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,mp3,ogg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
})
```

**Step 2: Create placeholder icons note**

```bash
echo "# App Icons\n\nPlace PWA icons here:\n- icon-192.png (192x192)\n- icon-512.png (512x512)\n\nRecommend: Simple bonsai silhouette in zen green (#2D4A3E)" > public/icons/README.md
```

**Step 3: Commit PWA config**

```bash
git add vite.config.ts public/icons/README.md
git commit -m "feat: configure PWA with vite-plugin-pwa"
```

---

### Task 18: Add Responsive Styles & Safe Areas

**Files:**
- Modify: `src/index.css`
- Modify: `index.html`

**Step 1: Update index.css with responsive utilities**

```css
/* Add to src/index.css */

/* Safe area for mobile devices */
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 1rem);
}

.pt-safe {
  padding-top: env(safe-area-inset-top, 0);
}

/* Touch feedback */
button {
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

/* Prevent text selection on UI */
.select-none {
  -webkit-user-select: none;
  user-select: none;
}

/* Loading animation */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

**Step 2: Update index.html with viewport meta**

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no" />
    <meta name="theme-color" content="#2D4A3E" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Roboto+Mono:wght@300;400&display=swap" rel="stylesheet" />
    <title>Zen Station</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Step 3: Commit responsive updates**

```bash
git add src/index.css index.html
git commit -m "feat: add responsive styles and mobile safe areas"
```

---

### Task 19: Final Build Verification

**Step 1: Run production build**

Run:
```bash
npm run build
```

Expected: Build succeeds without errors

**Step 2: Preview production build**

Run:
```bash
npm run preview
```

Expected: App runs correctly in preview mode

**Step 3: Final commit**

```bash
git add .
git commit -m "chore: complete MVP implementation"
```

---

## Summary

### Files Created
```
src/
├── types/index.ts           # Type definitions
├── stores/useStore.ts       # Zustand store
├── hooks/
│   ├── useTimer.ts          # Timer logic
│   └── useAudio.ts          # Audio system
├── themes/
│   ├── zen-garden.ts        # Zen theme
│   └── index.ts             # Theme exports
├── three/
│   ├── Scene.tsx            # Canvas container
│   ├── Pot.tsx              # 3D pot
│   └── Plant.tsx            # 3D growing plant
├── components/
│   ├── Timer.tsx            # Time display
│   └── Controls.tsx         # Control buttons
└── App.tsx                  # Main layout
```

### Key Features Implemented
- Pomodoro timer with customizable durations
- 3D growing bonsai plant
- Zen garden visual theme
- Audio notifications (needs sound files)
- PWA support (needs icon files)
- Mobile-responsive layout

### Next Steps (Phase 2)
1. Add actual sound files
2. Add PWA icons
3. Implement settings modal
4. Add statistics view
5. Enhance plant model detail
