from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.schemas import AudioMetadata, ProcessResponse, TextProcessRequest
from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from app.prompts import get_system_prompt
from app.services.ollama_service import generate_with_ollama

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

# This endpoint handles audio file uploads and returns a ProcessResponse.
@app.post("/audio/process", response_model=ProcessResponse)
async def process_audio(
    file: UploadFile = File(...),
    clean_with_llm: bool = Form(True),
    system_prompt: str = Form("default"),
):
    return ProcessResponse(
        source="audio",
        original_text="",
        cleaned_text="",
        clean_with_llm=clean_with_llm,
        system_prompt=system_prompt,
        audio=AudioMetadata(
            filename=file.filename or "audio",
            content_type=file.content_type,
        ),
    )

# This endpoint handles text processing and returns a ProcessResponse.
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