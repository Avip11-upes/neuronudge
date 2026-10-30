import { useSessionStore } from '../store/sessionStore';
import { api } from '../lib/api';
import { StageId, StageStatus } from '../lib/types';
import { useCallback, useState } from 'react';

export function useSession() {
  const store = useSessionStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startStage = useCallback(
    async (stage: StageId) => {
      if (!store.sessionId) return;
      setIsLoading(true);
      setError(null);
      try {
        await api.startStage(store.sessionId, stage);
        store.updateStageStatus(stage, 'running');
      } catch (err: any) {
        console.warn(`Failed to mark stage ${stage} as started`, err);
        store.updateStageStatus(stage, 'running');
      } finally {
        setIsLoading(false);
      }
    },
    [store]
  );

  const finishStage = useCallback(
    async (stage: StageId) => {
      if (!store.sessionId) return;
      setIsLoading(true);
      setError(null);
      try {
        await api.finishStage(store.sessionId, stage);
        store.updateStageStatus(stage, 'done');
      } catch (err: any) {
        console.warn(`Failed to mark stage ${stage} as finished`, err);
        store.updateStageStatus(stage, 'done');
      } finally {
        setIsLoading(false);
      }
    },
    [store]
  );

  return {
    ...store,
    isLoading,
    error,
    startStage,
    finishStage,
  };
}
