import React from 'react';
import { ArrowUpRight, ArrowDownRight, Compass } from 'lucide-react';
import { STAGES } from '../../lib/constants';
import { StageId } from '../../lib/types';

interface RankingCardProps {
  mostLikely: string;
  leastLikely: string;
}

export function RankingCard({ mostLikely, leastLikely }: RankingCardProps) {
  const getStageName = (id: string) => {
    if (id === 'none') return 'No prominent indicators';
    const stage = STAGES[id as StageId];
    return stage ? stage.name : id.toUpperCase();
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 p-6 shadow-xs page-break-inside-avoid">
      <div className="flex items-center gap-2 mb-4">
        <Compass className="w-5 h-5 text-stone-700" />
        <h4 className="font-heading font-bold text-lg text-stone-900">
          Indicator Likelihood Hierarchy
        </h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-800 mb-1">
            <ArrowUpRight className="w-4 h-4 text-amber-600" />
            <span>Primary Observed Focus</span>
          </div>
          <div className="font-heading font-bold text-base text-stone-900 mb-1">
            {getStageName(mostLikely)}
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            Showed the highest proportion of early behavioral or gaze indicator signals during tasks.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-800 mb-1">
            <ArrowDownRight className="w-4 h-4 text-emerald-600" />
            <span>Least Observed Focus</span>
          </div>
          <div className="font-heading font-bold text-base text-stone-900 mb-1">
            {getStageName(leastLikely)}
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            Presented low or baseline indicator signals across measured tasks.
          </p>
        </div>
      </div>
    </div>
  );
}
