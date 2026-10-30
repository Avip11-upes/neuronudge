# NeuroNudge — API & Data Contracts Specification

**Version:** 1.1 (Final Team Alignment)
**Status:** Approved Shared Contract (Milestone 1C)
**Authors:** Backend Lead (Aditya), in alignment with CV Engineer and Assessment/Gemma 4 Engineer

---

## 1. Architectural Principles & Clock Design

NeuroNudge combines REST APIs with a lightweight WebSocket telemetry stream:
- **REST APIs (`http://localhost:8000/api`)**: Manages session state, assessment flow, question serving, answer latency recording, and report retrieval.
- **WebSocket Stream (`ws://localhost:8000/ws/stream/{session_id}?stage=`)**: Transmits ephemeral video frames from the browser to the backend CV pipeline and returns live tracking feedback.

### Distinct Timing Systems
- **Wall-Clock Time (`t`)**: Frame timestamps use **Unix epoch milliseconds** (`Date.now()`, integer ms, e.g. `1730279000000`). Used for chronological alignment between client events and CV observation windows.
- **Monotonic Duration (`response_time_ms`, `duration_seconds`)**: Task response latencies and block durations use client **monotonic timing** (`performance.now()`).
- **Clock Rule**: Monotonic durations and wall-clock epoch timestamps serve distinct purposes and **must not be subtracted from or compared directly to one another**.

### Clinical Safety & Child Privacy Safeguards
- **In-Memory Frame Processing**: Frames sent via WebSockets are decoded in memory, analysed for facial/gaze landmarks, and immediately discarded. No video files or raw frames are ever written to disk.
- **Zero PII to LLMs**: Child names and birthdates are never sent to Gemma 4 or external APIs.
- **Non-Diagnostic Policy**: Reports and indicator scores describe observed task performance and visual engagement patterns constructively. They never produce clinical disability probability rankings, medical labels, or clinical diagnostic thresholds.

---

## 2. Existing REST Endpoints (Implemented & Verified)

### 2.1 Health Check
- **Endpoint:** `GET /api/health`
- **Description:** Verifies service availability.
- **Response (200 OK):**
  ```json
  {
    "status": "ok"
  }
  ```

---

### 2.2 Create Session
- **Endpoint:** `POST /api/sessions`
- **Description:** Initializes a child assessment session. Enforces explicit guardian consent and age validation (5–10 years inclusive). Supports both canonical backend fields and frontend client payload aliases.
- **Request Body (`application/json`):**
  ```json
  {
    "child_nickname": "Alex",
    "child_age": 7,
    "guardian_consent": true,
    "language": "en",
    "taker": "child"
  }
  ```
  *(Frontend alias format `{ "nickname": "Alex", "age": 7, "consent": true, "language": "en", "taker": "child" }` is also accepted).*
- **Validation Rules:**
  - `child_nickname` / `nickname`: string, 1–100 characters. Default: `"Child"`.
  - `child_age` / `age`: integer, strictly between `5` and `10` inclusive.
  - `guardian_consent` / `consent`: boolean, must strictly be `true` (unverified client declaration for logging).
  - `language`: optional string (`"en"` or `"hi"`, default `"en"`).
  - `taker`: optional string (`"child"` or `"adult"`, default `"child"`).
- **Response (201 Created):**
  ```json
  {
    "id": "e9a03b5b-0145-4277-94e8-8a8f1dd63a56",
    "session_id": "e9a03b5b-0145-4277-94e8-8a8f1dd63a56",
    "child_nickname": "Alex",
    "nickname": "Alex",
    "child_age": 7,
    "age": 7,
    "guardian_consent": true,
    "status": "created",
    "current_stage": null,
    "created_at": "2026-10-30T10:00:00.000000",
    "updated_at": "2026-10-30T10:00:00.000000",
    "stage_runs": [],
    "stages": {
      "adhd": "pending",
      "dyslexia": "pending",
      "autism": "pending"
    },
    "has_report": false
  }
  ```
