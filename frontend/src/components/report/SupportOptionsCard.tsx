import React from 'react';
import { Eye, BookOpen, Users, Stethoscope, AlertCircle } from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';
import { SUPPORT_INFO, SupportCondition } from '../../lib/supportOptions';

export interface SupportIndicator {
  condition: string;
  level: string; // 'low' | 'moderate' | 'high' (case-insensitive)
}

interface SupportOptionsCardProps {
  indicators: SupportIndicator[];
  className?: string;
}

const LEVEL_RANK: Record<string, number> = { low: 0, moderate: 1, high: 2 };

const THEME: Record<SupportCondition, { icon: React.ReactNode; iconBg: string }> = {
  adhd: { icon: <Eye className="w-5 h-5" />, iconBg: 'bg-amber-100 text-amber-800' },
  dyslexia: { icon: <BookOpen className="w-5 h-5" />, iconBg: 'bg-emerald-100 text-emerald-800' },
  autism: { icon: <Users className="w-5 h-5" />, iconBg: 'bg-indigo-100 text-indigo-800' },
};

export function SupportOptionsCard({ indicators, className }: SupportOptionsCardProps) {
  // Show support options only where indicators are moderate or high, highest first
  const shown = indicators
    .map((i) => ({
      condition: i.condition.toLowerCase() as SupportCondition,
      level: i.level.toLowerCase(),
    }))
    .filter((i) => i.condition in SUPPORT_INFO && (LEVEL_RANK[i.level] ?? 0) >= 1)
    .sort((a, b) => (LEVEL_RANK[b.level] ?? 0) - (LEVEL_RANK[a.level] ?? 0));

  return (
    <section
      className={cn('space-y-4 print:break-inside-avoid', className)}
      aria-labelledby="support-options-heading"
    >
      <div>
        <h2
          id="support-options-heading"
          className="font-heading font-bold text-xl text-stone-900 flex items-center gap-2"
        >
          <Stethoscope className="w-5 h-5 text-stone-700" />
          <span>Support options to discuss with a professional</span>
        </h2>
        <p className="text-sm text-stone-600 mt-1 leading-relaxed max-w-2xl">
          These are general, commonly used approaches. They are not a prescription and not a
          diagnosis. Only a qualified professional can say what, if anything, is right for you or
          your child.
        </p>
      </div>

      {shown.length === 0 ? (
        <Card className="p-5">
          <p className="text-sm text-stone-700 leading-relaxed">
            This screening did not show notable indicators in any area, so there are no specific
            support options to list. If you still have concerns, a doctor or school counsellor is
            a good place to start.
          </p>
        </Card>
      ) : (
        shown.map(({ condition, level }) => {
          const info = SUPPORT_INFO[condition];
          const theme = THEME[condition];
          return (
            <Card key={condition} className="p-6 print:break-inside-avoid">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                      theme.iconBg
                    )}
                  >
                    {theme.icon}
                  </div>
                  <h3 className="font-heading font-bold text-lg text-stone-900">{info.name}</h3>
                </div>
                <Badge variant={level === 'high' ? 'amber' : 'neutral'}>
                  <span className="capitalize">{level} indicators</span>
                </Badge>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
                    Who to speak to
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-stone-700">
                    {info.whoToSee.map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
                    Helpful everyday habits
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-stone-700">
                    {info.everyday.map((e) => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
                  Approaches a professional may suggest
                </h4>
                <ul className="space-y-2">
                  {info.options.map((o) => (
                    <li key={o.title} className="text-sm text-stone-700 leading-relaxed">
                      <span className="font-semibold text-stone-900">{o.title}.</span> {o.detail}
                    </li>
                  ))}
                </ul>
              </div>

              <p className="mt-5 text-xs text-stone-600 bg-stone-50 border border-stone-200 rounded-xl p-3 leading-relaxed">
                <strong>Be careful:</strong> {info.watchOut}
              </p>
            </Card>
          );
        })
      )}

      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-xs text-amber-900 leading-relaxed">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p>
          NeuroNudge is a screening aid, not a diagnostic tool. If you notice low mood, strong
          distress, school refusal or any worry about safety, contact a doctor or a local helpline
          right away instead of waiting for a full assessment.
        </p>
      </div>
    </section>
  );
}