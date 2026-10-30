import React, { useState, useEffect, useRef } from 'react';
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
import { Sparkles, ArrowRight, Video, Pause, Play, Users } from 'lucide-react';

export default function AutismStage() {
  const navigate = useNavigate();
  const { sessionId, profile, updateStageStatus } = useSessionStore();

  const [part, setPart] = useState<'A' | 'B_INTRO' | 'B_TALKING' | 'B_WAITING'>('A');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Part B Timers (60s talking, 60s waiting)
  const [bTimeLeft, setBTimeLeft] = useState(60);
  const [isPaused, setIsPaused] = useState(false);

  // Active block for WebSocket markers
  const activeBlock =
    part === 'B_TALKING'
      ? 'autism_social_face'
      : part === 'B_WAITING'
      ? 'autism_neutral_wait'
      : 'autism_questions';

  const { videoRef, isStreaming, captureFrame } = useWebcam({
    autoStart: part === 'B_TALKING' || part === 'B_WAITING',
  });

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
    enabled: isStreaming && !isPaused && (part === 'B_TALKING' || part === 'B_WAITING'),
  });

  // Load Part A questions
  useEffect(() => {
    let isDisposed = false;
    async function load() {
      setIsLoading(true);
      try {
        if (sessionId) {
          await api.startStage(sessionId, 'autism').catch(() => {});
          updateStageStatus('autism', 'running');
        }

        const res = await api.getQuestions('autism', profile?.age);
        if (!isDisposed) {
          setQuestions(res.questions);
        }
      } catch (err) {
        console.warn('Failed loading autism questions', err);
      } finally {
        if (!isDisposed) setIsLoading(false);
      }
    }
    load();
    return () => {
      isDisposed = true;
    };
  }, [sessionId, profile?.age, updateStageStatus]);

  // Handle Part A MCQ answer
  const handleAnswerPartA = async (
    optionId: string,
    responseMs: number,
    answerChanges: number
  ) => {
    const currentQ = questions[currentQIndex];
    if (!currentQ) return;

    if (sessionId) {
      await api.submitAnswer(sessionId, {
        stage: 'autism',
        question_id: currentQ.id,
        option_id: optionId,
        response_ms: responseMs,
        answer_changes: answerChanges,
      }).catch(() => {});
    }

    if (currentQIndex + 1 < questions.length) {
      setCurrentQIndex((prev) => prev + 1);
    } else {
      // Part A complete, transition to Part B intro
      setPart('B_INTRO');
    }
  };

  // Start Part B
  const startPartB = async () => {
    setPart('B_TALKING');
    setBTimeLeft(60);
    if (sessionId) {
      await api.sendBlockMarker(sessionId, {
        stage: 'autism',
        block: 'autism_social_face',
        event: 'start',
        t: Date.now(),
      }).catch(() => {});
    }
  };

  // Part B Timer logic
  useEffect(() => {
    if (part !== 'B_TALKING' && part !== 'B_WAITING') return;
    if (isPaused || showFaceLostWarning) return;

    const timer = setInterval(() => {
      setBTimeLeft((prev) => {
        if (prev <= 1) {
          if (part === 'B_TALKING') {
            // End talking block, start waiting block
            if (sessionId) {
              api.sendBlockMarker(sessionId, {
                stage: 'autism',
                block: 'autism_social_face',
                event: 'end',
                t: Date.now(),
              }).catch(() => {});
              api.sendBlockMarker(sessionId, {
                stage: 'autism',
                block: 'autism_neutral_wait',
                event: 'start',
                t: Date.now(),
              }).catch(() => {});
            }
            setPart('B_WAITING');
            return 60;
          } else if (part === 'B_WAITING') {
            // Part B complete!
            if (sessionId) {
              api.sendBlockMarker(sessionId, {
                stage: 'autism',
                block: 'autism_neutral_wait',
                event: 'end',
                t: Date.now(),
              }).catch(() => {});
              api.finishStage(sessionId, 'autism').catch(() => {});
            }
            updateStageStatus('autism', 'done');
            navigate('/hub');
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [part, isPaused, showFaceLostWarning, sessionId, updateStageStatus, navigate]);

  const handleFinishEarly = async () => {
    if (sessionId) {
      await api.finishStage(sessionId, 'autism').catch(() => {});
    }
    updateStageStatus('autism', 'done');
    navigate('/hub');
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <PauseOverlay
        isOpen={isPaused || showFaceLostWarning}
        isFaceLost={showFaceLostWarning}
        onResume={() => {
          dismissFaceLostWarning();
          setIsPaused(false);
        }}
      />

      {/* Hidden Live Video element for WebCam feed capture during Part B */}
      <video
        ref={videoRef}
        playsInline
        autoPlay
        muted
        className="sr-only pointer-events-none"
        aria-hidden="true"
      />

      {/* PART A: Social Questions */}
      {part === 'A' && (
        <div>
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
            <Progress
              value={Math.round(((currentQIndex + 1) / questions.length) * 100)}
              color="indigo"
              className="h-2"
            />
          </div>

          {questions[currentQIndex] && (
            <McqCard
              question={questions[currentQIndex]}
              questionNumber={currentQIndex + 1}
              totalQuestions={questions.length}
              onAnswer={handleAnswerPartA}
              accentColor="indigo"
              language={profile?.language || 'en'}
            />
          )}
        </div>
      )}

      {/* PART B INTRO */}
      {part === 'B_INTRO' && (
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

          <Button onClick={startPartB} size="lg" className="px-8 gap-2 shadow-sm">
            <span>{COPY.autism.startPartBCta}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Card>
      )}

      {/* PART B: Animated Face Segment (60s talking + 60s waiting) */}
      {(part === 'B_TALKING' || part === 'B_WAITING') && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-800">
                Stage 3 · Part B ({part === 'B_TALKING' ? 'Story Listening' : 'Quiet Pause'})
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
                onClick={handleFinishEarly}
                className="text-stone-500 hover:text-stone-700 text-xs px-2"
              >
                Finish Stage
              </Button>
            </div>
          </div>

          <AnimatedFace
            phase={part === 'B_TALKING' ? 'talking' : 'waiting'}
            timeLeft={bTimeLeft}
            isPaused={isPaused}
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
              <span className="font-mono font-semibold text-stone-900 text-sm">
                {bTimeLeft}s
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
