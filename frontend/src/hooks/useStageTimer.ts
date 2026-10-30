import { useState, useEffect, useRef, useCallback } from 'react';

interface UseStageTimerOptions {
  durationSeconds: number;
  onComplete?: () => void;
  autoStart?: boolean;
}

export function useStageTimer({
  durationSeconds,
  onComplete,
  autoStart = true,
}: UseStageTimerOptions) {
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [isPaused, setIsPaused] = useState(!autoStart);
  const [elapsed, setElapsed] = useState(0);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const resetTimer = useCallback((newDuration: number) => {
    setTimeLeft(newDuration);
    setElapsed(0);
    setIsPaused(false);
  }, []);

  const pause = useCallback(() => setIsPaused(true), []);
  const resume = useCallback(() => setIsPaused(false), []);
  const togglePause = useCallback(() => setIsPaused((prev) => !prev), []);

  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (onCompleteRef.current) {
            onCompleteRef.current();
          }
          return 0;
        }
        return prev - 1;
      });

      setElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused]);

  return {
    timeLeft,
    elapsed,
    isPaused,
    pause,
    resume,
    togglePause,
    resetTimer,
    progressPercent: Math.min(100, Math.round(((durationSeconds - timeLeft) / durationSeconds) * 100)),
  };
}
