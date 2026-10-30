# NeuroNudge — Contributor & Agent Operating Guide

This guide establishes the permanent engineering, architectural, and operational rules for the NeuroNudge repository. All contributors and automated agents must adhere to these standards.

---

## 1. Project Context & Technology Stack

NeuroNudge is a local-first web application designed for children aged 5–10 to explore early learning and developmental concerns across three areas:
1. **Dyslexia**: Reading, phonological, and visual tracking patterns.
2. **ADHD**: Attention span, impulse control, and response-inhibition tasks.
3. **Autism**: Social communication, visual cues, and joint-attention tasks.

**Hackathon Prototype Notice**: NeuroNudge is an exploratory prototype, **not** a clinically validated medical device. Never claim clinical diagnostic accuracy, never calculate disability probabilities, and never output medical diagnoses.

### Technology Stack
- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS, shadcn/ui, React Router.
- **Backend**: Python 3.11, FastAPI, Uvicorn, Pydantic v2, SQLAlchemy, SQLite.
- **Computer Vision**: OpenCV, MediaPipe, NumPy, SciPy.
- **AI**: Google Gemma 4 (mandatory; generates parent-friendly explanations and learning recommendations from measured task metrics; never diagnoses).
- **Communication & Storage**: REST APIs, WebSockets; local SQLite database. Raw webcam frames are processed strictly in memory and never persisted.

---

## 2. Team Ownership & Modularity

The backend engineering workload is divided among three roles:

- **Backend Lead**:
  - FastAPI application initialization, CORS, global configuration (`backend/app/config.py`, `backend/app/main.py`).
  - SQLAlchemy setup and DB models (`backend/app/db/`).
  - Shared Pydantic schemas (`backend/app/schemas/`).
  - Core REST APIs (`backend/app/api/sessions.py`, `stages.py`, `health.py`).
  - Session lifecycle, consent, and final system integration/QA.
- **Computer Vision Engineer**:
  - Frame decoding, MediaPipe face mesh, iris tracking, gaze calibration (`backend/app/cv/`).
  - WebSocket video streaming (`backend/app/api/ws_stream.py`).
  - Blink rate, head pose, repetitive motion metrics, and CV aggregation.
- **Assessment & Gemma 4 Engineer**:
  - Question banks and question serving (`backend/app/data/questions/`).
  - Scoring engines (`backend/app/scoring/`).
  - LLM prompt orchestration and Gemma 4 integration (`backend/app/services/llm_service.py`, `report_builder.py`).
  - Report endpoints (`backend/app/api/reports.py`) and fallback mechanisms.

**Collaboration Boundary**: Do not modify another contributor's module without prior coordination. Shared files (`requirements.txt`, `main.py`, `schemas/`, `docs/api-contract.md`) must be coordinated through the Backend Lead.

---

## 3. Milestone-Based Discipline

1. **Strict Scope**: Implement only the explicitly assigned milestone. Never auto-advance to future milestones.
2. **No Speculative Code**: Do not write placeholder abstractions or code for anticipated requirements.
3. **Preserve Working Code**: Never break, overwrite, or refactor previously approved behavior without explicit agreement.
4. **Stop on Blockers**: If unexpected architectural complexity or blocking defects emerge, stop and report immediately rather than guessing.

---

## 4. Execution Workflow (Fast & Focused)

Time is critical in a hackathon setting. Follow the standard path:
```text
LOCATE -> UNDERSTAND -> IMPLEMENT -> TARGETED TEST -> DIFF REVIEW -> REPORT -> STOP
```

- **Targeted Reading**: Inspect only files directly relevant to the task; avoid repository-wide scans.
- **Minimalist Implementations**: Prefer direct, clean solutions over layers of abstraction.
- **No Idle Retries**: Never re-run failing commands without diagnosing root cause.
- **Concise Reporting**: Keep updates factual, concise, and focused on verification evidence.

---

## 5. Code Quality Standards

- **Typing & Clean Code**: Use explicit Python type hints (Pydantic v2 schemas, typed functions) and clear naming.
- **Comments**: Comment only non-obvious logic, concurrency, privacy constraints, or security safeguards. Avoid redundant restatements of code, decorative headers, or verbose docstrings.
- **Clean Submissions**: Remove unused imports, print statements, temporary test scripts, and dead code before review.
- **Authentic Implementation**: Never introduce mock responses or fake success indicators disguised as functional code.

---

## 6. Git, Branching & PR Hygiene

- **Branch Isolation**: Work strictly on your assigned feature or personal branch. Never commit or push directly to `main` or `master`.
- **Identity Integrity**: Preserve your own configured Git identity (`user.name` and `user.email`). Never impersonate other contributors or use generic agent/bot identities.
- **Targeted Staging**: Never use `git add .` or stage the entire tree. Stage only specific milestone files.
- **Clean Commits**: Use concise conventional commit messages (e.g., `feat: initialize session routes`, `fix: handle missing iris landmark`). Do not add decorative emojis or AI/bot signatures.
- **Safe History**: Never force-push, rewrite shared history, or rebase shared branches.
- **Review Cycle**: Inspect `git diff --cached` before every commit. Verify diffs, test outputs, and limitations before opening PRs. Never automatically merge PRs.

---

## 7. Shared API & Data Contracts

- **Contracts First**: Agree on session identifiers, stage names, payload schemas, WebSocket packet formats, and database models before parallel implementation begins.
- **Compatibility**: Document REST and WebSocket schemas in `docs/api-contract.md` and define them in `backend/app/schemas/`.
- **Zero Breaking Changes**: Never alter existing endpoints, field names, or types without informing the team and frontend developers.

---

## 8. Clinical Safety & Child Privacy Safeguards

- **Parental Consent**: Explicit guardian consent must be recorded before an assessment session starts.
- **Ephemeral Video Processing**: Webcam frames must be processed in memory. **Never save raw webcam frames, video recordings, or images to disk.**
- **Zero PII to LLMs**: Never transmit child names, dates of birth, identifiable data, or raw images to Gemma 4 or external APIs.
- **Constructive, Non-Diagnostic Reports**:
  - Reports describe observed task performance and engagement constructively.
  - Suggest supportive learning activities and sensory accommodations.
  - Never generate disability risk scores, diagnostic labels, or definitive medical claims.
- **Noisy & Missing Data Handling**: Explicitly flag low lighting, lost face tracking, or incomplete tasks in metric objects rather than fabricating data.

---

## 9. Testing & Verification Hierarchy

Always apply the narrowest appropriate check before escalating:
1. **Targeted Unit Tests**: Specific function or schema checks.
2. **Module Integration Tests**: Endpoint or service checks.
3. **Type & Lint Checks**: Targeted linting without full workspace reformatting.
4. **Startup Check**: App initializes cleanly with all routers mounted.

Clearly distinguish between: **Passed**, **Failed**, **Mocked**, and **Live Service Verified**. Never report unverified functionality as working.

---

## 10. Milestone Completion Reporting

At the conclusion of each milestone, report using this exact format:

```text
IMPLEMENTED: <Brief summary of what was built>
FILES CHANGED: <Exact list of created or modified file paths>
TESTS / VERIFICATION: <Exact commands run and their specific results>
BLOCKERS: <Any unresolved issues, ambiguities, or dependencies>
READY FOR NEXT MILESTONE: <YES / NO>
```

After submitting the report, **STOP** and await lead approval before proceeding.
