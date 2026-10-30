import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Star, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TargetGameProps {
  onReactionRecorded: (reactionMs: number) => void;
  isActive: boolean;
}

export function TargetGame({ onReactionRecorded, isActive }: TargetGameProps) {
  const [starVisible, setStarVisible] = useState(false);
  const [starPosition, setStarPosition] = useState({ top: 50, left: 50 });
  const [lastReaction, setLastReaction] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  const starSpawnTimeRef = useRef<number>(0);
  const nextSpawnTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const starHideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const spawnStar = useCallback(() => {
    // Random position within 20% - 80% of container
    const randomTop = Math.floor(Math.random() * 60) + 20;
    const randomLeft = Math.floor(Math.random() * 60) + 20;
    setStarPosition({ top: randomTop, left: randomLeft });
    setStarVisible(true);
    starSpawnTimeRef.current = performance.now();

    // Auto-hide star after 2.2 seconds if not pressed
    starHideTimeoutRef.current = setTimeout(() => {
      setStarVisible(false);
      scheduleNextStar();
    }, 2200);
  }, []);

  const scheduleNextStar = useCallback(() => {
    if (!isActive) return;
    // Spawn every 2.5 to 5.5 seconds
    const delay = Math.floor(Math.random() * 3000) + 2500;
    nextSpawnTimeoutRef.current = setTimeout(() => {
      spawnStar();
    }, delay);
  }, [isActive, spawnStar]);

  useEffect(() => {
    if (isActive) {
      // First star appears after 1.5 seconds
      nextSpawnTimeoutRef.current = setTimeout(spawnStar, 1500);
    } else {
      setStarVisible(false);
      if (nextSpawnTimeoutRef.current) clearTimeout(nextSpawnTimeoutRef.current);
      if (starHideTimeoutRef.current) clearTimeout(starHideTimeoutRef.current);
    }

    return () => {
      if (nextSpawnTimeoutRef.current) clearTimeout(nextSpawnTimeoutRef.current);
      if (starHideTimeoutRef.current) clearTimeout(starHideTimeoutRef.current);
    };
  }, [isActive, spawnStar]);

  const handleStarClick = useCallback(
    (e?: React.MouseEvent) => {
      if (e) e.stopPropagation();

      if (starVisible && starSpawnTimeRef.current > 0) {
        const reaction = Math.round(performance.now() - starSpawnTimeRef.current);
        setLastReaction(reaction);
        setScore((prev) => prev + 1);
        setFeedback(`Great catch! ${reaction}ms`);
        onReactionRecorded(reaction);
        setStarVisible(false);
        if (starHideTimeoutRef.current) clearTimeout(starHideTimeoutRef.current);
        scheduleNextStar();
      } else {
        // False press / early click
        setFeedback('Wait for the star!');
      }

      setTimeout(() => setFeedback(null), 1200);
    },
    [starVisible, onReactionRecorded, scheduleNextStar]
  );

  // Keyboard Spacebar trigger
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleStarClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, handleStarClick]);

  return (
    <div
      onClick={() => handleStarClick()}
      className="relative w-full h-[400px] md:h-[460px] rounded-3xl bg-linear-to-b from-stone-900 via-stone-850 to-stone-900 border border-stone-800 overflow-hidden cursor-crosshair select-none flex flex-col items-center justify-between p-6"
    >
      {/* Top HUD */}
      <div className="w-full flex items-center justify-between text-xs text-stone-300 z-10">
        <div className="flex items-center gap-2 bg-stone-800/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-stone-700">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Press Space or Click the Star</span>
        </div>

        <div className="flex items-center gap-4">
          {lastReaction !== null && (
            <span className="font-mono text-amber-300">Last: {lastReaction}ms</span>
          )}
          <span className="font-semibold text-white">Stars Caught: {score}</span>
        </div>
      </div>

      {/* Center Guidance or Feedback */}
      <div className="text-center z-10 pointer-events-none">
        <AnimatePresence>
          {feedback ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="text-amber-300 font-bold text-lg drop-shadow-md"
            >
              {feedback}
            </motion.div>
          ) : (
            <p className="text-stone-400 text-xs">Keep your eyes focused on the screen...</p>
          )}
        </AnimatePresence>
      </div>

      {/* Target Star Element */}
      <AnimatePresence>
        {starVisible && (
          <motion.button
            key="active-star"
            type="button"
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1.2, rotate: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            style={{
              position: 'absolute',
              top: `${starPosition.top}%`,
              left: `${starPosition.left}%`,
              transform: 'translate(-50%, -50%)',
            }}
            onClick={handleStarClick}
            aria-label="Tap star target"
            className="p-3 rounded-full bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 drop-shadow-[0_0_20px_rgba(251,191,36,0.9)] cursor-pointer focus:outline-none"
          >
            <Star className="w-12 h-12 fill-amber-400 text-amber-200 stroke-1" />
          </motion.button>
        )}
      </AnimatePresence>

      <div className="text-[11px] text-stone-500 z-10">
        Tracking visual alertness & reaction speed
      </div>
    </div>
  );
}
