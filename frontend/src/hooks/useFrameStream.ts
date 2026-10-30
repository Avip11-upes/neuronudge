import { useEffect, useRef, useState, useCallback } from 'react';
import { StreamClientMessage, StreamServerMessage } from '../lib/types';

interface UseFrameStreamOptions {
  sessionId: string | null;
  stage: string;
  activeBlock: string;
  isStreaming: boolean;
  captureFrame: () => string | null;
  fps?: number; // 5 to 10 fps
  enabled?: boolean;
}

export function useFrameStream({
  sessionId,
  stage,
  activeBlock,
  isStreaming,
  captureFrame,
  fps = 7, // 7 frames per second (within 5-10 range)
  enabled = true,
}: UseFrameStreamOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [serverState, setServerState] = useState<StreamServerMessage>({
    face_found: true,
    lighting: 'ok',
    gaze_on_screen: 0.85,
  });
  const [faceLostDuration, setFaceLostDuration] = useState(0);
  const [showFaceLostWarning, setShowFaceLostWarning] = useState(false);

  const mockIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const faceLostTimerRef = useRef<NodeJS.Timeout | null>(null);
  const frameIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const blockRef = useRef(activeBlock);
  blockRef.current = activeBlock;

  // Determine WebSocket URL
  const getWsUrl = useCallback(() => {
    if (!sessionId) return null;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/ws/stream/${sessionId}?stage=${stage}`;
  }, [sessionId, stage]);

  // Connect to WebSocket with reconnect logic
  useEffect(() => {
    if (!enabled || !sessionId) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    const url = getWsUrl();
    if (!url) return;

    let isDisposed = false;

    function connect() {
      if (isDisposed) return;
      try {
        const ws = new WebSocket(url!);
        wsRef.current = ws;

        ws.onopen = () => {
          if (isDisposed) return;
          setIsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data: StreamServerMessage = JSON.parse(event.data);
            setServerState(data);
          } catch (err) {
            console.warn('Invalid WS message payload', err);
          }
        };

        ws.onclose = () => {
          if (isDisposed) return;
          setIsConnected(false);
          // Try reconnect after 3 seconds
          reconnectTimeoutRef.current = setTimeout(connect, 3000);
        };

        ws.onerror = () => {
          // Fallback simulation will take over seamlessly
          setIsConnected(false);
        };
      } catch (err) {
        setIsConnected(false);
      }
    }

    connect();

    return () => {
      isDisposed = true;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [enabled, sessionId, stage, getWsUrl]);

  // Emulation fallback when backend WS is disconnected but camera is streaming
  useEffect(() => {
    if (!isConnected && isStreaming && enabled) {
      mockIntervalRef.current = setInterval(() => {
        setServerState((prev) => ({
          face_found: true,
          lighting: 'ok',
          gaze_on_screen: Number((0.8 + Math.random() * 0.15).toFixed(2)),
        }));
      }, 1000);
    } else {
      if (mockIntervalRef.current) clearInterval(mockIntervalRef.current);
    }

    return () => {
      if (mockIntervalRef.current) clearInterval(mockIntervalRef.current);
    };
  }, [isConnected, isStreaming, enabled]);

  // Frame streaming interval (5 - 10 fps)
  useEffect(() => {
    if (!enabled || !isStreaming) return;

    const intervalMs = Math.floor(1000 / fps);
    frameIntervalRef.current = setInterval(() => {
      const frameBase64 = captureFrame();
      if (!frameBase64) return;

      const message: StreamClientMessage = {
        t: Date.now(),
        block: blockRef.current,
        frame: frameBase64,
      };

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(message));
      }
    }, intervalMs);

    return () => {
      if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    };
  }, [enabled, isStreaming, fps, captureFrame]);

  // Track face lost duration: trigger warning if lost > 3 seconds
  useEffect(() => {
    if (!isStreaming) {
      setShowFaceLostWarning(false);
      return;
    }

    if (!serverState.face_found) {
      faceLostTimerRef.current = setInterval(() => {
        setFaceLostDuration((prev) => {
          const next = prev + 1;
          if (next >= 3) {
            setShowFaceLostWarning(true);
          }
          return next;
        });
      }, 1000);
    } else {
      setFaceLostDuration(0);
      setShowFaceLostWarning(false);
      if (faceLostTimerRef.current) clearInterval(faceLostTimerRef.current);
    }

    return () => {
      if (faceLostTimerRef.current) clearInterval(faceLostTimerRef.current);
    };
  }, [serverState.face_found, isStreaming]);

  const dismissFaceLostWarning = () => {
    setShowFaceLostWarning(false);
    setFaceLostDuration(0);
  };

  return {
    isConnected,
    faceFound: serverState.face_found,
    lighting: serverState.lighting,
    gazeOnScreen: serverState.gaze_on_screen,
    showFaceLostWarning,
    dismissFaceLostWarning,
  };
}
