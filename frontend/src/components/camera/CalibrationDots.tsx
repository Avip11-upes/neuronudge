import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface CalibrationDotsProps {
  onDotChange: (blockId: string) => void;
  onComplete: () => void;
  isCalibrating: boolean;
}

const DOT_POSITIONS = [
  { id: 'calibration_1', top: '50%', left: '50%', desc: 'Center' },
  { id: 'calibration_2', top: '18%', left: '18%', desc: 'Top-Left' },
  { id: 'calibration_3', top: '18%', left: '82%', desc: 'Top-Right' },
  { id: 'calibration_4', top: '82%', left: '82%', desc: 'Bottom-Right' },
  { id: 'calibration_5', top: '82%', left: '18%', desc: 'Bottom-Left' },
];

const DWELL_MS = 1000; // how long the cursor must stay on the dot
const IDLE_BLOCK = 'idle'; // block label while the user is not on a dot
const R = 28;
const CIRCUMFERENCE = 2 * Math.PI * R;

export function CalibrationDots({
  onDotChange,
  onComplete,
  isCalibrating,
}: CalibrationDotsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0); // 0 to 1

  // Keep the latest callbacks in refs so parent re-renders never reset the timer.
  const onDotChangeRef = useRef(onDotChange);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onDotChangeRef.current = onDotChange;
    onCompleteRef.current = onComplete;
  });

  const rafRef = useRef(0);
  const startRef = useRef<number | null>(null);

  const stopTimer = () => {
    cancelAnimationFrame(rafRef.current);
    startRef.current = null;
    setProgress(0);
  };

  // Reset when calibration is switched off, and clean up on unmount.
  useEffect(() => {
    if (!isCalibrating) {
      stopTimer();
      setCurrentIndex(0);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [isCalibrating]);

  if (!isCalibrating || currentIndex >= DOT_POSITIONS.length) return null;

  const dot = DOT_POSITIONS[currentIndex];

  const advance = () => {
    stopTimer();
    onDotChangeRef.current(IDLE_BLOCK);
    if (currentIndex + 1 < DOT_POSITIONS.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onCompleteRef.current();
    }
  };

  // Cursor reached the dot: start the dwell timer and tag frames with this dot.
  const handleEnter = () => {
    if (startRef.current !== null) return;
    startRef.current = performance.now();
    onDotChangeRef.current(dot.id);

    const tick = () => {
      if (startRef.current === null) return;
      const p = Math.min((performance.now() - startRef.current) / DWELL_MS, 1);
      setProgress(p);
      if (p >= 1) advance();
      else rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  // Cursor left early: reset the ring and stop tagging frames.
  const handleLeave = () => {
    stopTimer();
    onDotChangeRef.current(IDLE_BLOCK);
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none bg-stone-900/60 backdrop-blur-xs">
      <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-white/95 px-5 py-2.5 rounded-full shadow-lg border border-stone-200 text-stone-900 text-sm font-medium flex items-center gap-3">
        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
        <span>
          Point <strong>{currentIndex + 1} of {DOT_POSITIONS.length}</strong>: move your
          cursor to the glowing dot and keep your eyes on it
        </span>
      </div>

      {/* Plain div handles centering; motion only animates scale and opacity */}
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={{ top: dot.top, left: dot.left }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={dot.id}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <button
              type="button"
              aria-label={`Calibration point ${currentIndex + 1}: ${dot.desc}`}
              onPointerEnter={handleEnter}
              onPointerLeave={handleLeave}
              className="pointer-events-auto relative flex h-24 w-24 items-center justify-center rounded-full cursor-pointer"
            >
              <div className="absolute h-16 w-16 rounded-full border-2 border-amber-400 animate-ping opacity-60" />

              <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
                <circle
                  cx="32" cy="32" r={R}
                  stroke="currentColor" strokeWidth="4" fill="transparent"
                  className="text-stone-700/50"
                />
                <circle
                  cx="32" cy="32" r={R}
                  stroke="currentColor" strokeWidth="4" fill="transparent"
                  className="text-amber-400"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
                  strokeLinecap="round"
                />
              </svg>

              <div className="absolute flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 text-xs font-bold text-stone-900 shadow-[0_0_15px_rgba(251,191,36,0.9)]">
                {currentIndex + 1}
              </div>
            </button>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}