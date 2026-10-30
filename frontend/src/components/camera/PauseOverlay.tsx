import React from 'react';
import { Button } from '../ui/button';
import { Camera, RefreshCw, Play } from 'lucide-react';
import { COPY } from '../../lib/copy';

interface PauseOverlayProps {
  isOpen: boolean;
  isFaceLost?: boolean;
  onResume: () => void;
  onRecheck?: () => void;
}

export function PauseOverlay({
  isOpen,
  isFaceLost = false,
  onResume,
  onRecheck,
}: PauseOverlayProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-label="Assessment Paused"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in"
    >
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-stone-200 text-center animate-in zoom-in-95">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-5">
          <Camera className="w-8 h-8" />
        </div>

        <h3 className="font-heading font-bold text-2xl text-stone-900 mb-2">
          {COPY.pauseOverlay.title}
        </h3>

        <p className="text-stone-600 text-sm leading-relaxed mb-6">
          {isFaceLost
            ? COPY.pauseOverlay.cameraLost
            : COPY.pauseOverlay.manualPause}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button onClick={onResume} size="lg" className="w-full sm:w-auto">
            <Play className="w-4 h-4 mr-2" />
            {COPY.pauseOverlay.resumeCta}
          </Button>

          {onRecheck && (
            <Button
              variant="outline"
              size="lg"
              onClick={onRecheck}
              className="w-full sm:w-auto"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Check Camera
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
