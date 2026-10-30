import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { McqCard } from '../components/questions/McqCard';
import { Progress } from '../components/ui/progress';
import { Button } from '../components/ui/button';
import { useSessionStore } from '../store/sessionStore';
import { api } from '../lib/api';
import { Question } from '../lib/types';
import { Loader2, AlertCircle } from 'lucide-react';

const LOAD_TIMEOUT_MS = 8000;

// Rejects if the promise takes too long, so the page can never spin forever
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new Error('Request timed out')), ms);
    promise.then(
      (v) => {
        clearTimeout(id);
        resolve(v);
      },
      (e) => {
        clearTimeout(id);
        reject(e);
      }
    );
  });
}

export default function DyslexiaStage() {
  const navigate = useNavigate();
  const { sessionId, profile, stages, updateStageStatus } = useSessionStore();
  const age = profile?.age;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const startedRef = useRef(false); // stage start runs once
  const finishedRef = useRef(false); // stage finish runs once

  // Start the stage once. Don't flip an already-finished stage back to "running".
  useEffect(() => {
    if (!sessionId || startedRef.current) return;
    startedRef.current = true;

    api.startStage(sessionId, 'dyslexia').catch((err) => {
      console.warn('Could not start dyslexia stage on backend', err);
    });
    if (stages.dyslexia !== 'done') {
      updateStageStatus('dyslexia', 'running');
    }
  }, [sessionId, stages, updateStageStatus]);

  // Load questions. Depends only on age and the retry counter, so store updates can't restart it.
  useEffect(() => {
    let disposed = false;
    setIsLoading(true);
    setError(null);

    withTimeout(api.getQuestions('dyslexia', age), LOAD_TIMEOUT_MS)
      .then((res) => {
        if (disposed) return;
        const raw: any = res;
        const list: Question[] = Array.isArray(raw) ? raw : raw?.questions ?? [];
        setQuestions(list);
        setCurrentIndex(0);
      })
      .catch((err) => {
        console.error('Could not load dyslexia questions', err);
        if (!disposed) setError('We could not load the reading puzzles.');
      })
      .finally(() => {
        if (!disposed) setIsLoading(false);
      });

    return () => {
      disposed = true;
    };
  }, [age, reloadKey]);

  const finishStage = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (sessionId) {
      api.finishStage(sessionId, 'dyslexia').catch(() => {});
    }
    updateStageStatus('dyslexia', 'done');
    navigate('/hub');
  };

  // Update the UI first; tell the backend in the background
  const handleAnswer = (optionId: string, responseMs: number, answerChanges: number) => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    if (sessionId) {
      api
        .submitAnswer(sessionId, {
          stage: 'dyslexia',
          question_id: currentQ.id,
          option_id: optionId,
          response_ms: responseMs,
          answer_changes: answerChanges,
        })
        .catch(() => {});
    }

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      finishStage();
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

  if (error) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="w-8 h-8 text-amber-600 mb-3" />
        <p className="text-stone-800 text-sm font-medium mb-1">{error}</p>
        <p className="text-stone-500 text-xs mb-4 max-w-sm">
          The question service may not be running yet. You can try again or go back to the hub.
        </p>
        <div className="flex gap-3">
          <Button onClick={() => setReloadKey((k) => k + 1)}>Try again</Button>
          <Button variant="outline" onClick={() => navigate('/hub')}>
            Back to Hub
          </Button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const progressPercent =
    questions.length > 0 ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
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

        <Progress value={progressPercent} color="emerald" className="h-2" />
      </div>

      {currentQ ? (
        <McqCard
          key={currentQ.id}
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