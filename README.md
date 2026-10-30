# NeuroNudge

**Recognizing learning challenges early, supporting every child better.**

NeuroNudge is a web-based platform designed to help identify early signs of learning and developmental difficulties in children aged 5–10.

Through interactive activities, computer vision, and AI-assisted reporting, NeuroNudge helps parents and educators better understand a child's learning patterns and recognize when additional support may be helpful.

The platform focuses on three areas: **dyslexia, ADHD, and autism**.

> **Clinical Safety Notice**: NeuroNudge is an exploratory screening and learning-support prototype, **not** a clinical diagnostic tool. It never claims clinical diagnostic accuracy, never calculates disability probabilities, and never outputs medical diagnoses.

---

## How It Works

NeuroNudge combines short, child-friendly activities with measurable observations.

1. **Create a session** — A parent or guardian provides explicit consent and basic age information.
2. **Complete the activities** — The child participates in reading, attention, and social-understanding activities.
3. **Capture observations** — The system records interaction responses, reaction times, and real-time webcam measurements (processed in memory).
4. **Analyze results** — Deterministic scoring processes the recorded task data *(scoring engine in progress)*.
5. **Generate a report** — Gemma 4 explains observations in simple language and suggests practical next steps *(reporting service in progress)*.

The goal is to make the results understandable and supportive without replacing professional evaluation.

---

## Key Features

- **Interactive Assessments** — Age-appropriate activities covering reading, attention, and social understanding.
- **Computer Vision** — OpenCV and MediaPipe support real-time face mesh, iris tracking, and gaze estimation over WebSocket streaming.
- **Performance Tracking** — Records task accuracy, response times, and interaction patterns.
- **AI-Assisted Reports** *(In Progress)* — Google Gemma 4 translates assessment results into clear, parent-friendly explanations and supportive learning recommendations.
- **Session History** — Local SQLite persistence stores session metadata and stage records for review.
- **Privacy-Focused Design** — Ephemeral video processing in memory. Raw webcam frames are never persisted to disk or external services.

---

## Gemma 4 Integration

NeuroNudge utilizes **Google Gemma 4** as its AI-powered reporting component *(currently in active development)*.

Assessment results are first processed by the backend using deterministic scoring calculations. Gemma 4 then receives a structured, anonymized summary of the available measurements to draft an accessible narrative report.

Its role is to:
- Explain observed strengths and areas of difficulty in constructive language.
- Suggest simple, age-appropriate learning activities and sensory accommodations.
- Help parents understand recorded results without clinical jargon.
- Encourage timely consultation with qualified specialists when concerns persist.

**Safeguards**:
- Gemma 4 does not calculate underlying measurements, assign diagnoses, or replace healthcare professionals.
- Only the minimum necessary metric summaries are shared with the model.
- Raw webcam footage, images, and identifying child information (PII) are strictly excluded from the reporting flow.

---

## Technology Stack

| Component | Technology | Status |
|---|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS | Implemented |
| Backend | Python 3.11, FastAPI, Pydantic v2 | Implemented |
| Database | SQLite, SQLAlchemy 2.x | Implemented |
| Computer Vision | OpenCV, MediaPipe, NumPy | Implemented |
| AI Reporting | Google Gemma 4 | In Progress |
| Communication | REST API, WebSockets | Implemented |
| Hosting & Deployment | DigitalOcean | Planned |

---

## Project Structure

```text
neuronudge/
├── frontend/             # React application
│   ├── src/
│   │   ├── components/   # UI and stage components
│   │   ├── hooks/        # Webcam, WebSocket, and session hooks
│   │   ├── lib/          # API client and TypeScript contracts
│   │   └── pages/        # Route pages
│   └── public/
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── api/          # REST (sessions, health, stages) and WebSocket endpoints
│   │   ├── cv/           # Computer vision pipelines and landmark tracking
│   │   ├── db/           # SQLAlchemy models and SQLite connection
│   │   ├── schemas/      # Shared Pydantic validation schemas
│   │   ├── scoring/      # Deterministic assessment scoring engines
│   │   └── services/     # Session management and Gemma 4 reporting
│   ├── tests/            # Automated test suite
│   └── run.py            # Uvicorn server launcher
└── docs/                 # API contracts and architecture specifications
```

---

## Running Locally

### Prerequisites
- **Node.js** (v18+) and **npm**
- **Python 3.11**

### Backend Setup

```bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python run.py
```

The FastAPI backend will be available at `http://localhost:8000`, with interactive OpenAPI documentation at `http://localhost:8000/docs`.

Backend configuration (including Gemma 4 model settings and CORS origins) is managed in `backend/.env`.

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Vite will serve the frontend at `http://localhost:5173` (or `http://localhost:8080` depending on configuration).

### Running Both Concurrently

From the root repository directory:

```bash
npm install
npm run dev
```

---

## Privacy & Limitations

NeuroNudge is designed to support early awareness, not provide medical diagnoses.

Webcam-based measurements are exploratory and can be influenced by lighting conditions, camera hardware, and subject movement. Assessment observations should never be interpreted as confirmed indicators of any medical condition without qualified clinical evaluation.

The platform is intended to help families understand observed learning patterns and seek professional guidance when needed.

---

## Built for Hacktoberfest

NeuroNudge was developed as a collaborative hackathon project, bringing together web development, computer vision, and AI to explore accessible, supportive tools for children's learning.

---

**Every child learns differently. Understanding those differences is where better support begins.**
