import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useSessionStore } from '../store/sessionStore';
import { api } from '../lib/api';
import { COPY } from '../lib/copy';
import { Report } from '../lib/types';
import { Sparkles, Clock, AlertCircle, RefreshCw, Lock, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Processing() {
  const navigate = useNavigate();
  const { sessionId } = useSessionStore();

  const [elapsed, setElapsed] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);

  const messages = COPY.processing.rotatingMessages;
  const isMountedRef = useRef(true);

  // Timer loop for elapsed seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Rotate friendly messages every 5 seconds
  useEffect(() => {
    const msgTimer = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 5000);
    return () => clearInterval(msgTimer);
  }, [messages.length]);

  const runGeneration = async () => {
    setIsGenerating(true);
    setError(null);
    setElapsed(0);

    const targetId = sessionId || 'demo_session';
    try {
      const report: Report = await api.generateReport(targetId);
      if (isMountedRef.current) {
        navigate('/report', { state: { report } });
      }
    } catch (err: any) {
      console.warn('Report generation encountered an error or timeout:', err);
      if (isMountedRef.current) {
        setError(COPY.processing.errorDesc);
        setIsGenerating(false);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    runGeneration();
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-6 py-16 text-center">
      <Card className="p-8 sm:p-12 relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        {!error ? (
          <div className="flex flex-col items-center">
            {/* Animated Processing Icon */}
            <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
              <div className="absolute inset-0 rounded-3xl bg-amber-100 animate-ping opacity-30" />
              <div className="w-20 h-20 rounded-3xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-700 shadow-sm">
                <Sparkles className="w-10 h-10 animate-pulse text-amber-600" />
              </div>
            </div>

            <h1 className="font-heading font-bold text-2xl sm:text-3xl text-stone-900 mb-2">
              {COPY.processing.title}
            </h1>
            <p className="text-stone-600 text-sm max-w-md mx-auto mb-8 leading-relaxed">
              {COPY.processing.subtitle}
            </p>

            {/* Rotating Friendly Messages */}
            <div className="h-16 flex items-center justify-center w-full max-w-md mb-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={messageIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="text-stone-800 text-sm font-medium px-4 py-2 rounded-xl bg-stone-100/80 border border-stone-200"
                >
                  {messages[messageIndex]}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Elapsed Time Counter */}
            <div className="inline-flex items-center gap-2 text-xs font-mono text-stone-500 mb-8 bg-stone-50 px-3.5 py-1.5 rounded-full border border-stone-200">
              <Clock className="w-3.5 h-3.5" />
              <span>Elapsed time: {elapsed}s</span>
              <span className="text-stone-300">|</span>
              <span>timeout: 150s</span>
            </div>

            {/* Mandatory Local Privacy Note */}
            <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200/80 text-emerald-950 text-xs flex items-center justify-center gap-2 max-w-lg mx-auto">
              <Lock className="w-4 h-4 text-emerald-700 shrink-0" />
              <span className="font-medium">{COPY.processing.localNote}</span>
            </div>
          </div>
        ) : (
          /* Timeout / Error Fallback UI */
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>

            <h2 className="font-heading font-bold text-2xl text-stone-900 mb-2">
              {COPY.processing.errorTitle}
            </h2>
            <p className="text-stone-600 text-sm max-w-md mx-auto mb-8 leading-relaxed">
              {error}
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
              <Button onClick={runGeneration} size="lg" className="w-full sm:w-auto gap-2">
                <RefreshCw className="w-4 h-4" />
                <span>{COPY.processing.retryCta}</span>
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={async () => {
                  const fallbackReport = await api.getReport(sessionId || 'demo');
                  navigate('/report', { state: { report: fallbackReport } });
                }}
                className="w-full sm:w-auto"
              >
                <span>{COPY.processing.fallbackCta}</span>
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
