import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { WebcamPreview } from '../components/camera/WebcamPreview';
import { FaceStatusBadge } from '../components/camera/FaceStatusBadge';
import { CalibrationDots } from '../components/camera/CalibrationDots';
import { useWebcam } from '../hooks/useWebcam';
import { useFrameStream } from '../hooks/useFrameStream';
import { useSessionStore } from '../store/sessionStore';
import { COPY } from '../lib/copy';
import { Camera, Sun, Crosshair, CheckCircle2, ArrowRight } from 'lucide-react';

export default function CameraCheck() {
  const navigate = useNavigate();
  const { sessionId } = useSessionStore();

  const [activeBlock, setActiveBlock] = useState('calibration_check');
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationDone, setCalibrationDone] = useState(false);

  const {
    videoRef,
    isStreaming,
    hasPermission,
    error,
    startWebcam,
    captureFrame,
  } = useWebcam({ autoStart: true });

  const { faceFound, lighting, gazeOnScreen } = useFrameStream({
    sessionId: sessionId || 'check_session',
    stage: 'adhd',
    activeBlock,
    isStreaming,
    captureFrame,
    enabled: isStreaming,
  });

  const handleStartCalibration = () => {
    setIsCalibrating(true);
    setCalibrationDone(false);
  };

  const handleDotChange = (blockId: string) => {
    setActiveBlock(blockId);
  };

  const handleCalibrationComplete = () => {
    setIsCalibrating(false);
    setCalibrationDone(true);
    setActiveBlock('calibration_done');
  };

  const handleProceedToHub = () => {
    navigate('/hub');
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      {/* 5-Dot Gaze Calibration Overlay */}
      <CalibrationDots
        isCalibrating={isCalibrating}
        onDotChange={handleDotChange}
        onComplete={handleCalibrationComplete}
      />

      <div className="text-center mb-8 max-w-xl mx-auto">
        <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2 block">
          Step 3 of 3 · Camera & Gaze Calibration
        </span>
        <h1 className="font-heading font-bold text-3xl sm:text-4xl text-stone-900 mb-2">
          {COPY.cameraCheck.title}
        </h1>
        <p className="text-stone-600 text-sm leading-relaxed">
          {COPY.cameraCheck.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column: Live Webcam Preview */}
        <div className="md:col-span-7 space-y-4">
          <Card className="p-4 bg-stone-950 border-stone-800">
            <WebcamPreview
              videoRef={videoRef}
              isStreaming={isStreaming}
              hasPermission={hasPermission}
              error={error}
              onRetry={startWebcam}
            />

            <div className="mt-4 flex items-center justify-between">
              <FaceStatusBadge
                faceFound={faceFound}
                lighting={lighting}
                gazeOnScreen={gazeOnScreen}
                compact={false}
              />
            </div>
          </Card>

          {/* Lighting Tip Card */}
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3">
            <Sun className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-900/90 leading-relaxed">
              {COPY.cameraCheck.lightingTip}
            </p>
          </div>
        </div>

        {/* Right Column: Calibration Action & Status */}
        <div className="md:col-span-5 space-y-4">
          <Card className="p-6">
            <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-800 mb-4">
              <Crosshair className="w-5 h-5" />
            </div>

            <h3 className="font-heading font-bold text-lg text-stone-900 mb-2">
              {calibrationDone
                ? COPY.cameraCheck.completedTitle
                : COPY.cameraCheck.calibratingTitle}
            </h3>

            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mb-6">
              {calibrationDone
                ? COPY.cameraCheck.completedHelp
                : COPY.cameraCheck.calibratingHelp}
            </p>

            {calibrationDone ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>5-point gaze baseline recorded</span>
                </div>

                <Button
                  onClick={handleProceedToHub}
                  size="lg"
                  className="w-full gap-2 shadow-sm"
                >
                  <span>{COPY.cameraCheck.continueCta}</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStartCalibration}
                  className="w-full"
                >
                  {COPY.cameraCheck.retryCalibration}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Button
                  onClick={handleStartCalibration}
                  disabled={isCalibrating}
                  size="lg"
                  className="w-full gap-2 shadow-sm"
                >
                  <Crosshair className="w-4 h-4" />
                  <span>{COPY.cameraCheck.startCalibrationCta}</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleProceedToHub}
                  className="w-full text-stone-500 hover:text-stone-700"
                >
                  Skip calibration & proceed
                </Button>
              </div>
            )}
          </Card>

          <p className="text-[11px] text-stone-400 text-center leading-relaxed px-2">
            {COPY.cameraCheck.skipNotice}
          </p>
        </div>
      </div>
    </div>
  );
}
