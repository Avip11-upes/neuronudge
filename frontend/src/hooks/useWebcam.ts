import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseWebcamOptions {
  width?: number;
  height?: number;
  quality?: number;
  autoStart?: boolean;
}

export function useWebcam({
  width = 320,
  height = 240,
  quality = 0.6,
  autoStart = false,
}: UseWebcamOptions = {}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // The live stream is kept in a ref so cleanup always sees the current one.
  const streamRef = useRef<MediaStream | null>(null);
  // Incremented on every start/stop/unmount. A start request whose id is stale
  // (the page was left, or a newer start began) releases its stream immediately.
  const startIdRef = useRef(0);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize hidden canvas
  useEffect(() => {
    if (!hiddenCanvasRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      hiddenCanvasRef.current = canvas;
    }
  }, [width, height]);

  // Stop every track of the current stream and detach it from the <video>
  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startWebcam = useCallback(async () => {
    const myId = ++startIdRef.current;
    releaseStream(); // never leave an older stream running
    setError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: width },
          height: { ideal: height },
          facingMode: 'user',
        },
        audio: false,
      });

      // The page was left (or another start began) while the permission
      // prompt was open: release the camera right away.
      if (myId !== startIdRef.current) {
        mediaStream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = mediaStream;
      setStream(mediaStream);
      setHasPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play().catch(() => {});
        if (myId === startIdRef.current) {
          setIsStreaming(true);
        }
      }
    } catch (err: any) {
      if (myId !== startIdRef.current) return; // stale request, ignore
      console.warn('Webcam start failed:', err);
      setHasPermission(false);
      setError(
        err?.name === 'NotAllowedError'
          ? 'Camera permission was denied. Please allow camera access in browser settings.'
          : err?.message || 'Unable to access the camera.'
      );
      setIsStreaming(false);
    }
  }, [width, height, releaseStream]);

  const stopWebcam = useCallback(() => {
    startIdRef.current += 1; // cancels any start that is still waiting
    releaseStream();
    setStream(null);
    setIsStreaming(false);
  }, [releaseStream]);

  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    const canvas = hiddenCanvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      return null;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', quality);
  }, [width, height, quality]);

  // Start when asked to, and ALWAYS release the camera on unmount
  useEffect(() => {
    if (autoStart) {
      startWebcam();
    }
    return () => {
      startIdRef.current += 1;
      releaseStream();
    };
  }, [autoStart, startWebcam, releaseStream]);

  return {
    videoRef,
    stream,
    isStreaming,
    hasPermission,
    error,
    startWebcam,
    stopWebcam,
    captureFrame,
  };
}