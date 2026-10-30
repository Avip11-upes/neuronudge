NEURONUDGE
Early Neurodivergence Screening Platform
Project Report v1.0 | Team Phoenix | Hacktober 2026


ABOUT THE PROJECT
=================

NeuroNudge is a locally hosted web application that runs a short, staged, game-like assessment on a child or adult and produces an AI-written screening report about indicators of ADHD, dyslexia and autism.

Many families wait years for an evaluation, while the best window to help is early. NeuroNudge aims to shorten the path from a first worry to the right professional help.

The assessment has three stages, one per condition. At the end, the backend computes deterministic scores, and the Gemini API turns those scores into a readable report with observed symptoms, a ranked list of the most to least likely condition (if any), and suggested next steps.

IMPORTANT: NeuroNudge is a screening aid, not a diagnosis. It never says that a user has autism, ADHD or dyslexia. It reports indicator levels (Low, Moderate, High) and recommends a qualified professional for confirmation. Webcam-based gaze and expression analysis is approximate and depends on lighting, camera quality, and the user's age and attention. Every report carries a disclaimer, and users give explicit consent before the camera starts.


KEY FEATURES
============

- Three game-like stages covering attention and activity (ADHD), reading and phonology (dyslexia), and social communication and repetitive behaviour (autism).
- Webcam analysis of gaze, blinks, head movement, facial engagement, eye contact and repetitive motion, using OpenCV and MediaPipe.
- Age-banded dyslexia questions (5 to 7, 8 to 12, 13 and up) with text-to-speech audio prompts.
- Transparent scoring: indicator levels come from plain, tunable code, not from the AI.
- AI-written report from Gemini, with a template-based fallback if the API is unreachable.
- Privacy first: all data stays on the laptop, no raw video is stored, and a delete-all-data button is always available.
- Printable report (PDF via the browser print stylesheet) and a local history page.


THE THREE STAGES
================

Stage 1: ADHD
  Task: About 3 minutes. 6 to 8 stimulus blocks of 20 to 30 seconds: bright animations, a calm slow scene, a fast-cut video, a find-the-moving-object game, and a press-when-a-star-appears task.
  Signals: gaze-on-screen ratio and dispersion, look-aways, fixations and saccades, blink rate, head movement, facial engagement, reaction time, missed targets, false presses.

Stage 2: Dyslexia
  Task: About 4 minutes, 15 to 20 multiple-choice questions, no camera. Letter confusion (b/d, p/q, m/w), rhyme and sound matching, real word vs. non-word, spelling choice, sequences, and short sentence comprehension.
  Signals: accuracy per category, response time, hesitation (hover and answer changes), reversal-error count.

Stage 3: Autism
  Task: Part A (about 3 minutes): 10 to 12 illustrated social-situation questions. Part B (about 2 minutes): a friendly animated face talks to the user, followed by a neutral waiting screen.
  Signals: question accuracy by category, eye-contact ratio toward the face, gaze aversion, repetitive head or body movement, limited facial expression range.


USER FLOW
=========

1. Landing page with purpose, disclaimer and Start.
2. Consent (guardian consent if age is under 18), camera permission, and a note that data stays local.
3. Profile: nickname, age, language, and who is taking the test (child or adult).
4. Camera check: face visible, lighting OK, and calibration by looking at 5 dots.
5. Stage hub: three cards showing progress. Stages run in order but can be resumed.
6. Stage 1, then Stage 2, then Stage 3.
7. Processing screen while scoring and Gemini run.
8. Report page with indicator chart, symptoms, ranking, recommendations and disclaimer, with PDF or print.
9. History page listing earlier local sessions, with a delete-all-data button.


TECH STACK
==========

Frontend: React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, React Router, TanStack Query, Framer Motion, Recharts (built with Lovable).
Backend: Python 3.11, FastAPI, Uvicorn, Pydantic v2, SQLAlchemy.
Computer vision: OpenCV (opencv-python), MediaPipe Face Mesh with iris landmarks, MediaPipe Hands (optional), NumPy, SciPy.
AI report: Google Gemini API via the google-genai SDK, structured JSON output.
Storage: SQLite file plus per-session JSON files in backend/storage/.
Tooling: VS Code, concurrently, Git.


ARCHITECTURE
============

The browser (React, localhost:8080) owns the webcam and timestamps every frame against what was on screen. It sends small JPEG frames (5 to 10 per second) to the FastAPI backend (localhost:8000) over a WebSocket, while normal requests use REST. The backend analyses frames with OpenCV and MediaPipe, scores the results, stores data locally in SQLite, and asks the Gemini API (cloud, metrics only) for the narrative report.

How the report is produced:

1. Deterministic scoring (backend code). Each stage turns its features into a 0 to 100 indicator score against age-adjusted thresholds kept in config files. Scores map to Low (under 35), Moderate (35 to 65) or High (over 65), and the three conditions are ranked.
2. Gemini writes the narrative. It receives compact JSON (age, metrics, scores, levels, ranking) and is told to explain, not re-score, and never to diagnose. The backend validates the JSON with Pydantic and retries once on failure. If Gemini is unreachable, a template-based fallback report is generated.


PROJECT STRUCTURE
=================

