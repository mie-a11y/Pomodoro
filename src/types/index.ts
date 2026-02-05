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

export interface Stats {
  totalPomodoros: number;
  todayPomodoros: number;
  streakDays: number;
  lastActiveDate: string;    // ISO date string YYYY-MM-DD
}

export type PlantStage = 'sprout' | 'young' | 'mature' | 'ancient';

export interface PlantState {
  type: string;              // plant type ID
  totalGrowth: number;       // total completed pomodoros
  currentProgress: number;   // 0-1, progress within current session
}

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

export interface StoreState {
  timer: TimerState;
  settings: TimerSettings;
  stats: Stats;
  plant: PlantState;
  themeId: string;
  volume: number;
  isMuted: boolean;
  isSettingsOpen: boolean;
}

export interface StoreActions {
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  tick: () => void;
  updateSettings: (settings: Partial<TimerSettings>) => void;
  completePomodoro: () => void;
  updatePlantProgress: (progress: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  openSettings: () => void;
  closeSettings: () => void;
}
