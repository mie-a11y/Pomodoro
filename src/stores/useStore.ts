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
