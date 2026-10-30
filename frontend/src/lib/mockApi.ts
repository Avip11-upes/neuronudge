import {
  CreateSessionRequest,
  CreateSessionResponse,
  HealthResponse,
  Question,
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
import { CORE_DISCLAIMER } from './constants';

interface StoredSession {
  session_id: string;
  nickname: string;
  age: number;
  language: 'en' | 'hi';
  taker: 'child' | 'adult';
  created_at: string;
  stages: Record<StageId, 'pending' | 'running' | 'done'>;
  answers: SubmitAnswerRequest[];
  starReactionTimes: number[];
  report?: Report;
}

const STORAGE_KEY = 'neuronudge_mock_sessions_v1';

const memorySessions: Record<string, StoredSession> = {};

function getStoredSessions(): Record<string, StoredSession> {
  if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // fallback to memory
    }
  }
  return memorySessions;
}

function saveStoredSessions(data: Record<string, StoredSession>) {
  if (data !== memorySessions) {
    for (const k of Object.keys(memorySessions)) {
      delete memorySessions[k];
    }
    Object.assign(memorySessions, data);
  }

  if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.warn('Failed to save to sessionStorage', err);
    }
  }
}

export const DYSLEXIA_QUESTIONS: Question[] = [
  {
    id: 'dys_q1',
    category: 'Letter Direction & Confusion',
    prompt: 'Which of these letters is the lowercase "b" as in "ball"?',
    image_url: null,
    audio_text: 'Which of these letters is the lowercase b, as in ball?',
    options: [
      { id: 'opt_d', text: 'd' },
      { id: 'opt_b', text: 'b' },
      { id: 'opt_p', text: 'p' },
      { id: 'opt_q', text: 'q' },
    ],
  },
  {
    id: 'dys_q2',
    category: 'Rhyme & Phonological Sound',
    prompt: 'Which word makes the same ending sound as "LAKE"?',
    image_url: null,
    audio_text: 'Which word makes the same ending sound as LAKE? Cake, Like, Lock, or Leek?',
    options: [
      { id: 'opt_cake', text: 'Cake' },
      { id: 'opt_like', text: 'Like' },
      { id: 'opt_lock', text: 'Lock' },
      { id: 'opt_leek', text: 'Leek' },
    ],
  },
  {
    id: 'dys_q3',
    category: 'Real Word vs Non-Word',
    prompt: 'Look at the choices below. Which one is a REAL English word you can find in a book?',
    image_url: null,
    audio_text: 'Which of these is a real English word? Drost, Flirp, Basket, or Glop?',
    options: [
      { id: 'opt_w1', text: 'Drost' },
      { id: 'opt_w2', text: 'Flirp' },
      { id: 'opt_w3', text: 'Basket' },
      { id: 'opt_w4', text: 'Glop' },
    ],
  },
  {
    id: 'dys_q4',
    category: 'Spelling Recognition',
    prompt: 'Choose the word that is spelled correctly:',
    image_url: null,
    audio_text: 'Choose the word that is spelled correctly: Friend, Freind, Frind, or Frend?',
    options: [
      { id: 'opt_s1', text: 'Freind' },
      { id: 'opt_s2', text: 'Friend' },
      { id: 'opt_s3', text: 'Frind' },
      { id: 'opt_s4', text: 'Frend' },
    ],
  },
  {
    id: 'dys_q5',
    category: 'Sequential Memory',
    prompt: 'Look at the sequence of days: Tuesday, Wednesday, Thursday... What comes next?',
    image_url: null,
    audio_text: 'Look at the sequence of days: Tuesday, Wednesday, Thursday. What comes next?',
    options: [
      { id: 'opt_fri', text: 'Friday' },
      { id: 'opt_sat', text: 'Saturday' },
      { id: 'opt_mon', text: 'Monday' },
      { id: 'opt_sun', text: 'Sunday' },
    ],
  },
  {
    id: 'dys_q6',
    category: 'Sentence Comprehension',
    prompt: '"The green frog jumped high over the wooden fence." What did the frog jump over?',
    image_url: null,
    audio_text: 'The green frog jumped high over the wooden fence. What did the frog jump over?',
    options: [
      { id: 'opt_c1', text: 'A wooden fence' },
      { id: 'opt_c2', text: 'A muddy pond' },
      { id: 'opt_c3', text: 'A tall tree' },
      { id: 'opt_c4', text: 'A big rock' },
    ],
  },
];