- **Error Responses:**
  - `422 Unprocessable Entity`: Age outside 5–10 or `guardian_consent` is false/missing.

---

### 2.3 List Sessions
- **Endpoint:** `GET /api/sessions?skip=0&limit=100`
- **Description:** Returns paginated list of existing sessions ordered by creation date descending.
- **Query Parameters:** `skip` (default `0`), `limit` (default `100`, max `500`).
- **Response (200 OK):**
  ```json
  {
    "items": [
      {
        "id": "e9a03b5b-0145-4277-94e8-8a8f1dd63a56",
        "session_id": "e9a03b5b-0145-4277-94e8-8a8f1dd63a56",
        "child_nickname": "Alex",
        "nickname": "Alex",
        "child_age": 7,
        "age": 7,
        "guardian_consent": true,
        "status": "created",
        "current_stage": null,
        "created_at": "2026-10-30T10:00:00.000000",
        "updated_at": "2026-10-30T10:00:00.000000",
        "stage_runs": [],
        "stages": {
          "adhd": "pending",
          "dyslexia": "pending",
          "autism": "pending"
        },
        "has_report": false
      }
    ],
    "total": 1
  }
  ```

---

### 2.4 Get Session Details
- **Endpoint:** `GET /api/sessions/{session_id}`
- **Description:** Fetches a session by UUID with associated stage runs. Returns `SessionResponse` with backwards-compatible aliases (`session_id`, `nickname`, `age`, `stages`, `has_report`).
- **Response (200 OK / 404 Not Found):** Same shape as `SessionResponse`.

---

### 2.5 Update Session Status
- **Endpoint:** `PATCH /api/sessions/{session_id}`
- **Description:** Updates status or stage pointer of a session.
- **Request Body (`application/json`):**
  ```json
  {
    "status": "in_progress",
    "current_stage": "dyslexia"
  }
  ```
- **Response (200 OK / 404 Not Found):** Updated `SessionResponse`.

---

### 2.6 Delete Session
- **Endpoint:** `DELETE /api/sessions/{session_id}`
- **Description:** Deletes a session and cascade-deletes all associated relational records (`stage_runs`, `cv_blocks`, `answers`, `scores`, `reports`) and purges local storage directory (`backend/storage/sessions/{session_id}`).
- **Response (200 OK / 404 Not Found):**
  ```json
  {
    "ok": true,
    "message": "Session 'e9a03b5b-0145-4277-94e8-8a8f1dd63a56' and all associated records deleted"
  }
  ```

---

### 2.7 Delete All Sessions (Purge Data)
- **Endpoint:** `DELETE /api/sessions`
- **Description:** Clears all sessions, cascades through all relational tables, and wipes all session storage files.
- **Response (200 OK):**
  ```json
  {
    "ok": true,
    "message": "All sessions and associated records deleted",
    "deleted_count": 5
  }
  ```

---

## 3. Confirmed Stage & Assessment Interfaces

### 3.1 Start a Stage
- **Endpoint:** `POST /api/sessions/{session_id}/stages/{stage_name}/start`
- **Stage Names:** `adhd`, `dyslexia`, `autism`
- **Behavior:**
  - Verifies session exists.
  - Updates `sessions.current_stage = stage_name` and `status = "in_progress"`.
  - Creates or updates `stage_runs` record with `status = "in_progress"` and `started_at = now()`.
- **Response (200 OK):**
  ```json
  {
    "id": "stage-run-uuid",
    "session_id": "session-uuid",
    "stage_name": "adhd",
    "status": "in_progress",
    "started_at": "2026-10-30T10:05:00.000000",
    "completed_at": null,
    "duration_seconds": null,
    "metrics_summary": null
  }
  ```

---

