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
