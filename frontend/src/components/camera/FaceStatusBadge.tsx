import React from 'react';
import { Badge } from '../ui/badge';
import { Camera, Sun, Eye, AlertCircle, CheckCircle2 } from 'lucide-react';

interface FaceStatusBadgeProps {
  faceFound: boolean;
  lighting: 'ok' | 'low' | 'high';
  gazeOnScreen?: number;
  compact?: boolean;
}

export function FaceStatusBadge({
  faceFound,
  lighting,
  gazeOnScreen,
  compact = false,
}: FaceStatusBadgeProps) {
  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 bg-stone-900/80 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-xs shadow-sm">
        <span
          className={`w-2 h-2 rounded-full ${
            faceFound ? 'bg-emerald-400' : 'bg-rose-400 animate-pulse'
          }`}
        />
        <span className="font-medium">{faceFound ? 'Tracking' : 'Face lost'}</span>
        {gazeOnScreen !== undefined && (
          <span className="text-stone-300 border-l border-stone-700 pl-2">
            Gaze: {Math.round(gazeOnScreen * 100)}%
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <Badge variant={faceFound ? 'emerald' : 'rose'}>
        {faceFound ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        ) : (
          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
        )}
        <span>{faceFound ? 'Face Detected' : 'Looking for Face'}</span>
      </Badge>

      <Badge variant={lighting === 'ok' ? 'neutral' : 'amber'}>
        <Sun className="w-3.5 h-3.5 text-amber-600" />
        <span>
          {lighting === 'ok'
            ? 'Lighting Good'
            : lighting === 'low'
            ? 'Lighting Dim'
            : 'Lighting Bright'}
        </span>
      </Badge>

      {gazeOnScreen !== undefined && (
        <Badge variant="neutral">
          <Eye className="w-3.5 h-3.5 text-stone-500" />
          <span>On-Screen Gaze: {Math.round(gazeOnScreen * 100)}%</span>
        </Badge>
      )}
    </div>
  );
}