### 3.2 Finish a Stage (Deterministic Scoring Trigger)
- **Endpoint:** `POST /api/sessions/{session_id}/stages/{stage_name}/finish`
- **Request Body (`application/json`):**
  ```json
  {
    "duration_seconds": 185.4,
    "metrics_summary": {
      "completed_items": 15,
      "total_items": 15
    }
  }
  ```
- **Behavior:**
  - Sets `stage_runs.status = "completed"` and `completed_at = now()`.
  - Computes and persists deterministic task metrics into `scores` table.
- **Response (200 OK):** Updated `StageRunResponse`.

---

### 3.3 Get Question Bank (Server-Side Correct Answers)
- **Endpoint:** `GET /api/questions/{stage_name}?age={age}`
- **Query Parameters:** `age` (e.g. `7`), determines age-band (`5_7`, `8_12`, `13plus`).
- **Security Rule:** Correct answer keys are **never** returned to the client. Correct answers remain strictly server-side.
- **Response (200 OK):**
  ```json
  {
    "stage_name": "dyslexia",
    "age_band": "5_7",
    "questions": [
      {
        "id": "dys_5_7_01",
        "category": "letter_confusion",
        "prompt_text": "Which letter makes the 'b' sound in ball?",
        "audio_url": "/stimuli/audio/dys_5_7_01.mp3",
        "options": [
          {"id": "a", "label": "d"},
          {"id": "b", "label": "b"},
          {"id": "c", "label": "p"}
        ]
      }
    ]
  }
  ```

---

### 3.4 Submit an Answer
- **Endpoint:** `POST /api/sessions/{session_id}/answers`
- **Request Body (`application/json`):**
  ```json
  {
    "stage_name": "dyslexia",
    "question_id": "dys_5_7_01",
    "selected_option": "b",
    "response_time_ms": 2340,
    "metadata": {
      "hover_count": 2,
      "answer_changes": 0
    }
  }
  ```
  *(Frontend alias payload `{ "stage": "dyslexia", "question_id": "dys_5_7_01", "option_id": "b", "response_ms": 2340, "answer_changes": 1 }` is also accepted; `answer_changes` is preserved in `metadata.answer_changes`).*
- **Validation:** `response_time_ms` must be non-negative monotonic milliseconds. `is_correct` is determined server-side.
- **Response (201 Created):** `AnswerResponse` object with persisted timestamp and record ID.

---

### 3.5 Stimulus Block Marker
- **Endpoint:** `POST /api/sessions/{session_id}/block-marker`
- **Request Body (`application/json`):**
  ```json
  {
    "stage_name": "adhd",
    "block_index": 2,
    "block_name": "adhd_video_2",
    "event": "start",
    "timestamp_ms": 45000
  }
  ```
  *(Frontend format `{ "stage": "adhd", "block": "adhd_video_2", "event": "start", "t": 45000 }` is also accepted; preserves start/end event, block identifier, and timestamp without fabricating block index).*
- **Response (200 OK):** `{"status": "acknowledged", "session_id": "...", "block_name": "adhd_video_2"}`

---

### 3.6 Generate & Retrieve Report (Explanatory, Non-Diagnostic)
- **Generate:** `POST /api/sessions/{session_id}/report`
- **Retrieve:** `GET /api/sessions/{session_id}/report`
- **Behavior:**
  - Aggregates stored scores from the `scores` table and stored CV blocks from `cv_blocks`.
  - Prompts Gemma 4 to produce parent-friendly explanatory descriptions, strengths, and supportive learning suggestions.
  - Never ranks disability probability or outputs clinical risk percentages.
