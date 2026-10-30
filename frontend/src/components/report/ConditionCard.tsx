import React from 'react';
import { Badge } from '../ui/badge';
import { Eye, Activity, CheckCircle2 } from 'lucide-react';
import { ReportIndicator } from '../../lib/types';
import { STAGES } from '../../lib/constants';

interface ConditionCardProps {
  indicator: ReportIndicator;
}

export function ConditionCard({ indicator }: ConditionCardProps) {
  const meta = STAGES[indicator.condition];

  const levelVariant = {
    low: 'emerald',
    moderate: 'amber',
    high: 'rose',
  }[indicator.level] as 'emerald' | 'amber' | 'rose';

  const levelLabels = {
    low: 'Low Indicators',
    moderate: 'Moderate Indicators',
    high: 'High Indicators',
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 p-6 shadow-xs transition-all page-break-inside-avoid">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 border-b border-stone-100 pb-4">
        <div>
          <h4 className="font-heading font-bold text-xl text-stone-900">
            {meta?.name || indicator.condition.toUpperCase()}
          </h4>
          <p className="text-xs text-stone-500">{meta?.subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={levelVariant}>
            {levelLabels[indicator.level]} · Score: {indicator.score}/100
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Observed Symptoms */}
        <div className="bg-stone-50/70 rounded-xl p-4 border border-stone-200/60">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-600 mb-3">
            <Activity className="w-3.5 h-3.5 text-stone-500" />
            <span>Observed Patterns</span>
          </div>
          <ul className="space-y-2">
            {indicator.observed_symptoms.map((symptom, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-stone-700 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-stone-400 mt-1.5 shrink-0" />
                <span>{symptom}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Evidence from Numeric Measurements */}
        <div className="bg-stone-50/70 rounded-xl p-4 border border-stone-200/60">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-600 mb-3">
            <Eye className="w-3.5 h-3.5 text-stone-500" />
            <span>Measurement Evidence</span>
          </div>
          <ul className="space-y-2">
            {indicator.evidence.map((ev, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-stone-700 leading-relaxed">
                <CheckCircle2 className="w-3.5 h-3.5 text-stone-500 mt-0.5 shrink-0" />
                <span>{ev}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
