/**
 * Shared API Contract Types for NeuroNudge Frontend
 */

export type StageId = 'adhd' | 'dyslexia' | 'autism';
export type StageStatus = 'pending' | 'running' | 'done';

export interface HealthResponse {
  status: 'ok';
  llm: {
    provider: 'ollama' | 'gemini' | 'template';
    model: string;
    ready: boolean;
  };
}

export interface CreateSessionRequest {
  nickname: string;
  age: number;
  language: 'en' | 'hi';
  taker: 'child' | 'adult';
  consent: true;
}

export interface CreateSessionResponse {
  session_id: string;
  created_at: string;
}

export interface SessionDetailResponse {
  session_id: string;
  nickname: string;
  age: number;
  stages: Record<StageId, StageStatus>;
}

export interface SessionSummary {
  session_id: string;
  nickname: string;
  created_at: string;
  has_report: boolean;
}

export interface StageStartResponse {
  ok: boolean;
  started_at: string;
}

export interface StageFinishResponse {
  ok: boolean;
  summary: Record<string, unknown>;
}

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  category: string;
  prompt: string;
  image_url: string | null;
  audio_text: string | null;
  options: QuestionOption[];
}

export interface QuestionsResponse {
  questions: Question[];
}

export interface SubmitAnswerRequest {
  stage: string;
  question_id: string;
  option_id: string;
  response_ms: number;
  answer_changes: number;
}

export interface SubmitAnswerResponse {
  ok: boolean;
}

export interface BlockMarkerRequest {
  stage: string;
  block: string;
  event: 'start' | 'end';
  t: number;
}

export interface BlockMarkerResponse {
  ok: boolean;
}

export interface ReportIndicator {
  condition: 'adhd' | 'dyslexia' | 'autism';
  level: 'low' | 'moderate' | 'high';
  score: number;
  observed_symptoms: string[];
  evidence: string[];
}

export interface Report {
  summary: string;
  indicators: ReportIndicator[];
  most_likely: 'adhd' | 'dyslexia' | 'autism' | 'none';
  least_likely: 'adhd' | 'dyslexia' | 'autism';
  recommendations: string[];
  confidence_note: string;
  disclaimer: string;
  generated_by: 'gemma-4' | 'gemini' | 'fallback';
}

export interface StreamServerMessage {
  face_found: boolean;
  lighting: 'ok' | 'low' | 'high';
  gaze_on_screen: number; // 0 to 1
}

export interface StreamClientMessage {
  t: number;
  block: string;
  frame: string; // base64 jpeg, 320x240
}
