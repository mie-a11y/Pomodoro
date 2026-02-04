import { useEffect, useRef } from 'react';
import { Howl } from 'howler';
import { useStore } from '../stores/useStore';

// Initialize sound effects
const sounds = {
  start: new Howl({
    src: ['/sounds/bowl-start.mp3'],
    volume: 0.5,
  }),
  complete: new Howl({
    src: ['/sounds/bowl-complete.mp3'],
    volume: 0.5,
  }),
  tick: new Howl({
    src: ['/sounds/tick.mp3'],
    volume: 0.2,
  }),
};

export function useAudio() {
  const prevStatusRef = useRef<string>('idle');
  const prevTimeRef = useRef<number>(0);

  const timer = useStore((state) => state.timer);
  const volume = useStore((state) => state.volume);
  const isMuted = useStore((state) => state.isMuted);

  // Sync volume with store
  useEffect(() => {
    const effectiveVolume = isMuted ? 0 : volume;
    Object.values(sounds).forEach((sound) => {
      sound.volume(effectiveVolume);
    });
  }, [volume, isMuted]);

  // Listen for status changes
  useEffect(() => {
    const prevStatus = prevStatusRef.current;
    const currentStatus = timer.status;

    // Play start sound when timer starts
    if (prevStatus !== 'running' && currentStatus === 'running') {
      sounds.start.play();
    }

    // Play complete sound when session ends (time reaches 0)
    if (timer.timeRemaining === 0 && prevTimeRef.current > 0) {
      sounds.complete.play();
    }

    prevStatusRef.current = currentStatus;
    prevTimeRef.current = timer.timeRemaining;
  }, [timer.status, timer.timeRemaining]);

  return {
    playStart: () => sounds.start.play(),
    playComplete: () => sounds.complete.play(),
    playTick: () => sounds.tick.play(),
  };
}
