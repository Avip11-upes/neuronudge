import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { ReportIndicator } from '../../lib/types';

interface IndicatorChartProps {
  indicators: ReportIndicator[];
}

export function IndicatorChart({ indicators }: IndicatorChartProps) {
  const data = indicators.map((ind) => {
    const nameMap = {
      adhd: 'ADHD (Attention)',
      dyslexia: 'Dyslexia (Reading)',
      autism: 'Autism (Social)',
    };
    return {
      condition: ind.condition,
      name: nameMap[ind.condition] || ind.condition,
      score: ind.score,
      level: ind.level,
    };
  });

  const getColor = (level: string) => {
    switch (level) {
      case 'high':
        return '#f59e0b'; // warm amber
      case 'moderate':
        return '#0284c7'; // soft ocean sky
      case 'low':
      default:
        return '#10b981'; // gentle emerald
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6">
        <div>
          <h4 className="font-heading font-bold text-lg text-stone-900">
            Indicator Spectrum (0–100)
          </h4>
          <p className="text-xs text-stone-500">
            Scores reflect observed screening signals, not a diagnostic confirmation.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-stone-500 font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Low (&lt;35)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-sky-600" /> Moderate (35–65)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> High (&gt;65)
          </span>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 40, bottom: 10 }}
          >
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#78716c' }} />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 12, fill: '#292524', fontWeight: 500 }}
              width={130}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="bg-stone-900 text-white text-xs rounded-xl px-3 py-2 shadow-lg border border-stone-700">
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-stone-300">
                        Score: <span className="font-mono">{item.score}</span> / 100 (
                        <span className="capitalize">{item.level}</span> indicators)
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine x={35} stroke="#d6d3d1" strokeDasharray="3 3" />
            <ReferenceLine x={65} stroke="#d6d3d1" strokeDasharray="3 3" />
            <Bar dataKey="score" radius={[0, 8, 8, 0]} barSize={24}>
              {data.map((entry) => (
                <Cell key={entry.condition} fill={getColor(entry.level)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