- **Response (200 OK):**
  ```json
  {
    "id": "report-uuid",
    "session_id": "session-uuid",
    "report_text": "Alex showed sustained attention during interactive game blocks...",
    "domains": [
      {
        "domain": "adhd",
        "indicator_level": "Moderate",
        "observed_summary": "Higher visual look-away frequency during low-stimulus sequences.",
        "task_metrics_summary": {"reaction_time_mean_ms": 680},
        "cv_metrics_summary": {"on_screen_gaze_ratio": 0.65}
      }
    ],
    "observations": [
      "Demonstrated steady focus during active game tasks."
    ],
    "recommendations": [
      "Incorporate structured visual pauses and movement breaks."
    ],
    "limitations": [
      "Webcam tracking encountered moderate lighting changes during Stage 1."
    ],
    "model_used": "gemma-4",
    "is_fallback": false,
    "disclaimer": "NeuroNudge is an exploratory screening prototype, NOT a clinically validated medical device...",
    "created_at": "2026-10-30T10:15:00.000000"
  }
  ```

---

## 4. Confirmed WebSocket Streaming Contract

### 4.1 Connection Details
- **URL:** `ws://localhost:8000/ws/stream/{session_id}?stage={stage_name}`
- **Protocol:** JSON messages over WebSocket. Binary framing is not used.
- **Connection Handshake:**
  - Verifies `session_id` in database. Rejects with close code `4404` if session is missing.
  - Verifies `stage_name` is one of `adhd`, `autism` (or camera calibration).

---

### 4.2 Client-to-Server Frame Packet
The agreed message format for webcam video frames is:
```json
{
  "t": 1730279000000,
  "block": "adhd_video_2",
  "frame": "data:image/jpeg;base64,..."
}
```
- **Field `t`**: Integer Unix epoch milliseconds (`Date.now()`).
- **Field `block`**: String identifier for the active stimulus block.
- **Field `frame`**: String containing a Base64 JPEG Data URL (`data:image/jpeg;base64,...`) or raw Base64 JPEG string.
- **Frame Rate Limit:** Recommended 5 to 10 FPS.
- **Max Frame Size:** Max 250 KB per frame (320x240 or 480x360 resolution recommended).
- **Malformed Frames Handling:** Malformed or corrupt frames are dropped server-side with a warning response; the WebSocket connection remains open.

---

### 4.3 Server-to-Client Telemetry & Tracking Feedback
Until computer vision evaluation is complete or when tracking is unavailable, **missing measurements are represented explicitly with `null` or `"unavailable"`**. Zero or false values are never fabricated.

Example feedback packet:
```json
{
  "face_found": null,
  "lighting": "unavailable",
  "gaze_on_screen": null,
  "tracking_quality": null,
  "coarse_gaze": null,
  "alert": null
}
```

When evaluated:
```json
{
  "face_found": true,
  "lighting": "ok",
  "gaze_on_screen": true,
  "tracking_quality": 0.94,
  "coarse_gaze": "center",
  "alert": null
}
```

When face tracking is lost:
```json
{
  "face_found": false,
  "lighting": "ok",
  "gaze_on_screen": null,
  "tracking_quality": 0.0,
  "coarse_gaze": null,
  "alert": "face_not_centered"
}
```

- **Backpressure Handling:** If server MediaPipe processing lags behind client frame rate, intermediate queued frames are dropped to avoid latency buffering.

---

## 5. Shared Pydantic Schemas Summary

| Module | Key Models | Purpose |
| :--- | :--- | :--- |
| `schemas/session.py` | `SessionCreate`, `SessionResponse`, `SessionUpdate` | Session lifecycle & age/consent validation |
| `schemas/stage.py` | `StageRunCreate`, `StageRunResponse`, `StageRunUpdate` | Stage tracking & duration storage |
| `schemas/answers.py` | `QuestionItem`, `QuestionBankResponse`, `AnswerSubmit`, `AnswerResponse` | Question delivery (keys excluded) & answer submission |
| `schemas/metrics.py` | `FramePacket`, `TrackingFeedback`, `BlockMarkerCreate`, `CVBlockMetrics`, `GazeData`, `BlinkData` | WebSocket telemetry & aggregated CV metrics |
| `schemas/report.py` | `DomainIndicator`, `ReportResponse`, `ReportCreate` | Non-diagnostic reports, observations, recommendations |