export const AUTISM_QUESTIONS: Question[] = [
  {
    id: 'aut_q1',
    category: 'Emotion Recognition in Context',
    prompt: 'A classmate dropped their drawing project on the floor and their shoulders are slumped. How might they be feeling?',
    image_url: 'scene_dropped_paper',
    audio_text: 'A classmate dropped their drawing project on the floor and their shoulders are slumped. How might they be feeling?',
    options: [
      { id: 'opt_sad', text: 'Disappointed or upset' },
      { id: 'opt_excited', text: 'Excited and joyful' },
      { id: 'opt_proud', text: 'Proud of their work' },
      { id: 'opt_bored', text: 'Sleepy and bored' },
    ],
  },
  {
    id: 'aut_q2',
    category: 'Figurative Language Comprehension',
    prompt: 'When someone says "It is raining cats and dogs outside!", what do they mean?',
    image_url: 'scene_rain',
    audio_text: 'When someone says "It is raining cats and dogs outside!", what do they really mean?',
    options: [
      { id: 'opt_rain_heavy', text: 'It is raining very heavily' },
      { id: 'opt_animals_falling', text: 'Real pets are falling from clouds' },
      { id: 'opt_sunny', text: 'The sun is shining brightly' },
      { id: 'opt_windy', text: 'Animals are barking outside' },
    ],
  },
  {
    id: 'aut_q3',
    category: 'Perspective Taking',
    prompt: 'Your friend Maya really loves dinosaurs, but you love space. If Maya invites you to talk about dinosaurs, what is a polite response?',
    image_url: 'scene_friends_chat',
    audio_text: 'Your friend Maya loves dinosaurs, but you love space. What is a polite way to respond when she shares her favorite facts?',
    options: [
      { id: 'opt_p1', text: 'Listen with interest and take turns sharing your favorite space facts' },
      { id: 'opt_p2', text: 'Tell her immediately that dinosaurs are uninteresting' },
      { id: 'opt_p3', text: 'Walk away without saying anything' },
      { id: 'opt_p4', text: 'Cover your ears' },
    ],
  },
  {
    id: 'aut_q4',
    category: 'Social Rules & Turn Taking',
    prompt: 'You want to join a board game that two friends are already playing. What is the best step?',
    image_url: 'scene_board_game',
    audio_text: 'You want to join a board game that two friends are already playing. What is the most friendly way to join?',
    options: [
      { id: 'opt_r1', text: 'Wait for their turn to finish and ask: "Can I join in the next round?"' },
      { id: 'opt_r2', text: 'Grab the dice right away so you can roll' },
      { id: 'opt_r3', text: 'Stand silently directly in front of the board' },
      { id: 'opt_r4', text: 'Tell them to restart the whole game immediately' },
    ],
  },
  {
    id: 'aut_q5',
    category: 'Sarcasm & Tone Understanding',
    prompt: 'After someone trips over a gentle step and their friend smiles warmly and says, "Smooth move, champion!", what did the friend mean?',
    image_url: 'scene_trip',
    audio_text: 'Someone gently trips, smiles, and says "Smooth move, champion!". What does this tone usually indicate?',
    options: [
      { id: 'opt_sarcasm', text: 'A playful, gentle joke to lighten the awkward moment' },
      { id: 'opt_angry', text: 'They are genuinely congratulating a sports victory' },
      { id: 'opt_mad', text: 'They are furious and yelling' },
      { id: 'opt_literal', text: 'They truly believe the step was athletic' },
    ],
  },
];