neuronudge/
|-- README.md
|-- package.json            (root scripts: dev runs frontend + backend)
|-- frontend/               (React + Vite + TypeScript, built with Lovable)
|   |-- public/stimuli/     (images, videos, audio for stages)
|   `-- src/
|       |-- pages/          (Landing, Consent, Profile, CameraCheck, StageHub,
|       |                    3 stages, Processing, Report, History)
|       |-- components/     (layout, camera, stimuli, questions, report, ui)
|       |-- hooks/          (useWebcam, useFrameStream, useSession, useStageTimer)
|       |-- lib/            (api.ts, types.ts, constants.ts)
|       `-- store/          (sessionStore.ts)
`-- backend/                (FastAPI)
    |-- requirements.txt
    |-- run.py              (uvicorn launcher)
    |-- .env.example        (GEMINI_API_KEY, GEMINI_MODEL, FRONTEND_ORIGIN)
    `-- app/
        |-- main.py, config.py
        |-- api/            (health, sessions, stages, reports, ws_stream)
        |-- cv/             (face_mesh, gaze, blink, head_pose, expression,
        |                    repetitive_motion, aggregator)
        |-- scoring/        (adhd, dyslexia, autism, combine)
        |-- services/       (gemini_service, report_builder, session_service)
        |-- db/             (database, models, crud)
        |-- schemas/        (Pydantic models)
        `-- data/           (question banks and report prompt)


GETTING STARTED
===============

Prerequisites:
- Python 3.11
- Node.js and npm
- A laptop with a webcam
- A Gemini API key

1. Clone the repository

    git clone <your-repository-url>
    cd neuronudge

2. Set up the backend

    cd backend
    python -m venv .venv
    (Windows)     .venv\Scripts\activate
    (macOS/Linux) source .venv/bin/activate
    pip install -r requirements.txt
    cp .env.example .env

   Open backend/.env and set GEMINI_API_KEY, GEMINI_MODEL and FRONTEND_ORIGIN. The API key lives only in the backend and is never exposed to the frontend.

3. Set up the frontend

    cd frontend
    npm install
    cp .env.example .env

   The default is VITE_API_BASE_URL=http://localhost:8000. Set VITE_USE_MOCKS=true to run the UI with fake data before the backend is ready.

4. Run everything

   From the project root, one command starts both servers (using concurrently):

    npm install
    npm run dev

   Or run them separately: "python run.py" inside backend/, and "npm run dev" inside frontend/.

5. Open the app

- App: http://localhost:8080
- API docs (OpenAPI): http://localhost:8000/docs
- Health check: http://localhost:8000/api/health

The browser treats localhost as secure, so the webcam works without HTTPS. Use good, even lighting for best results.


API OVERVIEW
============

GET    /api/health                                   Backend alive check
POST   /api/sessions                                 Create a session from profile and consent
GET    /api/sessions                                 List sessions
GET    /api/sessions/{id}                            Get one session with stage progress
DELETE /api/sessions/{id}                            Delete one session
DELETE /api/sessions                                 Delete all local data
POST   /api/sessions/{id}/stages/{stage}/start       Begin a stage
POST   /api/sessions/{id}/stages/{stage}/finish      End a stage, returns a summary
GET    /api/questions/{stage}?age=                   Fetch age-banded multiple-choice questions
POST   /api/sessions/{id}/answers                    Submit an answer with response time
POST   /api/sessions/{id}/block-marker               Tell the backend which stimulus block is on screen
POST   /api/sessions/{id}/report                     Run scoring and Gemini, returns the report
GET    /api/sessions/{id}/report                     Fetch the stored report
WS     /ws/stream/{id}?stage=                        Send webcam frames, receive live face and gaze status


DATA MODEL
==========

SQLite tables: sessions, stage_runs, cv_blocks, answers, scores and reports. Raw video is never saved. Frames are analysed in memory and discarded, and only numeric metrics are stored. Per-session metrics.json and report.json files are written under backend/storage/, which is git-ignored.


PRIVACY AND ETHICS
==================

- Explicit consent screen, guardian consent for users under 18, and the camera can be stopped at any time.
- No raw video or images are stored, only numeric features.
- All data is stored locally, and a delete-all-my-data button is always available.
- Gemini is a cloud API. Only aggregated metrics and answers (no names, no images) are sent to it, and the consent screen states this clearly.
- The API key lives only in backend/.env, never in the frontend.
- The UI and report use the words "indicators" and "may suggest", never "has".


LIMITATIONS
===========

- Laptop webcams give coarse gaze: expect left, right, top and bottom regions, not pixel accuracy.
- Poor lighting and glasses glare reduce accuracy; the camera check step guards against this.
- Expression and repetitive-motion detection are heuristics that need tuning on real test data.
- Thresholds are initial guesses and are not clinically validated.
- Question content should be reviewed by a qualified professional and informed by established screening instruments before any real-world use.


ROADMAP
=======

Today: Hacktober MVP. Three screening modules and an instant report.
Next:  Pilot and validate. Test with schools and clinics, review with experts, add local languages.
Later: Scale up. Mobile app, clinician dashboard, progress tracking over time.


TEAM AND LICENSE
================

Team: Team Phoenix, Hacktober 2026.
The frontend was built with Lovable and the backend was built by teammates.
License: add your license here (for example MIT).
