import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { StageId, StageStatus } from '../lib/types';

export interface UserProfile {
  nickname: string;
  age: number;
  language: 'en' | 'hi';
  taker: 'child' | 'adult';
}

interface SessionContextType {
  sessionId: string | null;
  profile: UserProfile | null;
  stages: Record<StageId, StageStatus>;
  setSession: (id: string, profile: UserProfile) => void;
  updateStageStatus: (stage: StageId, status: StageStatus) => void;
  clearSession: () => void;
  isAllStagesDone: boolean;
}

const SESSION_STORAGE_ID_KEY = 'neuronudge_active_session_id';
const SESSION_STORAGE_PROFILE_KEY = 'neuronudge_active_profile';
const SESSION_STORAGE_STAGES_KEY = 'neuronudge_active_stages';

const initialStages: Record<StageId, StageStatus> = {
  adhd: 'pending',
  dyslexia: 'pending',
  autism: 'pending',
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sessionId, setSessionIdState] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(SESSION_STORAGE_ID_KEY);
    } catch {
      return null;
    }
  });

  const [profile, setProfileState] = useState<UserProfile | null>(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_STORAGE_PROFILE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [stages, setStages] = useState<Record<StageId, StageStatus>>(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_STORAGE_STAGES_KEY);
      return raw ? JSON.parse(raw) : initialStages;
    } catch {
      return initialStages;
    }
  });

  const setSession = (id: string, newProfile: UserProfile) => {
    setSessionIdState(id);
    setProfileState(newProfile);
    try {
      sessionStorage.setItem(SESSION_STORAGE_ID_KEY, id);
      sessionStorage.setItem(SESSION_STORAGE_PROFILE_KEY, JSON.stringify(newProfile));
    } catch (err) {
      console.warn('sessionStorage error', err);
    }
  };

  const updateStageStatus = (stage: StageId, status: StageStatus) => {
    setStages((prev) => {
      const updated = { ...prev, [stage]: status };
      try {
        sessionStorage.setItem(SESSION_STORAGE_STAGES_KEY, JSON.stringify(updated));
      } catch (err) {
        console.warn('sessionStorage error', err);
      }
      return updated;
    });
  };

  const clearSession = () => {
    setSessionIdState(null);
    setProfileState(null);
    setStages(initialStages);
    try {
      sessionStorage.removeItem(SESSION_STORAGE_ID_KEY);
      sessionStorage.removeItem(SESSION_STORAGE_PROFILE_KEY);
      sessionStorage.removeItem(SESSION_STORAGE_STAGES_KEY);
    } catch (err) {
      console.warn('sessionStorage clear error', err);
    }
  };

  const isAllStagesDone =
    stages.adhd === 'done' && stages.dyslexia === 'done' && stages.autism === 'done';

  return (
    <SessionContext.Provider
      value={{
        sessionId,
        profile,
        stages,
        setSession,
        updateStageStatus,
        clearSession,
        isAllStagesDone,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSessionStore() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSessionStore must be used within a SessionProvider');
  }
  return context;
}
