import React, { useEffect, useState } from 'react';
import { TargetGame } from './TargetGame';
import { motion } from 'framer-motion';

interface StimulusPlayerProps {
  blockId: string;
  onStarReaction: (reactionMs: number) => void;
  isPaused: boolean;
}

export function StimulusPlayer({ blockId, onStarReaction, isPaused }: StimulusPlayerProps) {
  // Moving object position for 'adhd_target_game'
  const [orbPos, setOrbPos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    if (blockId !== 'adhd_target_game' || isPaused) return;

    const interval = setInterval(() => {
      // Smooth wander across screen
      setOrbPos({
        x: Math.floor(Math.random() * 70) + 15,
        y: Math.floor(Math.random() * 60) + 20,
      });
    }, 2400);

    return () => clearInterval(interval);
  }, [blockId, isPaused]);

  // If star task block
  if (blockId === 'adhd_star_task') {
    return <TargetGame isActive={!isPaused} onReactionRecorded={onStarReaction} />;
  }

  // 1. Colorful Motion block
  if (blockId === 'adhd_color_flow') {
    return (
      <div className="relative w-full h-[400px] md:h-[460px] rounded-3xl bg-stone-950 overflow-hidden flex items-center justify-center border border-stone-800">
        <div className="absolute inset-0 flex items-center justify-center opacity-80">
          <motion.div
            animate={{
              scale: isPaused ? 1 : [1, 1.25, 0.9, 1],
              rotate: isPaused ? 0 : [0, 90, 180, 360],
              borderRadius: ['30%', '50%', '35%', '30%'],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            className="w-72 h-72 bg-linear-to-tr from-amber-400 via-rose-400 to-indigo-500 blur-2xl"
          />
          <motion.div
            animate={{
              scale: isPaused ? 1 : [1.1, 0.95, 1.2, 1.1],
              rotate: isPaused ? 0 : [360, 240, 120, 0],
            }}
            transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
            className="w-64 h-64 bg-linear-to-bl from-teal-400 via-emerald-400 to-amber-300 blur-2xl opacity-70"
          />
        </div>

        <div className="relative z-10 text-center px-6">
          <p className="text-white/90 font-medium text-base mb-1">Gentle Color Patterns</p>
          <p className="text-stone-400 text-xs">Watch the shifting shapes as they gently flow</p>
        </div>
      </div>
    );
  }

  // 2. Slow Calm Scene
  if (blockId === 'adhd_calm_scene') {
    return (
      <div className="relative w-full h-[400px] md:h-[460px] rounded-3xl bg-linear-to-b from-stone-900 via-slate-900 to-stone-950 overflow-hidden flex flex-col items-center justify-center border border-stone-800 p-8 text-center">
        {/* Soft moon/light glow */}
        <div className="w-24 h-24 rounded-full bg-amber-100/20 blur-xl mb-6" />

        {/* Floating serene particles */}
        <motion.div
          animate={{ y: isPaused ? 0 : [-8, 8, -8] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="text-stone-300 max-w-md"
        >
          <h4 className="font-heading font-medium text-xl text-stone-100 mb-2">
            Quiet Horizon
          </h4>
          <p className="text-sm text-stone-400 leading-relaxed">
            Rest your gaze gently on the calm glow. Notice how your breathing slows down.
          </p>
        </motion.div>
      </div>
    );
  }

  // 3. Moving Object Game (gaze following)
  if (blockId === 'adhd_target_game') {
    return (
      <div className="relative w-full h-[400px] md:h-[460px] rounded-3xl bg-stone-950 overflow-hidden border border-stone-800 p-6">
        <div className="text-center text-xs text-stone-400 mb-4">
          Follow the glowing blue firefly smoothly with your eyes
        </div>

        <motion.div
          animate={{
            left: `${orbPos.x}%`,
            top: `${orbPos.y}%`,
          }}
          transition={{ duration: 2.2, ease: 'easeInOut' }}
          className="absolute w-12 h-12 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        >
          <div className="w-full h-full rounded-full bg-sky-400/30 blur-md animate-pulse" />
          <div className="absolute inset-2 rounded-full bg-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.9)] flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-white" />
          </div>
        </motion.div>
      </div>
    );
  }

  // 4. Fast-cut / Dynamic shapes
  if (blockId === 'adhd_fast_cut') {
    return (
      <div className="relative w-full h-[400px] md:h-[460px] rounded-3xl bg-stone-900 overflow-hidden flex items-center justify-center border border-stone-800 p-6">
        <div className="grid grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <motion.div
              key={idx}
              animate={{
                scale: isPaused ? 1 : [0.9, 1.15, 0.9],
                rotate: isPaused ? 0 : [0, 45, 90, 0],
                backgroundColor: isPaused
                  ? '#38bdf8'
                  : ['#f59e0b', '#ec4899', '#10b981', '#38bdf8'][idx % 4],
              }}
              transition={{
                duration: 2.5 + idx * 0.4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="w-16 h-16 rounded-2xl opacity-80"
            />
          ))}
        </div>
      </div>
    );
  }

  // Default: Floating Bubbles
  return (
    <div className="relative w-full h-[400px] md:h-[460px] rounded-3xl bg-stone-950 overflow-hidden flex items-center justify-center border border-stone-800 p-6">
      <div className="text-center text-stone-300">
        <h4 className="font-heading font-semibold text-lg text-white mb-2">
          Focused Awareness
        </h4>
        <p className="text-xs text-stone-400">Keep looking comfortably at the center of the screen</p>
      </div>
    </div>
  );
}
