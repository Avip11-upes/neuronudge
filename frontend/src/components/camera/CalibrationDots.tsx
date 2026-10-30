import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CalibrationDotsProps {
  onDotChange: (blockId: string) => void;
  onComplete: () => void;
  isCalibrating: boolean;
}

const DOT_POSITIONS = [
  { id: 'calibration_1', label: '1', top: '50%', left: '50%', desc: 'Center' },
  { id: 'calibration_2', label: '2', top: '18%', left: '18%', desc: 'Top-Left' },
  { id: 'calibration_3', label: '3', top: '18%', left: '82%', desc: 'Top-Right' },
  { id: 'calibration_4', label: '4', top: '82%', left: '82%', desc: 'Bottom-Right' },
  { id: 'calibration_5', label: '5', top: '82%', left: '18%', desc: 'Bottom-Left' },
];

export function CalibrationDots({
  onDotChange,
  onComplete,
  isCalibrating,
}: CalibrationDotsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isCalibrating) {
      setCurrentIndex(0);
      setProgress(0);
      return;
    }

    const currentDot = DOT_POSITIONS[currentIndex];
    if (!currentDot) {
      onComplete();
      return;
    }

    onDotChange(currentDot.id);

    const stepMs = 50;
    const totalMs = 1500; // 1.5s per dot as specified
    let elapsed = 0;

    const interval = setInterval(() => {
      elapsed += stepMs;
      setProgress(Math.min(100, Math.round((elapsed / totalMs) * 100)));

      if (elapsed >= totalMs) {
        clearInterval(interval);
        if (currentIndex + 1 < DOT_POSITIONS.length) {
          setCurrentIndex((prev) => prev + 1);
          setProgress(0);
        } else {
          onComplete();
        }
      }
    }, stepMs);

    return () => clearInterval(interval);
  }, [isCalibrating, currentIndex, onDotChange, onComplete]);

  if (!isCalibrating || currentIndex >= DOT_POSITIONS.length) return null;

  const dot = DOT_POSITIONS[currentIndex];

  return (
    <div className="fixed inset-0 z-50 pointer-events-none bg-stone-900/60 backdrop-blur-xs flex items-center justify-center">
      <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-white/95 px-5 py-2.5 rounded-full shadow-lg border border-stone-200 text-stone-900 text-sm font-medium flex items-center gap-3">
        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
        <span>
          Calibration point <strong>{currentIndex + 1} of 5</strong>: Look gently at the glowing dot
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={dot.id}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.4, opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'absolute',
            top: dot.top,
            left: dot.left,
            transform: 'translate(-50%, -50%)',
          }}
          className="flex flex-col items-center justify-center"
        >
          {/* Animated Target Dot */}
          <div className="relative flex items-center justify-center w-16 h-16">
            {/* Outer expanding ring */}
            <div className="absolute inset-0 rounded-full border-2 border-amber-400 animate-ping opacity-60" />

            {/* Circular progress track */}
            <svg className="w-16 h-16 transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="4"
                className="text-stone-700/50"
                fill="transparent"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="4"
                className="text-amber-400 transition-all duration-75"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 28}
                strokeDashoffset={2 * Math.PI * 28 * (1 - progress / 100)}
                strokeLinecap="round"
              />
            </svg>

            {/* Inner Glowing Center */}
            <div className="absolute w-7 h-7 rounded-full bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.9)] flex items-center justify-center font-bold text-xs text-stone-900">
              {currentIndex + 1}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
