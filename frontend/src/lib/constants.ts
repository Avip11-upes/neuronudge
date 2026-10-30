import { StageId } from './types';

export const APP_NAME = 'NeuroNudge';

export interface StageMeta {
  id: StageId;
  name: string;
  subtitle: string;
  estimatedMinutes: number;
  accentColor: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  focusArea: string;
  methodology: string;
}

export const STAGES: Record<StageId, StageMeta> = {
  adhd: {
    id: 'adhd',
    name: 'Attention & Focus',
    subtitle: 'Visual stimuli, movement & reaction speed',
    estimatedMinutes: 3,
    accentColor: 'amber',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    borderColor: 'border-amber-300',
    focusArea: 'Sustained attention, fidgeting & gaze stability',
    methodology: 'Webcam gaze tracking, blink frequency, and star response task',
  },
  dyslexia: {
    id: 'dyslexia',
    name: 'Reading & Phonology',
    subtitle: 'Word puzzles, rhymes, and sound matching',
    estimatedMinutes: 4,
    accentColor: 'emerald',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
    borderColor: 'border-emerald-300',
    focusArea: 'Letter confusion, rhyme matching & phonological memory',
    methodology: 'Interactive multiple choice questions with optional audio speech',
  },
  autism: {
    id: 'autism',
    name: 'Social Communication',
    subtitle: 'Scene comprehension & social gaze patterns',
    estimatedMinutes: 5,
    accentColor: 'indigo',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-800',
    borderColor: 'border-indigo-300',
    focusArea: 'Social cues, perspective taking & eye-contact engagement',
    methodology: 'Illustrated social situation questions followed by an animated storytelling segment',
  },
};

export const CORE_DISCLAIMER =
  'NeuroNudge is an early screening aid, not a medical or clinical diagnosis. It provides indicator insights (Low, Moderate, High) to help families and adults understand whether a comprehensive evaluation with a certified educational psychologist or neurodevelopmental specialist is advised. Webcam measurements are approximate and depend on lighting, camera positioning, and individual alertness.';

export const PRIVACY_PROMISE =
  'Your privacy is fully protected: raw webcam frames are analyzed live in local memory and are never saved or recorded. The final screening summary is synthesized locally on this computer. No names, video recordings, or raw camera feeds are ever sent over the internet.';
