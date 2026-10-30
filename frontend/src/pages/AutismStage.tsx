import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { McqCard } from '../components/questions/McqCard';
import { AnimatedFace } from '../components/stimuli/AnimatedFace';
import { FaceStatusBadge } from '../components/camera/FaceStatusBadge';
import { PauseOverlay } from '../components/camera/PauseOverlay';
import { Progress } from '../components/ui/progress';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { useSessionStore } from '../store/sessionStore';
import { useWebcam } from '../hooks/useWebcam';
import { useFrameStream } from '../hooks/useFrameStream';
import { api } from '../lib/api';
import { Question } from '../lib/types';
import { COPY } from '../lib/copy';
import { ArrowRight, Video, Pause, Play, Users, Loader2, AlertCircle } from 'lucide-react';

const LOAD_TIMEOUT_MS = 8000;
const SEGMENT_SECONDS = 60;

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

/* ------------------------------------------------------------------ */
/* Part B: animated face (talking) + neutral waiting screen            */
/* Mounted only when Part B starts, so the camera is on only here.     */
/* ------------------------------------------------------------------ */

interface PartBProps {
  sessionId: string | null;
  onFinish: () => void;
}

function PartB({ sessionId, onFinish }: PartBProps) {
  const [phase, setPhase] = useState<'talking' | 'waiting'>('talking');
  const [timeLeft, setTimeLeft] = useState(SEGMENT_SECONDS);
  const [isPaused, setIsPaused] = useState(false);

  const activeBlock = phase === 'talking' ? 'autism_social_face' : 'autism_neutral_wait';

  const { videoRef, isStreaming, captureFrame } = useWebcam({ autoStart: true });

  const {
    faceFound,
    lighting,
    gazeOnScreen,
    showFaceLostWarning,
    dismissFaceLostWarning,
  } = useFrameStream({
    sessionId: sessionId || 'autism_stage_session',
    stage: 'autism',
    activeBlock,
    isStreaming,
    captureFrame,
    enabled: isStreaming && !isPaused,
  });

  const onFinishRef = useRef(onFinish);
  useEffect(() => {
    onFinishRef.current = onFinish;
  });

  const sendMarker = useCallback(
    (block: string, event: 'start' | 'end') => {
      if (!sessionId) return;
      api
        .sendBlockMarker(sessionId, { stage: 'autism', block, event, t: Date.now() })
        .catch(() => {});
    },
    [sessionId]
  );

  // Tell the backend which block is on screen whenever the phase changes
  useEffect(() => {
    sendMarker(activeBlock, 'start');
  }, [activeBlock, sendMarker]);

  // Countdown: only decrements, no side effects inside the updater
  useEffect(() => {
    if (isPaused || showFaceLostWarning) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isPaused, showFaceLostWarning]);

  // When a segment hits 0: talking -> waiting, waiting -> finish
  useEffect(() => {
    if (timeLeft !== 0) return;
    sendMarker(activeBlock, 'end');
    if (phase === 'talking') {
      setPhase('waiting');
      setTimeLeft(SEGMENT_SECONDS);
    } else {
      onFinishRef.current();
    }
  }, [timeLeft, phase, activeBlock, sendMarker]);

  return (
    <div>
      <PauseOverlay
        isOpen={isPaused || showFaceLostWarning}
        isFaceLost={showFaceLostWarning}
        onResume={() => {
          dismissFaceLostWarning();
          setIsPaused(false);
        }}
      />

      {/* Hidden live video element for webcam capture */}
      <video
        ref={videoRef}
        playsInline
        autoPlay
        muted
        className="sr-only pointer-events-none"
        aria-hidden="true"
      />

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-800">
            Stage 3 · Part B ({phase === 'talking' ? 'Story Listening' : 'Quiet Pause'})
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-stone-900 text-white px-3 py-1.5 rounded-full text-xs font-medium">
            <Video className="w-3.5 h-3.5 text-emerald-400" />
            <span>Camera on</span>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsPaused((prev) => !prev)}
            className="rounded-full px-3"
          >
            {isPaused ? <Play className="w-3.5 h-3.5 mr-1" /> : <Pause className="w-3.5 h-3.5 mr-1" />}
            <span>{isPaused ? 'Resume' : 'Pause'}</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => onFinishRef.current()}
            className="text-stone-500 hover:text-stone-700 text-xs px-2"
          >
            Finish Stage
          </Button>
        </div>
      </div>

      <AnimatedFace
        phase={phase}
        timeLeft={timeLeft}
        isPaused={isPaused || showFaceLostWarning}
      />

      <div className="mt-6 bg-white rounded-2xl border border-stone-200/90 p-4 flex items-center justify-between shadow-2xs">
        <FaceStatusBadge
          faceFound={faceFound}
          lighting={lighting}
          gazeOnScreen={gazeOnScreen}
          compact={true}
        />

        <div className="flex items-center gap-2 text-xs text-stone-500">
          <span>Segment timer:</span>
          <span className="font-mono font-semibold text-stone-900 text-sm">{timeLeft}s</span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Stage 3 page                                                        */
