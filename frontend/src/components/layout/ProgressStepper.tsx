import React from 'react';
import { StageId, StageStatus } from '../../lib/types';
import { STAGES } from '../../lib/constants';
import { Check, CircleDot, Circle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ProgressStepperProps {
  currentStage?: StageId;
  stages: Record<StageId, StageStatus>;
  className?: string;
}

export function ProgressStepper({ currentStage, stages, className }: ProgressStepperProps) {
  const stageList: StageId[] = ['adhd', 'dyslexia', 'autism'];

  return (
    <div className={cn('w-full py-4', className)}>
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        {stageList.map((stageId, index) => {
          const meta = STAGES[stageId];
          const status = stages[stageId];
          const isCurrent = currentStage === stageId;
          const isDone = status === 'done';

          return (
            <div
              key={stageId}
              className={cn(
                'relative flex flex-col p-3 rounded-xl border transition-all text-left',
                isCurrent
                  ? 'border-stone-900 bg-white ring-1 ring-stone-900 shadow-sm'
                  : isDone
                  ? 'border-emerald-200 bg-emerald-50/40'
                  : 'border-stone-200 bg-stone-100/60 opacity-80'
              )}
            >
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className="text-[11px] font-semibold tracking-wider uppercase text-stone-500">
                  Stage {index + 1}
                </span>
                {isDone ? (
                  <span className="flex items-center text-xs font-medium text-emerald-700">
                    <Check className="w-3.5 h-3.5 mr-0.5 stroke-[2.5]" /> Done
                  </span>
                ) : isCurrent ? (
                  <span className="flex items-center text-xs font-semibold text-stone-900">
                    <CircleDot className="w-3.5 h-3.5 mr-0.5 animate-pulse text-amber-600" /> Active
                  </span>
                ) : (
                  <span className="flex items-center text-xs text-stone-400">
                    <Circle className="w-3 h-3 mr-0.5" /> Pending
                  </span>
                )}
              </div>

              <div className="font-heading font-semibold text-sm text-stone-900 truncate">
                {meta.name}
              </div>
              <div className="text-xs text-stone-500 truncate hidden sm:block">
                ~{meta.estimatedMinutes} mins
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
