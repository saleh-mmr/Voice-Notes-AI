import os
import tempfile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.schemas import AudioMetadata, ProcessResponse, TextProcessRequest
from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from app.prompts import get_system_prompt
from app.services.ollama_service import generate_with_ollama
from app.services.transcription_service import transcribe_audio

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

# This gives you a very simple way to test whether the backend is alive.
@app.get("/health")
def health_check():
    return {"status": "ok"}

# This endpoint handles audio file uploads, transcribes the audio, and returns a ProcessResponse.
@app.post("/audio/process", response_model=ProcessResponse)
async def process_audio(
    file: UploadFile = File(...),
    clean_with_llm: bool = Form(True),
    system_prompt: str = Form("default"),
):
    suffix = os.path.splitext(file.filename or "audio.webm")[1] or ".webm"

    temp_file_path = None

    try:
        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=suffix,
        ) as temp_file:
            temp_file_path = temp_file.name
            audio_bytes = await file.read()
            temp_file.write(audio_bytes)

        transcript = transcribe_audio(temp_file_path)

        cleaned_text = transcript
        if clean_with_llm:
            prompt = get_system_prompt(system_prompt)

            try:
                cleaned_text = await generate_with_ollama(
                    text=transcript,
                    system_prompt=prompt,
                )
            except Exception as error:
                raise HTTPException(
                    status_code=500,
                    detail="Audio was transcribed, but Ollama cleaning failed.",
                ) from error

        return ProcessResponse(
            source="audio",
            original_text=transcript,
            cleaned_text=cleaned_text,
            clean_with_llm=clean_with_llm,
            system_prompt=system_prompt,
            audio=AudioMetadata(
                filename=file.filename or "audio",
                content_type=file.content_type,
            ),
        )

    finally:
        if temp_file_path and os.path.exists(temp_file_path):
            os.remove(temp_file_path)


# This endpoint handles text processing requests, optionally cleaning the text with an LLM.
@app.post("/text/process", response_model=ProcessResponse)
async def process_text(request: TextProcessRequest):
    if not request.clean_with_llm:
        return ProcessResponse(
            source="text",
            original_text=request.text,
            cleaned_text=request.text,
            clean_with_llm=False,
            system_prompt=request.system_prompt,
            audio=None,
        )

    system_prompt = get_system_prompt(request.system_prompt)

    try:
        cleaned_text = await generate_with_ollama(
            text=request.text,
            system_prompt=system_prompt,
        )
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail="Failed to process text with Ollama.",
        ) from error

    return ProcessResponse(
        source="text",
        original_text=request.text,
        cleaned_text=cleaned_text,
        clean_with_llm=True,
        system_prompt=request.system_prompt,
        audio=None,
    )