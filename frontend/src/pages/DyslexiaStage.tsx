import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { McqCard } from '../components/questions/McqCard';
import { Progress } from '../components/ui/progress';
import { Button } from '../components/ui/button';
import { useSessionStore } from '../store/sessionStore';
import { api } from '../lib/api';
import { Question } from '../lib/types';
import { COPY } from '../lib/copy';
import { BookOpen, Loader2 } from 'lucide-react';

export default function DyslexiaStage() {
  const navigate = useNavigate();
  const { sessionId, profile, updateStageStatus } = useSessionStore();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch dyslexia questions
  useEffect(() => {
    let isDisposed = false;
    async function load() {
      setIsLoading(true);
      try {
        if (sessionId) {
          await api.startStage(sessionId, 'dyslexia').catch(() => {});
          updateStageStatus('dyslexia', 'running');
        }

        const res = await api.getQuestions('dyslexia', profile?.age);
        if (!isDisposed) {
          setQuestions(res.questions);
        }
      } catch (err) {
        console.warn('Failed loading dyslexia questions', err);
      } finally {
        if (!isDisposed) setIsLoading(false);
      }
    }
    load();
    return () => {
      isDisposed = true;
    };
  }, [sessionId, profile?.age, updateStageStatus]);

  const handleAnswer = async (
    optionId: string,
    responseMs: number,
    answerChanges: number
  ) => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    if (sessionId) {
      await api.submitAnswer(sessionId, {
        stage: 'dyslexia',
        question_id: currentQ.id,
        option_id: optionId,
        response_ms: responseMs,
        answer_changes: answerChanges,
      }).catch(() => {});
    }

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Stage finished
      if (sessionId) {
        await api.finishStage(sessionId, 'dyslexia').catch(() => {});
      }
      updateStageStatus('dyslexia', 'done');
      navigate('/hub');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
        <p className="text-stone-600 text-sm">Preparing reading puzzles...</p>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Top Header & Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
              Stage 2 of 3 · Reading & Phonology
            </span>
          </div>

          <span className="text-xs font-semibold text-stone-600">
            {currentIndex + 1} of {questions.length} questions
          </span>
        </div>

        {/* Relaxed Progress Bar (no countdown) */}
        <Progress value={progressPercent} color="emerald" className="h-2" />
      </div>

      {/* Main MCQ Card */}
      {currentQ ? (
        <McqCard
          question={currentQ}
          questionNumber={currentIndex + 1}
          totalQuestions={questions.length}
          onAnswer={handleAnswer}
          accentColor="emerald"
          language={profile?.language || 'en'}
        />
      ) : (
        <div className="text-center py-12">
          <p className="text-stone-600">No questions available.</p>
          <Button onClick={() => navigate('/hub')} className="mt-4">
            Back to Hub
          </Button>
        </div>
      )}
    </div>
  );
}
