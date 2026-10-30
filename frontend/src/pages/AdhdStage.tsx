import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { StimulusPlayer } from '../components/stimuli/StimulusPlayer';
import { FaceStatusBadge } from '../components/camera/FaceStatusBadge';
import { PauseOverlay } from '../components/camera/PauseOverlay';
import { useWebcam } from '../hooks/useWebcam';
import { useFrameStream } from '../hooks/useFrameStream';
import { useSessionStore } from '../store/sessionStore';
import { api } from '../lib/api';
import { COPY } from '../lib/copy';
import { Pause, Play, Video, ArrowRight } from 'lucide-react';

export default function AdhdStage() {
  const navigate = useNavigate();
  const { sessionId, stages, updateStageStatus } = useSessionStore();

  const blocks = COPY.adhd.blocks;
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const activeBlock = blocks[currentBlockIndex] || blocks[0];
  const isLastBlock = currentBlockIndex + 1 >= blocks.length;

  const [timeLeft, setTimeLeft] = useState(activeBlock.duration);
  const [isPaused, setIsPaused] = useState(false);

  const startedRef = useRef(false); // stage start runs only once
  const finishedRef = useRef(false); // stage finish runs only once

  const { videoRef, isStreaming, captureFrame } = useWebcam({ autoStart: true });

  const {
    faceFound,
    lighting,
    gazeOnScreen,
    showFaceLostWarning,
    dismissFaceLostWarning,
  } = useFrameStream({
    sessionId: sessionId || 'adhd_stage_session',
    stage: 'adhd',
    activeBlock: activeBlock.id,
    isStreaming,
    captureFrame,
    enabled: isStreaming && !isPaused,
  });

  // Start stage on backend (once). Don't flip an already-finished stage back to "running".
  useEffect(() => {
    if (!sessionId || startedRef.current) return;
    startedRef.current = true;

    api.startStage(sessionId, 'adhd').catch((err) => {
      console.warn('Could not start adhd stage on backend', err);
    });
    if (stages.adhd !== 'done') {
      updateStageStatus('adhd', 'running');
    }
  }, [sessionId, stages, updateStageStatus]);

  // Tell the backend which block is on screen
  useEffect(() => {
    if (sessionId) {
      api
        .sendBlockMarker(sessionId, {
          stage: 'adhd',
          block: activeBlock.id,
          event: 'start',
          t: Date.now(),
        })
        .catch(() => {});
    }
  }, [activeBlock.id, sessionId]);

  // Finish the stage: update the UI first, tell the backend in the background
  const finishStage = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (sessionId) {
      api.finishStage(sessionId, 'adhd').catch(() => {});
    }
    updateStageStatus('adhd', 'done');
    navigate('/hub');
  }, [sessionId, updateStageStatus, navigate]);

  // Move to the next block (or finish after the last one)
  const advanceBlock = useCallback(() => {
    if (finishedRef.current) return;

    if (sessionId) {
      api
        .sendBlockMarker(sessionId, {
          stage: 'adhd',
          block: activeBlock.id,
          event: 'end',
          t: Date.now(),
        })
        .catch(() => {});
    }

    if (currentBlockIndex + 1 < blocks.length) {
      setCurrentBlockIndex(currentBlockIndex + 1);
      setTimeLeft(blocks[currentBlockIndex + 1].duration);
    } else {
      finishStage();
    }
  }, [sessionId, activeBlock.id, currentBlockIndex, blocks, finishStage]);

  // Always call the latest advanceBlock from effects
  const advanceRef = useRef(advanceBlock);
  useEffect(() => {
    advanceRef.current = advanceBlock;
  });

  // Countdown: only decrements, no side effects inside the updater
  useEffect(() => {
    if (isPaused || showFaceLostWarning) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isPaused, showFaceLostWarning]);

  // When the countdown reaches 0, advance once
  useEffect(() => {
    if (timeLeft === 0) advanceRef.current();
  }, [timeLeft]);

  // Star task reaction recorded
  const handleStarReaction = (reactionMs: number) => {
    if (sessionId) {
      api
        .submitAnswer(sessionId, {
          stage: 'adhd',
          question_id: `star_${Date.now()}`,
          option_id: 'star_press',
          response_ms: reactionMs,
          answer_changes: 0,
        })
        .catch(() => {});
    }
  };

  const handleResume = () => {
    dismissFaceLostWarning();
    setIsPaused(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <PauseOverlay
        isOpen={isPaused || showFaceLostWarning}
        isFaceLost={showFaceLostWarning}
        onResume={handleResume}
      />

      {/* Header & status bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
              Stage 1 of 3 · Attention & Focus
            </span>
          </div>
          <h1 className="font-heading font-bold text-2xl sm:text-3xl text-stone-900">
            {activeBlock.title}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-stone-900 text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-xs">
            <Video className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px]">Camera on</span>
            <span className="text-stone-400 border-l border-stone-700 pl-2">
              Block {currentBlockIndex + 1}/{blocks.length}
            </span>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsPaused((prev) => !prev)}
            className="rounded-full px-3"
            aria-label={isPaused ? 'Resume assessment' : 'Pause assessment'}
          >
            {isPaused ? <Play className="w-4 h-4 mr-1" /> : <Pause className="w-4 h-4 mr-1" />}
            <span>{isPaused ? 'Resume' : 'Pause'}</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={finishStage}
            className="text-stone-500 hover:text-stone-700 text-xs px-2"
          >
            Finish Stage
          </Button>
        </div>
      </div>

      {/* Hidden live video element for webcam capture */}
      <video
        ref={videoRef}
        playsInline
        autoPlay
        muted
        className="sr-only pointer-events-none"
        aria-hidden="true"
      />

      <div className="mb-6 relative">
        <StimulusPlayer
          blockId={activeBlock.id}
          onStarReaction={handleStarReaction}
          isPaused={isPaused || showFaceLostWarning}
        />
      </div>

      {/* Bottom status & progress strip */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <FaceStatusBadge
            faceFound={faceFound}
            lighting={lighting}
            gazeOnScreen={gazeOnScreen}
            compact={true}
          />
        </div>

        <div className="flex items-center gap-4 text-xs text-stone-500 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-2">
            <span>Block timer:</span>
            <span className="font-mono font-semibold text-stone-800 text-sm">{timeLeft}s</span>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={advanceBlock}
            className="text-stone-700 hover:text-stone-900 gap-1"
          >
            <span>{isLastBlock ? 'Finish' : 'Next Block'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}