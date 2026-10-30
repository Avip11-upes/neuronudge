import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { COPY } from '../lib/copy';
import { CORE_DISCLAIMER } from '../lib/constants';
import { ShieldCheck, Lock, Eye, AlertTriangle, ArrowRight, CheckSquare, Square } from 'lucide-react';

export default function Consent() {
  const navigate = useNavigate();
  const [agreedGeneral, setAgreedGeneral] = useState(false);
  const [isMinor, setIsMinor] = useState(false);
  const [agreedGuardian, setAgreedGuardian] = useState(false);

  const canProceed = agreedGeneral && (!isMinor || agreedGuardian);

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canProceed) return;
    navigate('/profile', { state: { isMinor } });
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      {/* Top Breadcrumb / Title */}
      <div className="text-center max-w-xl mx-auto mb-8">
        <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2 block">
          Step 1 of 3 · Privacy & Understanding
        </span>
        <h1 className="font-heading font-bold text-3xl sm:text-4xl text-stone-900 mb-3">
          {COPY.consent.title}
        </h1>
        <p className="text-stone-600 text-sm leading-relaxed">
          {COPY.consent.subtitle}
        </p>
      </div>

      {/* Mandatory Required Sentence in Prominent Container */}
      <div className="mb-6 p-5 rounded-2xl bg-emerald-50/90 border border-emerald-200/90 text-emerald-950 flex items-start gap-3.5 shadow-2xs">
        <Lock className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <p className="text-sm font-semibold leading-relaxed">
          {COPY.consent.aiNotice}
        </p>
      </div>

      {/* Privacy Commitments List */}
      <Card className="mb-6 space-y-4">
        {COPY.consent.points.map((pt, idx) => (
          <div key={idx} className="flex items-start gap-3.5 pb-3 border-b border-stone-100 last:border-b-0 last:pb-0">
            <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center text-stone-800 shrink-0 mt-0.5">
              {idx === 0 && <Eye className="w-4 h-4" />}
              {idx === 1 && <ShieldCheck className="w-4 h-4 text-emerald-600" />}
              {idx === 2 && <AlertTriangle className="w-4 h-4 text-amber-600" />}
              {idx === 3 && <Lock className="w-4 h-4 text-indigo-600" />}
            </div>
            <div>
              <h4 className="font-heading font-semibold text-sm text-stone-900 mb-0.5">
                {pt.title}
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                {pt.desc}
              </p>
            </div>
          </div>
        ))}
      </Card>

      {/* Scope Disclaimer Box */}
      <div className="mb-8 p-4 rounded-xl bg-stone-100/80 border border-stone-200 text-stone-600 text-xs leading-relaxed">
        <strong className="text-stone-800 font-semibold">Important Scope Notice: </strong>
        {CORE_DISCLAIMER}
      </div>

      {/* Consent Form Form Fields */}
      <form onSubmit={handleContinue} className="space-y-5 bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
        {/* Is the participant under 18? */}
        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-stone-900 block">
              Is the participant under 18 years old?
            </span>
            <span className="text-xs text-stone-500">
              Select yes if this screening is being taken by a child or teen.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMinor(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                !isMinor
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'bg-white text-stone-700 border-stone-300'
              }`}
            >
              18+ (Adult)
            </button>
            <button
              type="button"
              onClick={() => setIsMinor(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                isMinor
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'bg-white text-stone-700 border-stone-300'
              }`}
            >
              Under 18
            </button>
          </div>
        </div>

        {/* General Consent Checkbox */}
        <label
          htmlFor="general-consent"
          className="flex items-start gap-3.5 p-4 rounded-xl border border-stone-200 bg-stone-50/50 hover:bg-stone-50 transition-colors cursor-pointer select-none"
        >
          <input
            id="general-consent"
            type="checkbox"
            checked={agreedGeneral}
            onChange={(e) => setAgreedGeneral(e.target.checked)}
            className="w-5 h-5 rounded-md border-stone-300 text-stone-900 accent-stone-900 focus:ring-stone-900 mt-0.5 cursor-pointer shrink-0"
          />
          <span className="text-xs sm:text-sm text-stone-800 leading-snug font-medium">
            {COPY.consent.generalConsentLabel}
          </span>
        </label>

        {/* Extra Guardian Consent Checkbox if Age < 18 */}
        {isMinor && (
          <label
            htmlFor="guardian-consent"
            className="flex items-start gap-3.5 p-4 rounded-xl border border-amber-300 bg-amber-50/60 hover:bg-amber-50 transition-colors cursor-pointer select-none animate-in fade-in"
          >
            <input
              id="guardian-consent"
              type="checkbox"
              checked={agreedGuardian}
              onChange={(e) => setAgreedGuardian(e.target.checked)}
              className="w-5 h-5 rounded-md border-amber-400 text-amber-800 accent-amber-800 focus:ring-amber-500 mt-0.5 cursor-pointer shrink-0"
            />
            <span className="text-xs sm:text-sm text-amber-950 leading-snug font-medium">
              {COPY.consent.guardianConsentLabel}
            </span>
          </label>
        )}

        {/* Action Buttons */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-stone-100">
          <Link to="/" className="w-full sm:w-auto">
            <Button type="button" variant="ghost" size="md" className="w-full sm:w-auto">
              {COPY.consent.backButton}
            </Button>
          </Link>

          <Button
            type="submit"
            size="lg"
            disabled={!canProceed}
            className="w-full sm:w-auto px-8 gap-2"
          >
            <span>{COPY.consent.continueButton}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
