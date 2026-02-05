import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from './useStore';

describe('useStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useStore.setState({
      timer: {
        status: 'idle',
        timeRemaining: 25 * 60,
        currentSession: 1,
        isWorkSession: true,
      },
      settings: {
        workDuration: 25 * 60,
        shortBreak: 5 * 60,
        longBreak: 15 * 60,
        longBreakInterval: 4,
      },
      stats: {
        totalPomodoros: 0,
        todayPomodoros: 0,
        streakDays: 0,
        lastActiveDate: '',
      },
      plant: {
        type: 'bonsai',
        totalGrowth: 0,
        currentProgress: 0,
        growthPulse: 0,
        lastStage: 'sprout',
      },
      isStatsOpen: false,
      isSettingsOpen: false,
    });
  });

  describe('Timer actions', () => {
    it('startTimer sets status to running', () => {
      const { startTimer } = useStore.getState();
      startTimer();
      expect(useStore.getState().timer.status).toBe('running');
    });

    it('pauseTimer sets status to paused', () => {
      const { startTimer, pauseTimer } = useStore.getState();
      startTimer();
      pauseTimer();
      expect(useStore.getState().timer.status).toBe('paused');
    });

    it('resetTimer resets timeRemaining to workDuration', () => {
      const { startTimer, tick, resetTimer } = useStore.getState();
      startTimer();
      tick(); // Decrease time by 1
      tick();
      resetTimer();
      expect(useStore.getState().timer.timeRemaining).toBe(25 * 60);
      expect(useStore.getState().timer.status).toBe('idle');
    });

    it('tick decreases timeRemaining by 1', () => {
      const { startTimer, tick } = useStore.getState();
      const initialTime = useStore.getState().timer.timeRemaining;
      startTimer();
      tick();
      expect(useStore.getState().timer.timeRemaining).toBe(initialTime - 1);
    });

    it('tick updates currentProgress during work session', () => {
      const { startTimer, tick } = useStore.getState();
      startTimer();
      tick();
      const state = useStore.getState();
      expect(state.plant.currentProgress).toBeGreaterThan(0);
    });

    it('tick does not run when paused', () => {
      const { pauseTimer, tick } = useStore.getState();
      const initialTime = useStore.getState().timer.timeRemaining;
      pauseTimer();
      tick();
      expect(useStore.getState().timer.timeRemaining).toBe(initialTime);
    });
  });

  describe('completePomodoro', () => {
    it('increases totalGrowth by 1', () => {
      const { completePomodoro } = useStore.getState();
      const initialGrowth = useStore.getState().plant.totalGrowth;
      completePomodoro();
      expect(useStore.getState().plant.totalGrowth).toBe(initialGrowth + 1);
    });

    it('sets growthPulse to 1', () => {
      const { completePomodoro } = useStore.getState();
      completePomodoro();
      expect(useStore.getState().plant.growthPulse).toBe(1);
    });

    it('increases totalPomodoros count', () => {
      const { completePomodoro } = useStore.getState();
      const initialCount = useStore.getState().stats.totalPomodoros;
      completePomodoro();
      expect(useStore.getState().stats.totalPomodoros).toBe(initialCount + 1);
    });

    it('updates lastStage based on growth', () => {
      const { completePomodoro } = useStore.getState();
      // Complete enough pomodoros to change stage
      completePomodoro(); // totalGrowth = 1 -> young
      expect(useStore.getState().plant.lastStage).toBe('young');
    });
  });

  describe('Settings actions', () => {
    it('updateSettings merges new settings', () => {
      const { updateSettings } = useStore.getState();
      updateSettings({ workDuration: 30 * 60 });
      const state = useStore.getState();
      expect(state.settings.workDuration).toBe(30 * 60);
      expect(state.settings.shortBreak).toBe(5 * 60); // Unchanged
    });

    it('updateSettings updates timeRemaining when idle', () => {
      const { updateSettings } = useStore.getState();
      updateSettings({ workDuration: 30 * 60 });
      expect(useStore.getState().timer.timeRemaining).toBe(30 * 60);
    });
  });

  describe('Plant actions', () => {
    it('consumeGrowthPulse resets growthPulse to 0', () => {
      const { completePomodoro, consumeGrowthPulse } = useStore.getState();
      completePomodoro(); // Sets growthPulse to 1
      expect(useStore.getState().plant.growthPulse).toBe(1);
      consumeGrowthPulse();
      expect(useStore.getState().plant.growthPulse).toBe(0);
    });

    it('updatePlantProgress sets currentProgress', () => {
      const { updatePlantProgress } = useStore.getState();
      updatePlantProgress(0.5);
      expect(useStore.getState().plant.currentProgress).toBe(0.5);
    });
  });

  describe('UI actions', () => {
    it('openStats sets isStatsOpen to true', () => {
      const { openStats } = useStore.getState();
      openStats();
      expect(useStore.getState().isStatsOpen).toBe(true);
    });

    it('closeStats sets isStatsOpen to false', () => {
      const { openStats, closeStats } = useStore.getState();
      openStats();
      closeStats();
      expect(useStore.getState().isStatsOpen).toBe(false);
    });

    it('openSettings sets isSettingsOpen to true', () => {
      const { openSettings } = useStore.getState();
      openSettings();
      expect(useStore.getState().isSettingsOpen).toBe(true);
    });

    it('closeSettings sets isSettingsOpen to false', () => {
      const { openSettings, closeSettings } = useStore.getState();
      openSettings();
      closeSettings();
      expect(useStore.getState().isSettingsOpen).toBe(false);
    });
  });

  describe('Audio actions', () => {
    it('setVolume clamps value between 0 and 1', () => {
      const { setVolume } = useStore.getState();
      setVolume(1.5);
      expect(useStore.getState().volume).toBe(1);
      setVolume(-0.5);
      expect(useStore.getState().volume).toBe(0);
      setVolume(0.5);
      expect(useStore.getState().volume).toBe(0.5);
    });

    it('toggleMute toggles isMuted state', () => {
      const { toggleMute } = useStore.getState();
      expect(useStore.getState().isMuted).toBe(false);
      toggleMute();
      expect(useStore.getState().isMuted).toBe(true);
      toggleMute();
      expect(useStore.getState().isMuted).toBe(false);
    });
  });
});
