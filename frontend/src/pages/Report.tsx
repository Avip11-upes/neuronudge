import React, { useEffect, useState } from 'react';
import { SupportOptionsCard } from '../components/report/SupportOptionsCard';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { IndicatorChart } from '../components/report/IndicatorChart';
import { ConditionCard } from '../components/report/ConditionCard';
import { RankingCard } from '../components/report/RankingCard';
import { useSessionStore } from '../store/sessionStore';
import { api } from '../lib/api';
import { Report as ReportType } from '../lib/types';
import { COPY } from '../lib/copy';
import { CORE_DISCLAIMER } from '../lib/constants';
import {
  Printer,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  History,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  Cpu,
} from 'lucide-react';

export default function Report() {
  const location = useLocation();
  const navigate = useNavigate();
  const { sessionId, profile, clearSession } = useSessionStore();

  const [report, setReport] = useState<ReportType | null>(() => {
    return (location.state as any)?.report || null;
  });
  const [isLoading, setIsLoading] = useState(!report);

  useEffect(() => {
    if (!report) {
      const targetId = sessionId || 'demo_session';
      api.getReport(targetId).then((res) => {
        setReport(res);
        setIsLoading(false);
      });
    }
  }, [report, sessionId]);

  const handlePrint = () => {
    window.print();
  };

  const handleStartNew = () => {
    clearSession();
    navigate('/');
  };

  if (isLoading || !report) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8">
        <Sparkles className="w-8 h-8 animate-spin text-amber-500 mb-3" />
        <p className="text-stone-600 text-sm">Loading screening report...</p>
      </div>
    );
  }

  const generatedByBadgeText =
    COPY.report.generatedBy[report.generated_by] || 'Written locally by Gemma 4';

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 report-sheet">
      {/* Top Action Header (Hidden during printing) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 print:hidden">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 block mb-1">
            Confidential Screening Summary · {profile?.nickname || 'Participant'}
          </span>
          <h1 className="font-heading font-bold text-3xl sm:text-4xl text-stone-900">
            {COPY.report.title}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            onClick={handlePrint}
            variant="outline"
            size="md"
            className="gap-2 shadow-2xs"
          >
            <Printer className="w-4 h-4 text-stone-700" />
            <span>{COPY.report.printButton}</span>
          </Button>

          <Button
            onClick={handleStartNew}
            variant="ghost"
            size="md"
            className="gap-1 text-stone-600 hover:text-stone-900"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Session</span>
          </Button>
        </div>
      </div>

      {/* Print-Only Official Header */}
      <div className="hidden print:block mb-6 border-b border-stone-300 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold font-heading text-stone-900">
            NeuroNudge Screening Summary
          </h1>
          <span className="text-xs text-stone-500">
            Date: {new Date().toLocaleDateString()}
          </span>
        </div>
        <p className="text-xs text-stone-600 mt-1">
          Participant: <strong>{profile?.nickname || 'Confidential'}</strong> (Age: {profile?.age || 'Unspecified'})
        </p>
      </div>

      {/* Model Attribution Badge */}
      <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-stone-100/80 border border-stone-200/90 mb-6">
        <div className="flex items-center gap-2 text-xs font-medium text-stone-700">
          <Cpu className="w-4 h-4 text-stone-600" />
          <span>{generatedByBadgeText}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>On-device processing</span>
        </div>
      </div>

      {/* Summary Paragraph */}
      <Card className="mb-6 p-6">
        <h3 className="font-heading font-bold text-lg text-stone-900 mb-2">
          {COPY.report.summaryHeading}
        </h3>
        <p className="text-stone-700 text-sm sm:text-base leading-relaxed">
          {report.summary}
        </p>
      </Card>

      {/* Visual Indicator Spectrum (Recharts Bar Chart) */}
      <div className="mb-6">
        <IndicatorChart indicators={report.indicators} />
      </div>

      {/* Likelihood Ranking Card */}
      <div className="mb-6">
        <RankingCard
          mostLikely={report.most_likely}
          leastLikely={report.least_likely}
        />
      </div>

      {/* Stage-by-Stage Condition Breakdown Cards */}
      <div className="space-y-6 mb-6">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-bold text-xl text-stone-900">
            {COPY.report.conditionsHeading}
          </h3>
          <span className="text-xs text-stone-500">3 assessed domains</span>
        </div>

        {report.indicators.map((indicator) => (
          <ConditionCard key={indicator.condition} indicator={indicator} />
        ))}
      </div>

      {/* Supportive Recommendations */}
      <Card className="mb-6 p-6 page-break-inside-avoid">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-amber-600" />
          <h3 className="font-heading font-bold text-lg text-stone-900">
            {COPY.report.recommendationsHeading}
          </h3>
        </div>

        <ul className="space-y-3">
          {report.recommendations.map((rec, idx) => (
            <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-stone-700 leading-relaxed">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Confidence & Measurement Integrity Note */}
      <div className="mb-6 p-4 rounded-xl bg-stone-100/90 border border-stone-200 text-xs text-stone-700 leading-relaxed page-break-inside-avoid">
        <strong className="text-stone-900 font-semibold block mb-0.5">
          {COPY.report.confidenceHeading}:
        </strong>
        {report.confidence_note}
      </div>

      {/* Prominent Mandatory Disclaimer in a Visible Box */}
      <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200/90 text-amber-950 text-xs sm:text-sm leading-relaxed page-break-inside-avoid shadow-2xs">
        <div className="flex items-center gap-2 font-bold mb-1.5 text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
          <span>Screening Disclaimer & Medical Boundary</span>
        </div>
        <p>{report.disclaimer || CORE_DISCLAIMER}</p>
      </div>

      {/* Bottom Nav Footer (Hidden during printing) */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-stone-200 print:hidden">
        <Link to="/history">
          <Button variant="outline" size="md" className="gap-2">
            <History className="w-4 h-4" />
            <span>View All Past Sessions</span>
          </Button>
        </Link>

        <Button onClick={handleStartNew} size="md">
          <span>Start Another Screening</span>
        </Button>
      </div>
    </div>
  );
}
