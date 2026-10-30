import {
  CreateSessionRequest,
  CreateSessionResponse,
  HealthResponse,
  QuestionsResponse,
  Report,
  SessionDetailResponse,
  SessionSummary,
  StageFinishResponse,
  StageId,
  StageStartResponse,
  SubmitAnswerRequest,
  SubmitAnswerResponse,
  BlockMarkerRequest,
  BlockMarkerResponse,
} from './types';
import { mockApi } from './mockApi';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

async function fetchWithTimeout<T>(
  endpoint: string,
  options: RequestInit = {},
  timeoutMs = 15000
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`API Error ${res.status} [${endpoint}]: ${errText || res.statusText}`);
    }

    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  async getHealth(): Promise<HealthResponse> {
    if (USE_MOCKS) return mockApi.getHealth();
    try {
      return await fetchWithTimeout<HealthResponse>('/api/health', { method: 'GET' }, 6000);
    } catch (err) {
      console.warn('Real /api/health failed, falling back to mock health status', err);
      return mockApi.getHealth();
    }
  },

  async createSession(payload: CreateSessionRequest): Promise<CreateSessionResponse> {
    if (USE_MOCKS) return mockApi.createSession(payload);
    try {
      return await fetchWithTimeout<CreateSessionResponse>('/api/sessions', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn('Backend unavailable, using mock createSession', err);
      return mockApi.createSession(payload);
    }
  },

  async getSession(id: string): Promise<SessionDetailResponse> {
    if (USE_MOCKS) return mockApi.getSession(id);
    try {
      return await fetchWithTimeout<SessionDetailResponse>(`/api/sessions/${id}`, {
        method: 'GET',
      });
    } catch (err) {
      console.warn('Backend unavailable, using mock getSession', err);
      return mockApi.getSession(id);
    }
  },

  async listSessions(): Promise<SessionSummary[]> {
    if (USE_MOCKS) return mockApi.listSessions();
    try {
      return await fetchWithTimeout<SessionSummary[]>('/api/sessions', { method: 'GET' });
    } catch (err) {
      console.warn('Backend unavailable, using mock listSessions', err);
      return mockApi.listSessions();
    }
  },

  async deleteSession(id: string): Promise<{ ok: boolean }> {
    if (USE_MOCKS) return mockApi.deleteSession(id);
    try {
      return await fetchWithTimeout<{ ok: boolean }>(`/api/sessions/${id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('Backend unavailable, using mock deleteSession', err);
      return mockApi.deleteSession(id);
    }
  },

  async deleteAllSessions(): Promise<{ ok: boolean }> {
    if (USE_MOCKS) return mockApi.deleteAllSessions();
    try {
      return await fetchWithTimeout<{ ok: boolean }>('/api/sessions', {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('Backend unavailable, using mock deleteAllSessions', err);
      return mockApi.deleteAllSessions();
    }
  },

  async startStage(id: string, stage: StageId): Promise<StageStartResponse> {
    if (USE_MOCKS) return mockApi.startStage(id, stage);
    try {
      return await fetchWithTimeout<StageStartResponse>(`/api/sessions/${id}/stages/${stage}/start`, {
        method: 'POST',
      });
    } catch (err) {
      console.warn('Backend unavailable, using mock startStage', err);
      return mockApi.startStage(id, stage);
    }
  },

  async finishStage(id: string, stage: StageId): Promise<StageFinishResponse> {
    if (USE_MOCKS) return mockApi.finishStage(id, stage);
    try {
      return await fetchWithTimeout<StageFinishResponse>(`/api/sessions/${id}/stages/${stage}/finish`, {
        method: 'POST',
      });
    } catch (err) {
      console.warn('Backend unavailable, using mock finishStage', err);
      return mockApi.finishStage(id, stage);
    }
  },

  async getQuestions(stage: StageId, age?: number): Promise<QuestionsResponse> {
    if (USE_MOCKS) return mockApi.getQuestions(stage, age);
    try {
      const q = age !== undefined ? `?age=${age}` : '';
      return await fetchWithTimeout<QuestionsResponse>(`/api/questions/${stage}${q}`, {
        method: 'GET',
      });
    } catch (err) {
      console.warn('Backend unavailable, using mock getQuestions', err);
      return mockApi.getQuestions(stage, age);
    }
  },

  async submitAnswer(id: string, body: SubmitAnswerRequest): Promise<SubmitAnswerResponse> {
    if (USE_MOCKS) return mockApi.submitAnswer(id, body);
    try {
      return await fetchWithTimeout<SubmitAnswerResponse>(`/api/sessions/${id}/answers`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
    } catch (err) {
      console.warn('Backend unavailable, using mock submitAnswer', err);
      return mockApi.submitAnswer(id, body);
    }
  },

  async sendBlockMarker(id: string, body: BlockMarkerRequest): Promise<BlockMarkerResponse> {
    if (USE_MOCKS) return mockApi.sendBlockMarker(id, body);
    try {
      return await fetchWithTimeout<BlockMarkerResponse>(`/api/sessions/${id}/block-marker`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
    } catch (err) {
      console.warn('Backend unavailable, using mock sendBlockMarker', err);
      return mockApi.sendBlockMarker(id, body);
    }
  },

  /**
   * Generates final report with a 150-second timeout to accommodate local AI models (Gemma 4)
   */
  async generateReport(id: string): Promise<Report> {
    if (USE_MOCKS) return mockApi.generateReport(id);
    try {
      return await fetchWithTimeout<Report>(
        `/api/sessions/${id}/report`,
        { method: 'POST' },
        150000 // 150 seconds timeout as specified in contract
      );
    } catch (err) {
      console.warn('Backend report generation unavailable, falling back to mock report', err);
      return mockApi.generateReport(id);
    }
  },

  async getReport(id: string): Promise<Report> {
    if (USE_MOCKS) return mockApi.getReport(id);
    try {
      return await fetchWithTimeout<Report>(`/api/sessions/${id}/report`, { method: 'GET' });
    } catch (err) {
      console.warn('Backend getReport unavailable, falling back to mock getReport', err);
      return mockApi.getReport(id);
    }
  },
};
