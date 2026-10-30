import React from 'react';
import { CORE_DISCLAIMER } from '../../lib/constants';
import { ShieldCheck, Cpu } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-stone-200/80 bg-white/60 py-8 print:hidden">
      <div className="max-w-6xl mx-auto px-6">
        <div className="rounded-xl border border-stone-200 bg-stone-50/80 p-4 mb-6">
          <p className="text-xs text-stone-600 leading-relaxed font-sans">
            <strong className="text-stone-900 font-medium">Screening Aid Notice: </strong>
            {CORE_DISCLAIMER}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Raw video is analyzed live in memory and never saved.</span>
          </div>

          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-stone-400 shrink-0" />
            <span>AI report generated locally via Gemma 4 on this device</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