/* ------------------------------------------------------------------ */

export default function AutismStage() {
  const navigate = useNavigate();
  const { sessionId, profile, stages, updateStageStatus } = useSessionStore();
  const age = profile?.age;

  const [part, setPart] = useState<'A' | 'B_INTRO' | 'B'>('A');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const startedRef = useRef(false); // stage start runs once
  const finishedRef = useRef(false); // stage finish runs once

  // Start the stage once. Don't flip an already-finished stage back to "running".
  useEffect(() => {
    if (!sessionId || startedRef.current) return;
    startedRef.current = true;

    api.startStage(sessionId, 'autism').catch((err) => {
      console.warn('Could not start autism stage on backend', err);
    });
    if (stages.autism !== 'done') {
      updateStageStatus('autism', 'running');
    }
  }, [sessionId, stages, updateStageStatus]);

  // Load Part A questions. Depends only on age and the retry counter.
  useEffect(() => {
    let disposed = false;
    setIsLoading(true);
    setError(null);

    withTimeout(api.getQuestions('autism', age), LOAD_TIMEOUT_MS)
      .then((res) => {
        if (disposed) return;
        const raw: any = res;
        const list: Question[] = Array.isArray(raw) ? raw : raw?.questions ?? [];
        setQuestions(list);
        setCurrentQIndex(0);
      })
      .catch((err) => {
        console.error('Could not load autism questions', err);
        if (!disposed) setError('We could not load the social scenarios.');
      })
      .finally(() => {
        if (!disposed) setIsLoading(false);
      });

    return () => {
      disposed = true;
    };
  }, [age, reloadKey]);

  // Finish the stage: update the UI first, tell the backend in the background
  const finishStage = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (sessionId) {
      api.finishStage(sessionId, 'autism').catch(() => {});
    }
    updateStageStatus('autism', 'done');
    navigate('/hub');
  }, [sessionId, updateStageStatus, navigate]);

  // Part A answer: update the UI first; tell the backend in the background
  const handleAnswerPartA = (optionId: string, responseMs: number, answerChanges: number) => {
    const currentQ = questions[currentQIndex];
    if (!currentQ) return;

    if (sessionId) {
      api
        .submitAnswer(sessionId, {
          stage: 'autism',
          question_id: currentQ.id,
          option_id: optionId,
          response_ms: responseMs,
          answer_changes: answerChanges,
        })
        .catch(() => {});
    }

    if (currentQIndex + 1 < questions.length) {
      setCurrentQIndex((prev) => prev + 1);
    } else {
      setPart('B_INTRO');
    }
  };

  /* ---------- Part B ---------- */
  if (part === 'B') {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <PartB sessionId={sessionId} onFinish={finishStage} />
      </div>
    );
  }

  /* ---------- Part B intro ---------- */
  if (part === 'B_INTRO') {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <Card className="p-8 text-center max-w-xl mx-auto animate-in fade-in">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-800 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8" />
          </div>

          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700 mb-1 block">
            Stage 3 · Part B
          </span>
          <h2 className="font-heading font-bold text-2xl text-stone-900 mb-3">
            {COPY.autism.partBIntroTitle}
          </h2>

          <p className="text-stone-600 text-sm leading-relaxed mb-8">
            {COPY.autism.partBIntroDesc}
          </p>

          <Button onClick={() => setPart('B')} size="lg" className="px-8 gap-2 shadow-sm">
            <span>{COPY.autism.startPartBCta}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Card>
      </div>
    );
  }

  /* ---------- Part A: loading ---------- */
  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
        <p className="text-stone-600 text-sm">Preparing social scenarios...</p>
      </div>
    );
  }

  /* ---------- Part A: error ---------- */
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

  /* ---------- Part A: questions ---------- */
  const currentQ = questions[currentQIndex];
  const progressPercent =
    questions.length > 0 ? Math.round(((currentQIndex + 1) / questions.length) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-800">
              Stage 3 of 3 · Social Communication (Part A)
            </span>
          </div>
          <span className="text-xs font-semibold text-stone-600">
            {currentQIndex + 1} of {questions.length} scenarios
          </span>
        </div>
        <Progress value={progressPercent} color="indigo" className="h-2" />
      </div>

      {currentQ ? (
        <McqCard
          key={currentQ.id}
          question={currentQ}
          questionNumber={currentQIndex + 1}
          totalQuestions={questions.length}
          onAnswer={handleAnswerPartA}
          accentColor="indigo"
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

      {import.meta.env.DEV && (
        <button
          type="button"
          onClick={() => setPart('B_INTRO')}
          className="fixed bottom-4 right-4 z-40 rounded bg-red-600 px-3 py-1 text-xs text-white"
        >
          Dev: skip to Part B
        </button>
      )}
    </div>
  );
}