# Local AI Voice Transcript App

A full-stack local AI application for recording, uploading, transcribing, cleaning, and rewriting speech or pasted text using entirely local AI models.

The application combines:

- **React + TypeScript + Vite** for the frontend
- **FastAPI** for the backend API
- **faster-whisper** for local speech-to-text transcription
- **Ollama** for local LLM-based transcript cleaning and rewriting
- **Docker / Docker Compose** for containerized deployment
- **Nginx** for serving the production frontend

The project is designed so that audio transcription and text cleanup can run locally without sending transcript data to an external AI API.

---

# Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Application Flow](#application-flow)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Frontend](#frontend)
- [Backend](#backend)
- [Whisper Transcription](#whisper-transcription)
- [Ollama Text Processing](#ollama-text-processing)
- [Prompt Modes](#prompt-modes)
- [API](#api)
- [Configuration](#configuration)
- [Requirements](#requirements)
- [Local Development](#local-development)
- [Ollama Setup](#ollama-setup)
- [Whisper Setup](#whisper-setup)
- [Running the Application Locally](#running-the-application-locally)
- [Docker](#docker)
- [Docker Architecture](#docker-architecture)
- [Docker Model Persistence](#docker-model-persistence)
- [Testing](#testing)
- [Validation and Error Handling](#validation-and-error-handling)
- [Supported Audio Formats](#supported-audio-formats)
- [Security and Privacy](#security-and-privacy)
- [Troubleshooting](#troubleshooting)
- [Future Improvements](#future-improvements)

---

# Overview

Local AI Voice Transcript App allows a user to provide content in three different ways:

1. Record audio directly in the browser
2. Upload an existing audio file
3. Paste transcript text manually

Audio is transcribed locally using Whisper.

The resulting text can optionally be sent to a locally running Ollama model for cleanup, rewriting, formatting, or summarization.

The application returns both:

- the original transcript
- the cleaned transcript

This makes it possible to compare the raw transcription with the AI-processed result.

---

# Features

## Audio Recording

Record audio directly from the browser using the microphone.

The recorded audio can then be sent to the backend for transcription.

---

## Audio Upload

Upload an existing audio file and process it through Whisper.

Supported formats currently include:

- MP3
- WAV
- M4A
- WebM
- OGG
- MP4

---

## Pasted Text Processing

Instead of using audio, users can paste existing transcript text directly into the application.

The text is sent to:

```text
POST /text/process
````

and optionally cleaned using Ollama.

---

## Local Whisper Transcription

Audio is transcribed with:

```text
faster-whisper
```

The current default model is:

```text
base
```

The model is configurable through environment variables.

---

## Local Ollama Processing

Transcript cleanup is performed by a local Ollama model.

The current default model is:

```text
llama3.2
```

The application does not require an external cloud LLM API for transcript cleaning.

---

## Optional LLM Cleaning

Users can disable LLM cleanup.

When:

```text
clean_with_llm = false
```

the backend skips Ollama completely.

For pasted text:

```text
original_text = input text
cleaned_text = input text
```

For audio:

```text
audio
 ↓
Whisper
 ↓
original_text
 ↓
cleaned_text = original_text
```

---

## Multiple Prompt Modes

The frontend currently supports three processing modes:

* Default
* Formal
* Short

Each mode maps to a different backend system prompt.

---

## Local-first Design

The core AI processing can run locally:

```text
Audio
 ↓
Whisper
 ↓
Transcript
 ↓
Ollama
 ↓
Cleaned Transcript
```

This reduces dependency on external AI APIs and keeps processing under the user's control.

---

# Architecture

The high-level architecture is:

```text
┌─────────────────────────────┐
│          Browser            │
│                             │
│   React + TypeScript + Vite │
└──────────────┬──────────────┘
               │
               │ HTTP
               ▼
┌─────────────────────────────┐
│          FastAPI            │
│                             │
│  /text/process              │
│  /audio/process             │
│  /health                    │
└──────────┬─────────┬────────┘
           │         │
           │         │
           ▼         ▼
┌───────────────┐  ┌───────────────┐
│ faster-whisper│  │    Ollama     │
│               │  │               │
│ Speech → Text │  │ Text → Text   │
└───────────────┘  └───────────────┘
```

---

# Application Flow

## Text Processing Flow

```text
React
  ↓
POST /text/process
  ↓
FastAPI
  ↓
clean_with_llm?
  │
  ├── false
  │     ↓
  │   return original text
  │
  └── true
        ↓
      Ollama
        ↓
   cleaned_text
        ↓
      React
```

---

## Audio Processing Flow

```text
Audio File / Browser Recording
             ↓
           React
             ↓
     POST /audio/process
             ↓
          FastAPI
             ↓
       Temporary File
             ↓
      faster-whisper
             ↓
     Original Transcript
             ↓
      clean_with_llm?
         │
         ├── false
         │     ↓
         │ return transcript
         │
         └── true
                ↓
              Ollama
                ↓
        Cleaned Transcript
                ↓
              React
```

---

# Technology Stack

## Frontend

* React
* TypeScript
* Vite
* Browser MediaRecorder API
* Fetch API
* CSS
* Nginx for production Docker serving

---

## Backend

* Python
* FastAPI
* Pydantic
* Uvicorn
* HTTPX
* python-multipart
* python-dotenv

---

## AI

### Speech-to-text

```text
faster-whisper
```

which uses CTranslate2 for optimized Whisper inference.

### Text processing

```text
Ollama
```

Default model:

```text
llama3.2
```

---

## Infrastructure

* Docker
* Docker Compose
* Nginx
* Persistent Docker volumes

---

# Project Structure

The project is organized approximately as follows:

```text
local-ai-voice-transcript-app/
│
├── backend/
│   │
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── prompts.py
│   │   │
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── text.py
│   │   │   └── audio.py
│   │   │
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   └── transcription.py
│   │   │
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── ollama_service.py
│   │   │   └── transcription_service.py
│   │   │
│   │   └── utils/
│   │       ├── __init__.py
│   │       └── ollama_errors.py
│   │
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_health.py
│   │   ├── test_text.py
│   │   └── test_audio.py
│   │
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── .env
│   └── .env.example
│
├── frontend/
│   │
│   ├── src/
│   │   ├── components/
│   │   │   ├── RecordingWave.tsx
│   │   │   ├── RecordVoiceCard.tsx
│   │   │   ├── UploadAudioCard.tsx
│   │   │   ├── TranscriptInputCard.tsx
│   │   │   ├── SettingsCard.tsx
│   │   │   ├── ProcessSection.tsx
│   │   │   ├── OriginalTranscriptCard.tsx
│   │   │   └── CleanedTranscriptCard.tsx
│   │   │
│   │   ├── services/
│   │   │   └── api.ts
│   │   │
│   │   ├── App.tsx
│   │   ├── types.ts
│   │   └── ...
│   │
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── .env
│   └── .env.example
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

# Frontend

The frontend handles:

* microphone recording
* drag-and-drop audio upload
* pasted transcript input
* selection of processing mode
* enabling/disabling LLM cleaning
* loading states
* backend error display
* original transcript rendering
* cleaned transcript rendering

---

## Input Sources

The application supports three mutually exclusive input sources:

```typescript
type InputSource =
  | "record"
  | "upload"
  | "text"
  | null;
```

This prevents multiple input modes from being active simultaneously.

For example:

```text
Recording selected
→ upload disabled
→ text input disabled
```

and:

```text
Text entered
→ recording disabled
→ upload disabled
```

---

# Backend

FastAPI provides the API layer between the frontend and the local AI services.

The backend is divided into:

```text
routers/
services/
schemas/
utils/
config.py
```

This avoids putting the entire application inside `main.py`.

---

## main.py

`main.py` is responsible primarily for:

* creating the FastAPI application
* CORS configuration
* registering routers
* exposing the health endpoint

Application-specific processing logic is kept outside this file.

---

## Routers

### text.py

Handles:

```text
POST /text/process
```

Responsibilities include:

* request validation
* determining whether LLM processing is enabled
* selecting the appropriate prompt
* calling the Ollama service
* returning a `ProcessResponse`

---

### audio.py

Handles:

```text
POST /audio/process
```

Responsibilities include:

* validating file extension
* validating file size
* validating empty uploads
* creating a temporary audio file
* running Whisper
* checking transcription output
* optionally running Ollama
* cleaning temporary files
* returning the result

---

# Whisper Transcription

The application uses:

```text
faster-whisper
```

instead of the original Whisper Python package.

The transcription service is located at:

```text
backend/app/services/transcription_service.py
```

The model is initialized once and reused for requests.

Example configuration:

```text
WHISPER_MODEL=base
WHISPER_DEVICE=cpu
WHISPER_COMPUTE_TYPE=int8
```

---

## Why faster-whisper?

faster-whisper uses CTranslate2 and is designed for efficient Whisper inference.

It works well for local transcription workloads and can run on CPU.

---

## Current Whisper Configuration

Default:

```text
Model: base
Device: CPU
Compute type: int8
```

These values can be changed through environment variables.

---

# Ollama Text Processing

Ollama is responsible for cleaning or rewriting transcript text.

The service is located at:

```text
backend/app/services/ollama_service.py
```

The backend sends an Ollama Chat API request containing:

```json
{
  "model": "llama3.2",
  "stream": false,
  "messages": [
    {
      "role": "system",
      "content": "..."
    },
    {
      "role": "user",
      "content": "..."
    }
  ]
}
```

The resulting model response becomes:

```text
cleaned_text
```

---

# Prompt Modes

Prompt definitions are stored in:

```text
backend/app/prompts.py
```

---

## Default

Designed to clean transcript text without changing its meaning.

Example:

```python
"default": (
    "Clean the transcript without changing its meaning. "
    "Remove filler words such as 'um', 'uh', and repeated false starts. "
    "Fix grammar, punctuation, and capitalization. "
    "Preserve every factual claim from the original transcript. "
    "Do not infer, summarize, embellish, or add any information that was not explicitly stated. "
    "Return only the cleaned transcript. "
    "Do not include introductions, explanations, labels, quotes, or commentary."
)
```

---

## Formal

Rewrites transcript text in a more formal and professional style.

Important requirements:

* preserve meaning
* preserve factual claims
* remove filler
* improve grammar
* do not invent information
* return only processed transcript text

---

## Short

Creates a concise version while attempting to preserve the important factual content.

It removes:

* filler
* unnecessary repetition
* unnecessary wording

It should not add information that was not present in the original transcript.

---

# API

The backend exposes the following main endpoints.

---

## Health

```http
GET /health
```

Response:

```json
{
  "status": "ok"
}
```

Used by:

* developers
* Docker health checks
* deployment monitoring

---

# Process Text

```http
POST /text/process
```

Content type:

```text
application/json
```

Example request:

```json
{
  "text": "um i think maybe we should start tomorrow",
  "clean_with_llm": true,
  "system_prompt": "default"
}
```

Example response:

```json
{
  "source": "text",
  "original_text": "um i think maybe we should start tomorrow",
  "cleaned_text": "I think we should start tomorrow.",
  "clean_with_llm": true,
  "system_prompt": "default",
  "audio": null
}
```

---

# Process Audio

```http
POST /audio/process
```

Content type:

```text
multipart/form-data
```

Fields:

```text
file
clean_with_llm
system_prompt
```

Example result:

```json
{
  "source": "audio",
  "original_text": "This is the transcription produced by Whisper.",
  "cleaned_text": "This is the transcription produced by Whisper.",
  "clean_with_llm": false,
  "system_prompt": "default",
  "audio": {
    "filename": "recording.webm",
    "content_type": "audio/webm"
  }
}
```

When LLM cleaning is enabled:

```text
Audio
 ↓
Whisper
 ↓
original_text
 ↓
Ollama
 ↓
cleaned_text
```

---

# Shared Response Contract

Both text and audio processing use the same response structure.

Conceptually:

```typescript
type ProcessResponse = {
  source: "text" | "audio";
  original_text: string;
  cleaned_text: string;
  clean_with_llm: boolean;
  system_prompt: string;
  audio: AudioMetadata | null;
};
```

This simplifies frontend handling.

Both paths can use:

```typescript
setTranscriptText(result.original_text);
setCleanedTranscript(result.cleaned_text);
```

---

# Configuration

Configuration is controlled through environment variables.

---

## Frontend

File:

```text
frontend/.env
```

Example:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

---

## Backend

File:

```text
backend/.env
```

Example:

```env
OLLAMA_URL=http://127.0.0.1:11434/api/chat
OLLAMA_MODEL=llama3.2

WHISPER_MODEL=base
WHISPER_DEVICE=cpu
WHISPER_COMPUTE_TYPE=int8

MAX_AUDIO_SIZE_BYTES=26214400
```

---

## VITE_API_BASE_URL

Defines where the React frontend sends API requests.

Local development:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

---

## OLLAMA_URL

Defines the Ollama Chat API endpoint.

Local:

```env
OLLAMA_URL=http://127.0.0.1:11434/api/chat
```

Docker:

```env
OLLAMA_URL=http://ollama:11434/api/chat
```

---

## OLLAMA_MODEL

Defines the local LLM.

Example:

```env
OLLAMA_MODEL=llama3.2
```

---

## WHISPER_MODEL

Defines the faster-whisper model.

Example:

```env
WHISPER_MODEL=base
```

Other Whisper models may also be used depending on hardware and accuracy requirements.

---

## WHISPER_DEVICE

Default:

```env
WHISPER_DEVICE=cpu
```

---

## WHISPER_COMPUTE_TYPE

Default:

```env
WHISPER_COMPUTE_TYPE=int8
```

This is appropriate for CPU-oriented local inference.

---

## MAX_AUDIO_SIZE_BYTES

Current default:

```env
MAX_AUDIO_SIZE_BYTES=26214400
```

which corresponds to:

```text
25 MB
```

---

# .env.example

Real `.env` files should normally not be committed to Git.

Instead, the repository includes example configuration files.

---

## backend/.env.example

```env
OLLAMA_URL=http://127.0.0.1:11434/api/chat
OLLAMA_MODEL=llama3.2

WHISPER_MODEL=base
WHISPER_DEVICE=cpu
WHISPER_COMPUTE_TYPE=int8

MAX_AUDIO_SIZE_BYTES=26214400
```

---

## frontend/.env.example

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Create local copies with:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

---

# Requirements

For normal local development:

* Git
* Python 3.11+
* Node.js 20+
* npm
* Ollama

For Docker deployment:

* Docker Desktop or Docker Engine
* Docker Compose

---

# Local Development

Clone the repository:

```bash
git clone <repository-url>
```

Enter the directory:

```bash
cd local-ai-voice-transcript-app
```

---

# Backend Installation

Enter the backend directory:

```bash
cd backend
```

Create a virtual environment:

```bash
python3 -m venv .venv
```

Activate it on macOS/Linux:

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
python -m pip install -r requirements.txt
```

Create the environment file:

```bash
cp .env.example .env
```

Start FastAPI:

```bash
uvicorn app.main:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

Swagger documentation:

```text
http://127.0.0.1:8000/docs
```

Health endpoint:

```text
http://127.0.0.1:8000/health
```

---

# Frontend Installation

Open another terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create the local environment file:

```bash
cp .env.example .env
```

Start Vite:

```bash
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

# Ollama Setup

Install Ollama for your operating system.

Verify:

```bash
ollama --version
```

---

## Download the model

The default model is:

```text
llama3.2
```

Pull it with:

```bash
ollama pull llama3.2
```

Verify:

```bash
ollama list
```

Example:

```text
NAME                SIZE
llama3.2:latest     2.0 GB
```

---

## Verify the Ollama API

Run:

```bash
curl http://127.0.0.1:11434/api/tags
```

You should receive JSON containing installed models.

---

## Starting Ollama

Depending on the operating system and installation, Ollama may already be running in the background.

If required:

```bash
ollama serve
```

If you see:

```text
bind: address already in use
```

that usually means Ollama is already running on port:

```text
11434
```

---

# Whisper Setup

Whisper is installed through the Python dependencies:

```text
faster-whisper
```

The current model is configured as:

```env
WHISPER_MODEL=base
```

The first time faster-whisper initializes a model, the required model files may need to be downloaded.

---

# Running the Application Locally

You typically need three processes.

---

## Terminal 1 — Ollama

Make sure Ollama is running.

Verify:

```bash
curl http://127.0.0.1:11434/api/tags
```

---

## Terminal 2 — Backend

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload
```

---

## Terminal 3 — Frontend

```bash
cd frontend
npm run dev
```

Then open:

```text
http://localhost:5173
```

---

# Docker

The project includes Docker support for:

* frontend
* backend
* Ollama

Docker Compose manages all services together.

---

# Backend Dockerfile

The backend uses a Python slim image.

Conceptually:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

EXPOSE 8000

CMD [
  "uvicorn",
  "app.main:app",
  "--host",
  "0.0.0.0",
  "--port",
  "8000"
]
```

---

# Frontend Dockerfile

The frontend uses a multi-stage build.

Stage 1:

```text
Node
 ↓
npm install
 ↓
Vite production build
```

Stage 2:

```text
Nginx
 ↓
serve /dist
```

The API URL is provided as a Vite build argument.

---

# Docker Architecture

The Docker deployment looks like:

```text
Browser
   │
   │ :5173
   ▼
┌───────────────────┐
│ Frontend Container│
│      Nginx        │
└─────────┬─────────┘
          │
          │ :8000
          ▼
┌───────────────────┐
│ Backend Container │
│      FastAPI      │
│                   │
│  faster-whisper   │
└─────────┬─────────┘
          │
          │ Docker network
          ▼
┌───────────────────┐
│ Ollama Container  │
│    llama3.2       │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Persistent Volume │
│   Ollama Models   │
└───────────────────┘
```

---

# Docker Compose

The Compose configuration contains approximately:

```yaml
services:
  ollama:
    image: ollama/ollama:latest
    container_name: transcript-ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    restart: unless-stopped

  backend:
    build:
      context: ./backend
    container_name: transcript-backend
    ports:
      - "8000:8000"
    environment:
      OLLAMA_URL: http://ollama:11434/api/chat
      OLLAMA_MODEL: llama3.2
      WHISPER_MODEL: base
      WHISPER_DEVICE: cpu
      WHISPER_COMPUTE_TYPE: int8
      MAX_AUDIO_SIZE_BYTES: 26214400
    depends_on:
      - ollama

  frontend:
    build:
      context: ./frontend
      args:
        VITE_API_BASE_URL: http://localhost:8000
    container_name: transcript-frontend
    ports:
      - "5173:80"
    depends_on:
      backend:
        condition: service_healthy

volumes:
  ollama_data:
```

---

# Starting with Docker

From the project root:

```bash
docker compose up --build -d
```

Check running containers:

```bash
docker compose ps
```

View logs:

```bash
docker compose logs -f
```

---

# Download Ollama Model in Docker

The Ollama container does not automatically contain `llama3.2`.

The first time, run:

```bash
docker compose exec ollama ollama pull llama3.2
```

Verify:

```bash
docker compose exec ollama ollama list
```

After the model is downloaded once, the Docker volume preserves it.

---

# Docker Model Persistence

Compose defines:

```yaml
volumes:
  ollama_data:
```

and mounts:

```yaml
ollama_data:/root/.ollama
```

Therefore the model survives normal container recreation.

For example:

```bash
docker compose down
docker compose up -d
```

does not require downloading `llama3.2` again.

Be aware that explicitly deleting the volume removes the model data.

---

# Rebuilding Docker After Code Changes

With the current production-style Docker setup, application source is copied into the Docker image.

Therefore changes to backend Python files require rebuilding:

```bash
docker compose up --build -d
```

The same applies to frontend source code.

For faster development, the project could later add development-specific Docker volumes and Uvicorn reload mode.

---

# Docker Health Check

The backend provides:

```text
GET /health
```

Docker Compose can verify it with a health check.

Example:

```yaml
healthcheck:
  test:
    [
      "CMD",
      "python",
      "-c",
      "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health')"
    ]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 20s
```

The frontend can then wait for the backend health status before starting.

---

# Testing

Backend tests use:

```text
pytest
```

and FastAPI's:

```text
TestClient
```

---

## Install test dependencies

Make sure the active virtual environment contains the dependencies:

```bash
python -m pip install -r requirements.txt
```

---

## Run backend tests

From:

```text
backend/
```

run:

```bash
python -m pytest
```

Using:

```bash
python -m pytest
```

instead of simply:

```bash
pytest
```

helps ensure pytest uses the Python interpreter from the currently active virtual environment.

---

## Health Test

Example:

```python
from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health_check():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
```

---

## Planned API Tests

Tests should cover:

### Text

* valid text without LLM
* valid text with mocked Ollama
* blank input
* whitespace-only input
* Ollama unavailable
* Ollama timeout
* Ollama model missing

### Audio

* valid audio
* empty audio
* unsupported extension
* file over size limit
* corrupt audio
* no speech detected
* Whisper failure
* Ollama failure after transcription

AI services should normally be mocked in API unit tests so tests do not require downloading or running real models.

---

# Validation and Error Handling

The API performs validation before expensive AI processing.

---

## Empty Text

Empty text is rejected.

For whitespace-only input:

```text
"   "
```

the API returns an error instead of sending it to Ollama.

---

## Empty Audio

Zero-byte uploads are rejected.

---

## Maximum Audio Size

Default:

```text
25 MB
```

Oversized files return:

```text
HTTP 413
```

---

## Unsupported Format

Unsupported extensions return:

```text
HTTP 400
```

---

## Corrupt Audio

If Whisper cannot decode or transcribe an audio file:

```text
HTTP 422
```

Example message:

```json
{
  "detail": "The audio file could not be transcribed. It may be corrupt or unsupported."
}
```

---

## No Speech

If Whisper returns no meaningful transcript:

```text
HTTP 422
```

Example:

```json
{
  "detail": "No speech could be detected in the audio file."
}
```

---

## Ollama Unavailable

If FastAPI cannot connect to Ollama:

```text
HTTP 503
```

Example:

```json
{
  "detail": "Ollama is not running or cannot be reached."
}
```

---

## Ollama Model Missing

If the configured model is unavailable:

```text
HTTP 503
```

---

## Ollama Timeout

If the request takes too long:

```text
HTTP 504
```

---

## Invalid Ollama Response

Unexpected Ollama responses map to:

```text
HTTP 502
```

---

# Supported Audio Formats

Currently:

```text
.mp3
.wav
.m4a
.webm
.ogg
.mp4
```

The backend currently validates file extensions before transcription.

---

# Temporary Files

Uploaded audio is written to a temporary file before Whisper processing.

Conceptually:

```text
UploadFile
   ↓
read bytes
   ↓
validate
   ↓
temporary file
   ↓
Whisper
   ↓
delete temporary file
```

Temporary files are removed using a `finally` block so cleanup occurs even when processing fails.

---

# Privacy

The project is designed for local AI processing.

When used with local Whisper and local Ollama:

```text
Audio
 ↓
local backend
 ↓
local Whisper
 ↓
local Ollama
```

No external AI API is required for the core transcription and cleaning process.

However, users should still review:

* model download behavior
* Docker networking
* operating-system telemetry
* deployment infrastructure

before making strict privacy guarantees in production environments.

---

# Error UX

The frontend displays backend errors returned by FastAPI.

Examples include:

```text
Unsupported audio format.
```

```text
Audio file is too large.
```

```text
No speech could be detected in the audio file.
```

```text
Ollama is not running or cannot be reached.
```

This provides more useful feedback than a generic processing error.

---

# Development Notes

## Vite environment variables

Vite environment variables beginning with:

```text
VITE_
```

are embedded into the frontend during the build.

Therefore:

```text
VITE_API_BASE_URL
```

is a build-time value in the production Docker image.

Changing it may require rebuilding the frontend image.

---

## Local vs Docker Ollama URL

Local backend:

```text
http://127.0.0.1:11434/api/chat
```

Docker backend with an Ollama Compose service:

```text
http://ollama:11434/api/chat
```

Inside Docker, `127.0.0.1` refers to the current container itself.

Containers communicate with one another using Compose service names.

---

# Common Commands

## Backend

Activate environment:

```bash
cd backend
source .venv/bin/activate
```

Install:

```bash
python -m pip install -r requirements.txt
```

Run:

```bash
uvicorn app.main:app --reload
```

Test:

```bash
python -m pytest
```

---

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Production build:

```bash
npm run build
```

---

## Ollama

List models:

```bash
ollama list
```

Pull model:

```bash
ollama pull llama3.2
```

Run interactively:

```bash
ollama run llama3.2
```

Check API:

```bash
curl http://127.0.0.1:11434/api/tags
```

---

## Docker

Build and start:

```bash
docker compose up --build -d
```

View containers:

```bash
docker compose ps
```

View logs:

```bash
docker compose logs -f
```

Stop:

```bash
docker compose down
```

Rebuild after source changes:

```bash
docker compose up --build -d
```

Pull Ollama model:

```bash
docker compose exec ollama ollama pull llama3.2
```

List Docker Ollama models:

```bash
docker compose exec ollama ollama list
```

---

# Troubleshooting

## `docker: command not found`

Docker is not installed or the CLI is not available.

On macOS, install and start Docker Desktop.

Verify:

```bash
docker --version
docker compose version
```

---

## Ollama cannot be reached

Check whether Ollama is running:

```bash
curl http://127.0.0.1:11434/api/tags
```

For Docker Compose, make sure the backend uses:

```text
http://ollama:11434/api/chat
```

when Ollama itself is running as a Compose service.

---

## `bind: address already in use`

Example:

```text
listen tcp 127.0.0.1:11434: bind: address already in use
```

Usually this means Ollama is already running.

Check:

```bash
curl http://127.0.0.1:11434/api/tags
```

---

## Ollama model missing

Check:

```bash
ollama list
```

or in Docker:

```bash
docker compose exec ollama ollama list
```

Install:

```bash
ollama pull llama3.2
```

or:

```bash
docker compose exec ollama ollama pull llama3.2
```

---

## `pytest` cannot find FastAPI

Check:

```bash
which python
which pip
which pytest
```

Make sure dependencies are installed in the virtual environment:

```bash
python -m pip install -r requirements.txt
```

Run tests with:

```bash
python -m pytest
```

This ensures pytest runs using the same Python interpreter as the backend.

---

## Docker changes are not appearing

The current Dockerfiles copy source code into images.

After changing `.py`, `.tsx`, `.ts`, CSS, or similar application files:

```bash
docker compose up --build -d
```

---

# Future Improvements

Possible future improvements include:

## Testing

* full text endpoint tests
* mocked Ollama tests
* mocked Whisper tests
* audio validation tests
* frontend component tests
* end-to-end browser tests

---

## Frontend UX

* success notifications
* better progress indicators
* separate transcription and cleaning progress
* processing stages
* retry actions
* copy transcript button
* download transcript button
* reset workflow
* transcription history

---

## Audio

* duration limit
* MIME validation in addition to file extension
* improved recording visualization
* audio preprocessing
* silence detection
* language selection
* Whisper language detection display
* timestamps
* speaker diarization

---

## AI

* selectable Ollama models
* custom system prompts
* temperature configuration
* prompt presets
* transcript translation
* structured meeting-note extraction
* summaries
* action item extraction
* title generation

---

## Infrastructure

* development Docker Compose configuration
* source volume mounting
* automatic backend reload
* automatic frontend hot reload
* automatic Ollama model initialization
* GPU-aware Docker configurations
* production reverse proxy
* HTTPS
* deployment documentation

---

## API

* API versioning
* structured error response schemas
* request IDs
* centralized logging
* rate limits
* upload streaming
* model readiness endpoints

---

# Current Processing Summary

The finished application pipeline currently looks like:

```text
                       ┌───────────────┐
                       │     React     │
                       └───────┬───────┘
                               │
              ┌────────────────┴────────────────┐
              │                                 │
              ▼                                 ▼
       Pasted Transcript                  Audio Input
              │                                 │
              ▼                                 ▼
      POST /text/process               POST /audio/process
              │                                 │
              │                                 ▼
              │                         faster-whisper
              │                                 │
              │                                 ▼
              │                         Original Transcript
              │                                 │
              └───────────────┬─────────────────┘
                              │
                              ▼
                       clean_with_llm?
                         │         │
                       false      true
                         │         │
                         │         ▼
                         │       Ollama
                         │         │
                         └────┬────┘
                              │
                              ▼
                       ProcessResponse
                              │
                              ▼
                            React
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
            Original Transcript   Cleaned Transcript
```

---

# Project Goal

The main goal of this project is to demonstrate a complete local AI application that combines:

```text
browser audio recording
+
file upload
+
speech-to-text
+
local LLM processing
+
FastAPI
+
React
+
Docker
```

while maintaining a clean architecture and keeping AI processing local.

It is intended both as a practical transcription application and as an example of how modern local AI tools such as Whisper and Ollama can be integrated into a conventional full-stack web application.

```

One small note: the README above lists `test_text.py` and `test_audio.py` in the intended test structure, but based on where we are in the implementation, only the health test has definitely been completed so far. If those two test files do not exist yet, either remove them from the tree temporarily or keep them only after we implement the next test steps.
```
