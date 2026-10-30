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
  const { sessionId, updateStageStatus } = useSessionStore();

  const blocks = COPY.adhd.blocks;
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const activeBlock = blocks[currentBlockIndex] || blocks[0];
  const isLastBlock = currentBlockIndex + 1 >= blocks.length;

  const [timeLeft, setTimeLeft] = useState(activeBlock.duration);
  const [isPaused, setIsPaused] = useState(false);
  const finishedRef = useRef(false); // guards against finishing twice

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

  // Start stage on backend
  useEffect(() => {
    if (sessionId) {
      api.startStage(sessionId, 'adhd').catch((err) => {
        console.warn('Could not start adhd stage on backend', err);
      });
      updateStageStatus('adhd', 'running');
    }
  }, [sessionId, updateStageStatus]);

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

  // Always call the latest advanceBlock