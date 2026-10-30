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

  const startWebcam = useCallback(async () => {
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

      setStream(mediaStream);
      setHasPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play().catch(() => {});
        setIsStreaming(true);
      }
    } catch (err: any) {
      console.warn('Webcam start failed:', err);
      setHasPermission(false);
      setError(
        err.name === 'NotAllowedError'
          ? 'Camera permission was denied. Please allow camera access in browser settings.'
          : err.message || 'Unable to access the camera.'
      );
      setIsStreaming(false);
    }
  }, [width, height]);

  const stopWebcam = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, [stream]);

  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    const canvas = hiddenCanvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      return null;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, width, height);
    // Grab JPEG base64 (removes "data:image/jpeg;base64," prefix for raw string if desired, or keep standard)
    return canvas.toDataURL('image/jpeg', quality);
  }, [width, height, quality]);

  useEffect(() => {
    if (autoStart) {
      startWebcam();
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [autoStart]);

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
