import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Coffee } from 'lucide-react';

interface AnimatedFaceProps {
  phase: 'talking' | 'waiting' | 'done';
  timeLeft: number;
  isPaused: boolean;
}

export function AnimatedFace({ phase, timeLeft, isPaused }: AnimatedFaceProps) {
  const [mouthOpen, setMouthOpen] = useState(false);
  const [blink, setBlink] = useState(false);

  // Subtle mouth movement animation while talking
  useEffect(() => {
    if (phase !== 'talking' || isPaused) return;

    const interval = setInterval(() => {
      setMouthOpen((prev) => !prev);
    }, 280);

    return () => clearInterval(interval);
  }, [phase, isPaused]);

  // Gentle blink every 4-6 seconds
  useEffect(() => {
    if (isPaused) return;

    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 220);
    }, 4500);

    return () => clearInterval(blinkInterval);
  }, [isPaused]);

  if (phase === 'waiting') {
    return (
      <div className="w-full h-[400px] md:h-[460px] rounded-3xl bg-linear-to-b from-stone-900 to-stone-950 border border-stone-800 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-900/30 border border-indigo-700/40 text-indigo-300 flex items-center justify-center mb-6">
          <Coffee className="w-8 h-8" />
        </div>

        <h3 className="font-heading font-semibold text-2xl text-stone-100 mb-2">
          Calm Waiting Period
        </h3>

        <p className="text-stone-400 text-sm max-w-md leading-relaxed mb-6">
          Buddy is taking a rest now. Just relax comfortably in your seat and look gently toward the screen.
        </p>

        <div className="font-mono text-sm px-4 py-2 rounded-full bg-stone-800/80 border border-stone-700 text-indigo-300">
          Remaining pause: {timeLeft}s
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[400px] md:h-[460px] rounded-3xl bg-linear-to-b from-indigo-950 via-stone-900 to-stone-950 border border-indigo-900/40 flex flex-col items-center justify-center p-6 overflow-hidden">
      {/* Background Soft Glow */}
      <div className="absolute w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

      {/* Animated Face Avatar (SVG) */}
      <div className="relative z-10 flex flex-col items-center">
        <svg
          viewBox="0 0 200 200"
          className="w-48 h-48 md:w-56 md:h-56 drop-shadow-[0_10px_25px_rgba(0,0,0,0.5)]"
        >
          {/* Head */}
          <circle cx="100" cy="100" r="85" fill="#fef3c7" stroke="#d97706" strokeWidth="4" />

          {/* Hair Tufts */}
          <path
            d="M 60 30 Q 100 15 140 30 Q 120 45 100 35 Q 80 45 60 30 Z"
            fill="#b45309"
          />

          {/* Rosy Cheeks */}
          <circle cx="50" cy="118" r="12" fill="#fca5a5" opacity="0.6" />
          <circle cx="150" cy="118" r="12" fill="#fca5a5" opacity="0.6" />

          {/* Left Eye */}
          {blink ? (
            <line x1="55" y1="88" x2="75" y2="88" stroke="#1c1917" strokeWidth="4" strokeLinecap="round" />
          ) : (
            <g>
              <ellipse cx="65" cy="85" rx="10" ry="12" fill="#1c1917" />
              <circle cx="62" cy="81" r="3.5" fill="#ffffff" />
            </g>
          )}

          {/* Right Eye */}
          {blink ? (
            <line x1="125" y1="88" x2="145" y2="88" stroke="#1c1917" strokeWidth="4" strokeLinecap="round" />
          ) : (
            <g>
              <ellipse cx="135" cy="85" rx="10" ry="12" fill="#1c1917" />
              <circle cx="132" cy="81" r="3.5" fill="#ffffff" />
            </g>
          )}

          {/* Eyebrows */}
          <path d="M 54 68 Q 65 62 76 68" stroke="#78350f" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M 124 68 Q 135 62 146 68" stroke="#78350f" strokeWidth="3.5" fill="none" strokeLinecap="round" />

          {/* Cute Nose */}
          <ellipse cx="100" cy="98" rx="4" ry="3" fill="#d97706" />

          {/* Animated Talking Mouth */}
          {mouthOpen ? (
            <path
              d="M 82 128 Q 100 155 118 128 Q 100 135 82 128 Z"
              fill="#991b1b"
              stroke="#78350f"
              strokeWidth="2.5"
            />
          ) : (
            <path
              d="M 82 128 Q 100 142 118 128"
              stroke="#78350f"
              strokeWidth="3.5"
              fill="none"
              strokeLinecap="round"
            />
          )}
        </svg>

        {/* Story Dialogue Caption */}
        <div className="mt-5 max-w-md bg-stone-900/80 backdrop-blur-md px-5 py-3 rounded-2xl border border-stone-700/80 text-center">
          <p className="text-stone-200 text-sm italic leading-relaxed">
            "Hello! I am Buddy. Thank you for listening to me today. We each see the world in our own wonderful, unique way!"
          </p>
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs text-indigo-300 font-mono">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Buddy is sharing a story ({timeLeft}s remaining)</span>
        </div>
      </div>
    </div>
  );
}
