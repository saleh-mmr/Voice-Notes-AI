# Voice Notes AI

A local AI-powered voice transcription application built with React, TypeScript, FastAPI, Faster-Whisper, and Ollama.

Voice Notes AI lets you record audio, upload audio files, or paste existing text. Audio is transcribed locally with Faster-Whisper and can optionally be cleaned and rewritten by a local Ollama language model.

The application can run locally during development or as a complete Docker Compose stack.

---

## Table of Contents

- [Features](#features)
  - [Voice recording](#voice-recording)
  - [Audio upload](#audio-upload)
  - [Paste existing transcripts](#paste-existing-transcripts)
  - [Local speech-to-text](#local-speech-to-text)
  - [Local AI text cleanup](#local-ai-text-cleanup)
  - [Optional AI cleanup](#optional-ai-cleanup)
  - [Original and cleaned transcript](#original-and-cleaned-transcript)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Option 1 — Docker Compose](#option-1--docker-compose)
  - [Requirements](#requirements)
  - [Clone the repository](#clone-the-repository)
  - [Build the containers](#build-the-containers)
  - [Start the application](#start-the-application)
  - [Install the Ollama model](#install-the-ollama-model)
  - [Open the application](#open-the-application)
  - [Check container status](#check-container-status)
  - [View logs](#view-logs)
  - [Stop the application](#stop-the-application)
- [Option 2 — Local Development](#option-2--local-development)
  - [Backend Setup](#backend-setup)
  - [Ollama Setup](#ollama-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
  - [Frontend](#frontend)
  - [Backend](#backend)
  - [OLLAMA_URL](#ollama_url)
  - [OLLAMA_MODEL](#ollama_model)
  - [WHISPER_MODEL](#whisper_model)
  - [WHISPER_DEVICE](#whisper_device)
  - [WHISPER_COMPUTE_TYPE](#whisper_compute_type)
  - [MAX_AUDIO_SIZE_BYTES](#max_audio_size_bytes)
- [API](#api)
  - [Health Check](#health-check)
  - [Process Text](#process-text)
  - [Process Audio](#process-audio)
- [Validation](#validation)
- [Error Handling](#error-handling)
- [Testing](#testing)
  - [Backend Tests](#backend-tests)
  - [Frontend Tests](#frontend-tests)
- [Frontend Quality Checks](#frontend-quality-checks)
- [Continuous Integration](#continuous-integration)
  - [Backend CI](#backend-ci)
  - [Frontend CI](#frontend-ci)
- [Docker Architecture](#docker-architecture)
- [Docker Services](#docker-services)
  - [Ollama](#ollama)
  - [Backend](#backend-1)
  - [Frontend](#frontend-1)
- [Production Frontend Build](#production-frontend-build)
- [Privacy](#privacy)
- [Troubleshooting](#troubleshooting)
  - [Ollama is not running](#ollama-is-not-running)
  - [Ollama model is missing](#ollama-model-is-missing)
  - [Backend container is unhealthy](#backend-container-is-unhealthy)
  - [Frontend cannot reach backend](#frontend-cannot-reach-backend)
  - [Rebuild containers after source changes](#rebuild-containers-after-source-changes)
- [Useful Commands](#useful-commands)
- [Current Project Status](#current-project-status)
- [Future Improvements](#future-improvements)
- [Development Workflow](#development-workflow)
- [Summary](#summary)

## Features

### Voice recording

Record audio directly from the browser using the microphone.

The application uses the browser `MediaRecorder` API and converts recorded audio into a file that can be sent through the same backend processing pipeline as uploaded audio.

You can also hold the `V` key to start recording and release it to stop recording.

---

### Audio upload

Upload supported audio files through the interface.

The upload area supports:

- file selection
- drag and drop
- file validation
- audio preview
- replacing uploaded audio
- removing uploaded audio

Supported formats:

```text
.mp3
.wav
.m4a
.webm
.ogg
.mp4
```

Maximum upload size:

```text
25 MB
```

---

### Paste existing transcripts

Instead of using audio, you can paste text directly into the application and send it to the backend for optional AI cleanup.

---

### Local speech-to-text

Audio transcription is performed with:

```text
Faster-Whisper
```

The default configuration uses:

```text
Model: base
Device: CPU
Compute type: int8
```

These values are configurable through environment variables.

---

### Local AI text cleanup

Transcript cleanup is performed locally using:

```text
Ollama
```

Default model:

```text
llama3.2
```

The app supports three prompt modes:

```text
default
formal
short
```

#### Default

Cleans grammar, punctuation, capitalization, filler words, and false starts while preserving the original meaning.

#### Formal

Rewrites the transcript in a more professional and formal style while preserving the original facts and meaning.

#### Short

Makes the transcript more concise while preserving the important information.

---

### Optional AI cleanup

AI cleanup can be disabled.

When disabled:

```text
Audio
  ↓
Whisper
  ↓
Transcript
```

When enabled:

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

For pasted text:

```text
Text
  ↓
Ollama
  ↓
Cleaned Text
```

---

### Original and cleaned transcript

The interface displays both:

- original transcription
- cleaned transcription

The cleaned transcript can also be copied from the UI.

---

## Tech Stack

### Frontend

- React 19
- TypeScript
- Vite
- Lucide React
- Vitest
- Testing Library
- oxlint
- Nginx for the production Docker image

### Backend

- Python
- FastAPI
- Uvicorn
- Pydantic
- HTTPX
- Faster-Whisper
- python-multipart

### AI

- Faster-Whisper for speech-to-text
- Ollama for local LLM inference
- `llama3.2` as the default LLM

### Infrastructure

- Docker
- Docker Compose
- GitHub Actions

---

## Architecture

```text
┌──────────────────────────────┐
│          Browser             │
│                              │
│ React + TypeScript + Vite    │
└──────────────┬───────────────┘
               │
               │ HTTP
               ▼
┌──────────────────────────────┐
│        FastAPI Backend       │
│                              │
│ /text/process                │
│ /audio/process               │
│ /health                      │
└───────────┬──────────┬───────┘
            │          │
            │          │
            ▼          ▼
   ┌──────────────┐  ┌──────────────┐
   │ Faster-      │  │    Ollama    │
   │ Whisper      │  │              │
   │              │  │ llama3.2     │
   │ Speech → Text│  │ Text cleanup │
   └──────────────┘  └──────────────┘
```

---

## Project Structure

```text
Voice-Notes-AI/
│
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── prompts.py
│   │   │
│   │   ├── routers/
│   │   │   ├── audio.py
│   │   │   └── text.py
│   │   │
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   └── transcription.py
│   │   │
│   │   ├── services/
│   │   │   ├── ollama_service.py
│   │   │   └── transcription_service.py
│   │   │
│   │   └── utils/
│   │       └── ollama_errors.py
│   │
│   ├── tests/
│   │   ├── test_audio.py
│   │   ├── test_health.py
│   │   └── test_text.py
│   │
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CleanedTranscriptCard.tsx
│   │   │   ├── OriginalTranscriptCard.tsx
│   │   │   ├── ProcessSection.tsx
│   │   │   ├── RecordingWave.tsx
│   │   │   ├── RecordVoiceCard.tsx
│   │   │   ├── SettingsCard.tsx
│   │   │   ├── TranscriptInputCard.tsx
│   │   │   └── UploadAudioCard.tsx
│   │   │
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   └── api.test.ts
│   │   │
│   │   ├── types/
│   │   │   └── api.ts
│   │   │
│   │   ├── App.tsx
│   │   ├── App.css
│   │   └── index.css
│   │
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── package.json
│   └── package-lock.json
│
├── docker-compose.yml
├── .gitignore
├── .env.example
└── README.md
```

---

# Getting Started

There are two ways to run the application:

1. Docker Compose
2. Local development

Docker Compose is the easiest way to run the complete stack.

---

# Option 1 — Docker Compose

## Requirements

Install:

- Docker
- Docker Compose

Verify:

```bash
docker --version
docker compose version
```

---

## Clone the repository

```bash
git clone git@github.com:saleh-mmr/Voice-Notes-AI.git
cd Voice-Notes-AI
```

---

## Build the containers

```bash
docker compose build
```

---

## Start the application

```bash
docker compose up
```

Or run it in the background:

```bash
docker compose up -d
```

Docker starts three services:

```text
transcript-frontend
transcript-backend
transcript-ollama
```

---

## Install the Ollama model

The first time the application runs, make sure the configured model exists inside the Ollama container.

Check installed models:

```bash
docker exec -it transcript-ollama ollama list
```

If `llama3.2` is not installed:

```bash
docker exec -it transcript-ollama ollama pull llama3.2
```

Verify again:

```bash
docker exec -it transcript-ollama ollama list
```

---

## Open the application

Frontend:

```text
http://localhost:5173
```

Backend:

```text
http://localhost:8000
```

FastAPI documentation:

```text
http://localhost:8000/docs
```

Health endpoint:

```text
http://localhost:8000/health
```

---

## Check container status

```bash
docker compose ps
```

The backend should eventually report:

```text
healthy
```

---

## View logs

All services:

```bash
docker compose logs -f
```

Backend:

```bash
docker compose logs -f backend
```

Frontend:

```bash
docker compose logs -f frontend
```

Ollama:

```bash
docker compose logs -f ollama
```

---

## Stop the application

```bash
docker compose down
```

The Ollama models are stored in a persistent Docker volume and are not removed by a normal `docker compose down`.

To also delete the volume:

```bash
docker compose down -v
```

Be aware that this also removes downloaded Ollama models.

---

# Option 2 — Local Development

## Requirements

Recommended development environment:

```text
Python 3.11+
Node.js 24 recommended
Ollama
```

Node.js 24 is used in CI for compatibility with the current Vitest/jsdom toolchain.

---

# Backend Setup

Move into the backend directory:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv .venv
```

Activate it.

### macOS / Linux

```bash
source .venv/bin/activate
```

### Windows

```bash
.venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start FastAPI:

```bash
uvicorn app.main:app --reload
```

The backend will run at:

```text
http://127.0.0.1:8000
```

---

# Ollama Setup

Install Ollama on your machine.

Then pull the default model:

```bash
ollama pull llama3.2
```

Check that it is available:

```bash
ollama list
```

Make sure Ollama is running before using AI cleanup.

The backend expects Ollama at:

```text
http://127.0.0.1:11434/api/chat
```

during local development.

---

# Frontend Setup

Open another terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start Vite:

```bash
npm run dev
```

The frontend will normally run at:

```text
http://localhost:5173
```

---

# Environment Variables

## Frontend

Create:

```text
frontend/.env
```

Example:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

An example file can also be stored as:

```text
frontend/.env.example
```

---

## Backend

The backend supports the following environment variables:

```env
OLLAMA_URL=http://127.0.0.1:11434/api/chat
OLLAMA_MODEL=llama3.2

WHISPER_MODEL=base
WHISPER_DEVICE=cpu
WHISPER_COMPUTE_TYPE=int8

MAX_AUDIO_SIZE_BYTES=26214400
```

### OLLAMA_URL

Address of the Ollama chat API.

Local:

```text
http://127.0.0.1:11434/api/chat
```

Docker:

```text
http://ollama:11434/api/chat
```

---

### OLLAMA_MODEL

Default:

```text
llama3.2
```

You can use another Ollama model by changing this value and downloading the corresponding model.

---

### WHISPER_MODEL

Default:

```text
base
```

Other Faster-Whisper models can be used if desired.

For example:

```text
tiny
small
medium
large-v3
```

Larger models generally require more memory and processing time.

---

### WHISPER_DEVICE

Default:

```text
cpu
```

---

### WHISPER_COMPUTE_TYPE

Default:

```text
int8
```

This is suitable for CPU inference.

---

### MAX_AUDIO_SIZE_BYTES

Default:

```text
26214400
```

which is:

```text
25 MB
```

---

# API

FastAPI automatically provides interactive documentation at:

```text
http://localhost:8000/docs
```

---

## Health Check

### Request

```http
GET /health
```

### Response

```json
{
  "status": "ok"
}
```

---

# Process Text

### Endpoint

```http
POST /text/process
```

### Request

```json
{
  "text": "um hello this is my transcript",
  "clean_with_llm": true,
  "system_prompt": "default"
}
```

Available prompt values:

```text
default
formal
short
```

### Example response

```json
{
  "source": "text",
  "original_text": "um hello this is my transcript",
  "cleaned_text": "Hello, this is my transcript.",
  "clean_with_llm": true,
  "system_prompt": "default",
  "audio": null
}
```

If AI cleanup is disabled:

```json
{
  "text": "hello world",
  "clean_with_llm": false,
  "system_prompt": "default"
}
```

the original text is returned as the cleaned text without contacting Ollama.

---

# Process Audio

### Endpoint

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

Example:

```text
file: recording.wav
clean_with_llm: true
system_prompt: default
```

### Example response

```json
{
  "source": "audio",
  "original_text": "Um this is a transcript.",
  "cleaned_text": "This is a transcript.",
  "clean_with_llm": true,
  "system_prompt": "default",
  "audio": {
    "filename": "recording.wav",
    "content_type": "audio/wav"
  }
}
```

---

# Validation

The backend validates incoming requests before processing them.

Examples include:

- unsupported audio formats
- empty audio files
- files larger than the configured limit
- corrupt or unreadable audio
- audio containing no detectable speech
- empty text input
- invalid prompt modes

Temporary audio files are deleted after processing.

---

# Error Handling

The API converts common Ollama failures into useful HTTP responses.

Examples include:

```text
503 - Ollama unavailable
503 - Ollama model not installed
504 - Ollama request timed out
502 - Invalid Ollama response
```

Audio transcription problems generally return:

```text
422
```

Validation failures return the appropriate `400`, `413`, or `422` response.

---

# Testing

The project contains automated backend and frontend tests.

AI services are mocked during normal automated tests, so the test suite does not require Ollama to be running or Whisper models to be downloaded.

---

## Backend Tests

From:

```text
backend/
```

run:

```bash
pytest -v
```

The current backend suite contains 17 tests.

It covers:

- health endpoint
- text processing without Ollama
- text processing with mocked Ollama
- empty and whitespace text validation
- Ollama unavailable errors
- missing Ollama model errors
- Ollama timeout errors
- invalid Ollama responses
- audio processing without AI cleanup
- audio processing with mocked Whisper and Ollama
- unsupported audio formats
- empty audio
- oversized audio
- transcription failures
- no speech detection
- Ollama failures during audio processing

---

## Frontend Tests

From:

```text
frontend/
```

run:

```bash
npm run test:run
```

The current frontend API service suite contains 4 tests covering:

- text processing success
- text API errors
- audio processing success
- audio API errors

For watch mode:

```bash
npm test
```

---

# Frontend Quality Checks

Run lint:

```bash
npm run lint
```

Build the production frontend:

```bash
npm run build
```

Run all frontend tests:

```bash
npm run test:run
```

---

# Continuous Integration

The repository uses GitHub Actions for continuous integration.

Workflow:

```text
.github/workflows/ci.yml
```

The workflow runs automatically on:

```text
pushes to main
pull requests
```

---

## Backend CI

The backend job:

1. checks out the repository
2. installs Python 3.11
3. installs backend dependencies
4. installs pytest
5. runs the backend test suite

Command:

```bash
pytest -v
```

---

## Frontend CI

The frontend job:

1. checks out the repository
2. installs Node.js 24
3. installs dependencies with `npm ci`
4. runs lint
5. builds the production frontend
6. runs the Vitest test suite

Commands:

```bash
npm ci
npm run lint
npm run build
npm run test:run
```

A successful CI run means both:

```text
Backend Tests   ✅
Frontend Checks ✅
```

have completed successfully.

---

# Docker Architecture

Docker Compose runs:

```text
Browser
   │
   ▼
Frontend container
Nginx :80
   │
   │ http://localhost:8000
   ▼
Backend container
FastAPI :8000
   │
   │ http://ollama:11434
   ▼
Ollama container
:11434
```

Host ports:

```text
Frontend: 5173
Backend:  8000
Ollama:   11434
```

---

# Docker Services

## Ollama

Container:

```text
transcript-ollama
```

Port:

```text
11434
```

Model data is persisted using:

```text
ollama_data
```

---

## Backend

Container:

```text
transcript-backend
```

Port:

```text
8000
```

The backend includes a Docker health check against:

```text
/health
```

---

## Frontend

Container:

```text
transcript-frontend
```

Host port:

```text
5173
```

Container port:

```text
80
```

The React application is built with Vite and served through Nginx.

---

# Production Frontend Build

The frontend Docker image uses a multi-stage build.

First stage:

```text
Node.js
   ↓
npm ci
   ↓
npm run build
```

Second stage:

```text
Nginx
   ↓
serves /dist
```

This keeps the final frontend container small and does not include the Node.js build toolchain.

---

# Privacy

The application is designed around local AI processing.

When running the standard local setup:

- Faster-Whisper processes audio locally
- Ollama runs the language model locally
- transcripts do not need to be sent to an external AI API

Actual privacy still depends on how and where you deploy the application.

---

# Troubleshooting

## Ollama is not running

If the backend returns:

```text
Ollama is not running or cannot be reached.
```

check:

```bash
ollama list
```

or, when using Docker:

```bash
docker compose ps
```

Check Ollama logs:

```bash
docker compose logs ollama
```

---

## Ollama model is missing

Check:

```bash
docker exec -it transcript-ollama ollama list
```

Install the default model:

```bash
docker exec -it transcript-ollama ollama pull llama3.2
```

---

## Backend container is unhealthy

Check:

```bash
docker compose logs backend
```

Test the health endpoint:

```bash
curl http://localhost:8000/health
```

Expected:

```json
{
  "status": "ok"
}
```

---

## Frontend cannot reach backend

Make sure the backend is running:

```bash
curl http://localhost:8000/health
```

For local frontend development, verify:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

For the current Docker frontend build, the browser reaches the backend through:

```text
http://localhost:8000
```

---

## Rebuild containers after source changes

```bash
docker compose down
docker compose build
docker compose up
```

To rebuild only the backend:

```bash
docker compose build backend
docker compose up
```

To rebuild only the frontend:

```bash
docker compose build frontend
docker compose up
```

---

# Useful Commands

## Start Docker stack

```bash
docker compose up
```

## Start in background

```bash
docker compose up -d
```

## Stop Docker stack

```bash
docker compose down
```

## Check containers

```bash
docker compose ps
```

## Backend logs

```bash
docker compose logs -f backend
```

## Frontend logs

```bash
docker compose logs -f frontend
```

## Ollama logs

```bash
docker compose logs -f ollama
```

## List Ollama models

```bash
docker exec -it transcript-ollama ollama list
```

## Pull Ollama model

```bash
docker exec -it transcript-ollama ollama pull llama3.2
```

## Backend tests

```bash
cd backend
pytest -v
```

## Frontend lint

```bash
cd frontend
npm run lint
```

## Frontend build

```bash
npm run build
```

## Frontend tests

```bash
npm run test:run
```

---

# Current Project Status

The project currently includes:

```text
Responsive React interface              ✅
Microphone recording                    ✅
Hold-V recording shortcut               ✅
Drag-and-drop audio upload              ✅
Audio preview                           ✅
Text input                              ✅
FastAPI backend                         ✅
Faster-Whisper transcription            ✅
Ollama transcript cleanup               ✅
Multiple cleanup prompt modes           ✅
Optional LLM processing                 ✅
API validation and error handling       ✅
Backend automated tests                 ✅
Frontend API tests                      ✅
Dockerized frontend                     ✅
Dockerized backend                      ✅
Dockerized Ollama                       ✅
Persistent Ollama model storage         ✅
Backend Docker health check             ✅
Docker Compose orchestration            ✅
GitHub Actions CI                       ✅
```

---

# Future Improvements

Possible future improvements include:

- additional frontend component tests
- improved microphone permission feedback
- better copy-success feedback
- more detailed processing status messages
- additional Whisper model configuration options
- GPU acceleration
- speaker diarization
- timestamps
- transcript history
- export to TXT, Markdown, or PDF
- automatic Ollama model initialization
- production deployment configuration

---

# Development Workflow

A useful workflow before pushing changes is:

### Backend

```bash
cd backend
pytest -v
```

### Frontend

```bash
cd frontend
npm run lint
npm run build
npm run test:run
```

### Docker

```bash
docker compose build
docker compose up
```

Then push the changes and GitHub Actions will run the automated CI checks again.

---

# Summary

Voice Notes AI provides a fully local workflow for converting voice recordings into readable text:

```text
Record / Upload / Paste
          ↓
      FastAPI
          ↓
   Faster-Whisper
          ↓
 Original Transcript
          ↓
       Ollama
          ↓
 Cleaned Transcript
```

The project combines a responsive React frontend, a FastAPI backend, local speech recognition, local language-model processing, automated tests, Docker Compose, and GitHub Actions CI into one application.
