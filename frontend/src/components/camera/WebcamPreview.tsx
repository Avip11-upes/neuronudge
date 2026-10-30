import React, { RefObject } from 'react';
import { Camera, CameraOff, Video } from 'lucide-react';
import { Button } from '../ui/button';

interface WebcamPreviewProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  isStreaming: boolean;
  hasPermission: boolean | null;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
  mirrored?: boolean;
}

export function WebcamPreview({
  videoRef,
  isStreaming,
  hasPermission,
  error,
  onRetry,
  className = '',
  mirrored = true,
}: WebcamPreviewProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-stone-900 border border-stone-200/80 aspect-4/3 flex items-center justify-center shadow-inner ${className}`}
    >
      <video
        ref={videoRef}
        playsInline
        autoPlay
        muted
        className={`w-full h-full object-cover ${
          mirrored ? 'scale-x-[-1]' : ''
        } ${isStreaming ? 'block' : 'hidden'}`}
      />

      {/* When camera is active, display subtle indicator */}
      {isStreaming && (
        <div className="absolute top-3 left-3 flex items-center gap-2 bg-stone-950/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-white text-xs select-none">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="font-medium text-[11px] tracking-wide">Camera Active</span>
        </div>
      )}

      {/* Camera permission requested / denied / loading state */}
      {!isStreaming && (
        <div className="p-6 text-center text-white max-w-sm">
          {hasPermission === false ? (
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center mb-3">
                <CameraOff className="w-6 h-6" />
              </div>
              <h4 className="font-heading font-semibold text-stone-100 text-base mb-1">
                Camera Access Needed
              </h4>
              <p className="text-xs text-stone-300 mb-4 leading-relaxed">
                {error || 'Please allow camera access in your browser to start the screening.'}
              </p>
              {onRetry && (
                <Button size="sm" variant="secondary" onClick={onRetry}>
                  Try Connecting Camera Again
                </Button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-stone-800 text-stone-300 flex items-center justify-center mb-3 animate-pulse">
                <Video className="w-6 h-6" />
              </div>
              <p className="text-xs text-stone-300">Connecting camera preview...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