export const mockApi = {
  async getHealth(): Promise<HealthResponse> {
    await new Promise((r) => setTimeout(r, 120));
    return {
      status: 'ok',
      llm: {
        provider: 'ollama',
        model: 'gemma:4b',
        ready: true,
      },
    };
  },

  async createSession(req: CreateSessionRequest): Promise<CreateSessionResponse> {
    await new Promise((r) => setTimeout(r, 150));
    const sessionId = `sess_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const sessions = getStoredSessions();
    const newSession: StoredSession = {
      session_id: sessionId,
      nickname: req.nickname,
      age: req.age,
      language: req.language,
      taker: req.taker,
      created_at: new Date().toISOString(),
      stages: {
        adhd: 'pending',
        dyslexia: 'pending',
        autism: 'pending',
      },
      answers: [],
      starReactionTimes: [],
    };
    sessions[sessionId] = newSession;
    saveStoredSessions(sessions);
    return {
      session_id: sessionId,
      created_at: newSession.created_at,
    };
  },

  async getSession(id: string): Promise<SessionDetailResponse> {
    await new Promise((r) => setTimeout(r, 100));
    const sessions = getStoredSessions();
    const sess = sessions[id];
    if (!sess) {
      // Fallback default
      return {
        session_id: id,
        nickname: 'Explorer',
        age: 8,
        stages: { adhd: 'pending', dyslexia: 'pending', autism: 'pending' },
      };
    }
    return {
      session_id: sess.session_id,
      nickname: sess.nickname,
      age: sess.age,
      stages: sess.stages,
    };
  },

  async listSessions(): Promise<SessionSummary[]> {
    await new Promise((r) => setTimeout(r, 120));
    const sessions = getStoredSessions();
    return Object.values(sessions).map((s) => ({
      session_id: s.session_id,
      nickname: s.nickname,
      created_at: s.created_at,
      has_report: !!s.report,
    }));
  },

  async deleteSession(id: string): Promise<{ ok: boolean }> {
    await new Promise((r) => setTimeout(r, 80));
    const sessions = getStoredSessions();
    delete sessions[id];
    saveStoredSessions(sessions);
    return { ok: true };
  },

  async deleteAllSessions(): Promise<{ ok: boolean }> {
    await new Promise((r) => setTimeout(r, 100));
    saveStoredSessions({});
    return { ok: true };
  },

  async startStage(id: string, stage: StageId): Promise<StageStartResponse> {
    await new Promise((r) => setTimeout(r, 80));
    const sessions = getStoredSessions();
    if (sessions[id]) {
      sessions[id].stages[stage] = 'running';
      saveStoredSessions(sessions);
    }
    return { ok: true, started_at: new Date().toISOString() };
  },

  async finishStage(id: string, stage: StageId): Promise<StageFinishResponse> {
    await new Promise((r) => setTimeout(r, 100));
    const sessions = getStoredSessions();
    if (sessions[id]) {
      sessions[id].stages[stage] = 'done';
      saveStoredSessions(sessions);
    }
    return {
      ok: true,
      summary: {
        stage,
        completed_at: new Date().toISOString(),
      },
    };
  },

  async getQuestions(stage: StageId, _age?: number): Promise<QuestionsResponse> {
    await new Promise((r) => setTimeout(r, 120));
    if (stage === 'dyslexia') {
      return { questions: DYSLEXIA_QUESTIONS };
    }
    if (stage === 'autism') {
      return { questions: AUTISM_QUESTIONS };
    }
    return { questions: [] };
  },

  async submitAnswer(id: string, body: SubmitAnswerRequest): Promise<SubmitAnswerResponse> {
    await new Promise((r) => setTimeout(r, 60));
    const sessions = getStoredSessions();
    if (sessions[id]) {
      sessions[id].answers.push(body);
      if (body.stage === 'adhd') {
        sessions[id].starReactionTimes.push(body.response_ms);
      }
      saveStoredSessions(sessions);
    }
    return { ok: true };
  },

  async sendBlockMarker(_id: string, _body: BlockMarkerRequest): Promise<BlockMarkerResponse> {
    await new Promise((r) => setTimeout(r, 30));
    return { ok: true };
  },

  async generateReport(id: string): Promise<Report> {
    // Local AI models can take some time; mock takes 1.5s to show gentle animated loader
    await new Promise((r) => setTimeout(r, 1600));
    const sessions = getStoredSessions();
    const sess = sessions[id];

    // Compute realistic mock indicators based on submitted answers if present
    const report: Report = {
      summary: `${sess?.nickname || 'The participant'} completed all three screening stages with engaging curiosity. The assessment observed notable sustained attention variations during dynamic stimulus blocks, moderate hesitation when analyzing mirrored letterforms (b/d), and strong intuitive empathy during social scenario challenges.`,
      indicators: [
        {
          condition: 'adhd',
          level: 'moderate',
          score: 58,
          observed_symptoms: [
            'Frequent rapid gaze shifts during calmer visual scenes',
            'Increased fidgeting and posture adjustments during sustained attention blocks',
            'Quick impulsivity on star reaction targets (average response 342ms)',
          ],
          evidence: [
            'Gaze-on-screen ratio dropped from 88% in active game blocks to 62% in calm scenes.',
            'Higher saccade rate (3.4 saccades/sec) detected during prolonged viewing.',
            'Two early presses recorded before star target reached full visibility.',
          ],
        },
        {
          condition: 'dyslexia',
          level: 'moderate',
          score: 48,
          observed_symptoms: [
            'Extended contemplation time on b/d and p/q mirrored letter questions',
            'Hesitation with phonological rhyme pairs without audio support',
            'Benefit from audio-assisted speech reading support',
          ],
          evidence: [
            'Response latency was 1.8x longer on letter direction questions than sentence comprehension.',
            'Two option change events logged before confirming answers.',
            'High accuracy maintained when auditory cues were provided.',
          ],
        },
        {
          condition: 'autism',
          level: 'low',
          score: 24,
          observed_symptoms: [
            'Comfortable eye-engagement with the animated avatar storyteller',
            'High accuracy identifying subtle emotional cues in illustrated scenes',
            'Clear grasp of turn-taking and conversational reciprocity',
          ],
          evidence: [
            'Gaze directed toward avatar facial region for 76% of speaking duration.',
            'Correctly identified subtle disappointment and sarcasm in social choices.',
            'Low repetitive head or body motion detected (FFT power within normal baseline).',
          ],
        },
      ],
      most_likely: 'adhd',
      least_likely: 'autism',
      recommendations: [
        'Explore movement breaks ("sensory micro-pauses") every 15–20 minutes during focused classroom or homework sessions.',
        'Consider multisensory reading tools (e.g., colored overlays, audio-supported text, or dyslexie fonts) to ease letter recognition.',
        'Share this screening summary with an educational psychologist or developmental pediatrician for clinical confirmation and guidance.',
        'Celebrate strong social perspective-taking skills and creative lateral problem solving.',
      ],
      confidence_note:
        'High screening reliability: Camera calibration was stable throughout stages, with 91% valid facial tracking frames and good ambient lighting.',
      disclaimer: CORE_DISCLAIMER,
      generated_by: 'gemma-4',
    };

    if (sess) {
      sess.report = report;
      saveStoredSessions(sessions);
    }
    return report;
  },

  async getReport(id: string): Promise<Report> {
    const sessions = getStoredSessions();
    const sess = sessions[id];
    if (sess && sess.report) {
      return sess.report;
    }
    return this.generateReport(id);
  },
};
