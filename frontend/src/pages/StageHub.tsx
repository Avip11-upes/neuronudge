import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ProgressStepper } from '../components/layout/ProgressStepper';
import { useSessionStore } from '../store/sessionStore';
import { STAGES } from '../lib/constants';
import { COPY } from '../lib/copy';
import { api } from '../lib/api';
import { StageId, HealthResponse } from '../lib/types';
import {
  Eye,
  BookOpen,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export default function StageHub() {
  const navigate = useNavigate();
  const { sessionId, profile, stages, isAllStagesDone } = useSessionStore();
  const [health, setHealth] = useState<HealthResponse | null>(null);

  useEffect(() => {
    // Check local LLM health on load
    api.getHealth().then((res) => {
      setHealth(res);
    });
  }, []);

  const stageOrder: StageId[] = ['adhd', 'dyslexia', 'autism'];

  // Find next stage to run
  const nextStage = stageOrder.find((s) => stages[s] !== 'done') || 'adhd';

  const handleStageClick = (stageId: StageId) => {
    navigate(`/${stageId}`);
  };

  const handleGenerateReport = () => {
    navigate('/processing');
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Non-blocking LLM Health Banner if llm.ready is false */}
      {health && !health.llm.ready && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-3 shadow-2xs">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">{COPY.hub.llmOfflineNotice}</p>
        </div>
      )}

      {/* Header Info */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1 block">
              Screening Dashboard {profile?.nickname ? `· ${profile.nickname}` : ''}
            </span>
            <h1 className="font-heading font-bold text-3xl sm:text-4xl text-stone-900">
              {COPY.hub.title}
            </h1>
          </div>

          {/* Quick Action Top Button */}
          {isAllStagesDone ? (
            <Button
              onClick={handleGenerateReport}
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>{COPY.hub.generateCta}</span>
            </Button>
          ) : (
            <Button
              onClick={() => handleStageClick(nextStage)}
              size="lg"
              className="gap-2 shadow-sm"
            >
              <span>{stages[nextStage] === 'running' ? COPY.hub.resumeCta : COPY.hub.startStageCta}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>

        <p className="text-stone-600 text-sm mt-2 max-w-2xl leading-relaxed">
          {COPY.hub.subtitle}
        </p>

        {/* 3-Stage Progress Stepper */}
        <ProgressStepper stages={stages} className="mt-6" />
      </div>

      {/* Stage Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stageOrder.map((stageId) => {
          const meta = STAGES[stageId];
          const status = stages[stageId];
          const isDone = status === 'done';
          const isRunning = status === 'running';

          const getStatusBadge = () => {
            if (isDone) {
              return (
                <Badge variant="emerald">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{COPY.hub.stageCompletedBadge}</span>
                </Badge>
              );
            }
            if (isRunning) {
              return (
                <Badge variant="amber">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>{COPY.hub.stageRunningBadge}</span>
                </Badge>
              );
            }
            return (
              <Badge variant="neutral">
                <span>{COPY.hub.stagePendingBadge}</span>
              </Badge>
            );
          };

          return (
            <Card
              key={stageId}
              className={`flex flex-col justify-between p-6 transition-all border ${
                isDone
                  ? 'border-emerald-200/90 bg-emerald-50/20'
                  : isRunning
                  ? 'border-amber-300 bg-amber-50/20 ring-1 ring-amber-300'
                  : 'border-stone-200 hover:border-stone-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      stageId === 'adhd'
                        ? 'bg-amber-100 text-amber-800'
                        : stageId === 'dyslexia'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-indigo-100 text-indigo-800'
                    }`}
                  >
                    {stageId === 'adhd' && <Eye className="w-5 h-5" />}
                    {stageId === 'dyslexia' && <BookOpen className="w-5 h-5" />}
                    {stageId === 'autism' && <Users className="w-5 h-5" />}
                  </div>
                  {getStatusBadge()}
                </div>

                <h3 className="font-heading font-bold text-lg text-stone-900 mb-1">
                  {meta.name}
                </h3>
                <p className="text-xs text-stone-500 mb-3">{meta.subtitle}</p>

                <p className="text-xs text-stone-600 leading-relaxed mb-4">
                  {meta.methodology}
                </p>
              </div>

              <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs text-stone-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span>~{meta.estimatedMinutes} mins</span>
                </span>

                <Button
                  size="sm"
                  variant={isDone ? 'outline' : 'primary'}
                  onClick={() => handleStageClick(stageId)}
                  className="px-4"
                >
                  {isDone ? 'Review' : isRunning ? 'Resume' : 'Start'}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Completion Banner When All Done */}
      {isAllStagesDone && (
        <div className="bg-linear-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 p-8 rounded-3xl text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="font-heading font-bold text-2xl text-stone-900 mb-2">
            {COPY.hub.allDoneTitle}
          </h2>
          <p className="text-stone-600 text-sm max-w-md mx-auto mb-6 leading-relaxed">
            {COPY.hub.allDoneSubtitle}
          </p>

          <Button
            onClick={handleGenerateReport}
            size="lg"
            className="bg-stone-900 hover:bg-stone-800 text-white px-8 gap-2 shadow-sm text-base"
          >
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>{COPY.hub.generateCta}</span>
          </Button>
        </div>
      )}
    </div>
  );
}
