import os
import tempfile

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.config import (
    MAX_AUDIO_SIZE_BYTES,
    SUPPORTED_AUDIO_EXTENSIONS,
)
from app.ollama_errors import raise_ollama_http_exception
from app.prompts import get_system_prompt
from app.schemas import (
    AudioMetadata,
    ProcessResponse,
    PromptType,
)
from app.services.ollama_service import (
    OllamaModelMissingError,
    OllamaResponseError,
    OllamaTimeoutError,
    OllamaUnavailableError,
    generate_with_ollama,
)
from app.services.transcription_service import transcribe_audio


router = APIRouter(
    prefix="/audio",
    tags=["audio"],
)


@router.post("/process", response_model=ProcessResponse)
async def process_audio(
    file: UploadFile = File(...),
    clean_with_llm: bool = Form(True),
    system_prompt: PromptType = Form("default"),
):
    filename = file.filename or "audio.webm"
    extension = os.path.splitext(filename)[1].lower()

    if extension not in SUPPORTED_AUDIO_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Unsupported audio format.",
        )

    audio_bytes = await file.read()

    if not audio_bytes:
        raise HTTPException(
            status_code=400,
            detail="Audio file is empty.",
        )

    if len(audio_bytes) > MAX_AUDIO_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail="Audio file is too large. Maximum size is 25 MB.",
        )

    temp_file_path = None

    try:
        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=extension,
        ) as temp_file:
            temp_file_path = temp_file.name
            temp_file.write(audio_bytes)

        try:
            transcript = transcribe_audio(temp_file_path)

        except Exception as error:
            raise HTTPException(
                status_code=422,
                detail=(
                    "The audio file could not be transcribed. "
                    "It may be corrupt or unsupported."
                ),
            ) from error

        if not transcript.strip():
            raise HTTPException(
                status_code=422,
                detail="No speech could be detected in the audio file.",
            )

        cleaned_text = transcript

        if clean_with_llm:
            prompt = get_system_prompt(system_prompt)

            try:
                cleaned_text = await generate_with_ollama(
                    text=transcript,
                    system_prompt=prompt,
                )

            except (
                OllamaUnavailableError,
                OllamaModelMissingError,
                OllamaTimeoutError,
                OllamaResponseError,
            ) as error:
                raise_ollama_http_exception(error)

        return ProcessResponse(
            source="audio",
            original_text=transcript,
            cleaned_text=cleaned_text,
            clean_with_llm=clean_with_llm,
            system_prompt=system_prompt,
            audio=AudioMetadata(
                filename=filename,
                content_type=file.content_type,
            ),
        )

    finally:
        if temp_file_path and os.path.exists(temp_file_path):
            os.remove(temp_file_path)