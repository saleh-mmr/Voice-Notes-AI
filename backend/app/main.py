import os
import tempfile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.schemas import (AudioMetadata, ProcessResponse,TextProcessRequest)
from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from app.prompts import get_system_prompt
from app.services.ollama_service import generate_with_ollama
from app.services.transcription_service import transcribe_audio
from app.routers.text import router as text_router
from app.routers.audio import router as audio_router

'''
when you run uvicorn app.main:app --reload, Uvicorn will look for the app object in
the main.py file inside the app directory then run it as the ASGI application
The --reload flag enables auto-reloading of the server when code changes are detected.
'''
app = FastAPI(
    title="AI Voice Transcript API",
    version="1.0.0",
)

'''
CORS is necessary because your frontend and backend run on different origins during development.
For example:
    frontend: http://localhost:5173
    backend: http://127.0.0.1:8000
Without CORS, the browser may block frontend requests to the backend.
'''
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# This router is responsible for handling text processing requests.
app.include_router(text_router)

# This router is responsible for handling audio processing requests.
app.include_router(audio_router)

# This gives you a very simple way to test whether the backend is alive.
@app.get("/health")
def health_check():
    return {"status": "ok"}


