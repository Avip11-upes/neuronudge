import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '../ui/button';
import { COPY } from '../../lib/copy';

interface AudioPromptProps {
  text: string | null;
  language?: 'en' | 'hi';
}

export function AudioPrompt({ text, language = 'en' }: AudioPromptProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported(typeof window !== 'undefined' && 'speechSynthesis' in window);
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleTogglePlay = () => {
    if (!text || !isSupported) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'hi' ? 'hi-IN' : 'en-US';
    utterance.rate = 0.95; // Slightly slower, calm cadence for clear comprehension

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  if (!text || !isSupported) return null;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleTogglePlay}
      className={`rounded-full px-3.5 gap-2 border-stone-200 text-stone-700 hover:text-stone-900 transition-colors ${
        isPlaying ? 'bg-amber-50 border-amber-300 text-amber-900' : ''
      }`}
      aria-label="Listen to question spoken out loud"
    >
      {isPlaying ? (
        <>
          <VolumeX className="w-4 h-4 text-amber-600 animate-pulse" />
          <span className="text-xs font-medium">{COPY.dyslexia.listeningAudio}</span>
        </>
      ) : (
        <>
          <Volume2 className="w-4 h-4 text-stone-600" />
          <span className="text-xs font-medium">{COPY.dyslexia.listenAudio}</span>
        </>
      )}
    </Button>
  );
}
