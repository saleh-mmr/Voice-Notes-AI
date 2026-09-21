from fastapi import APIRouter, HTTPException

from app.ollama_errors import raise_ollama_http_exception
from app.prompts import get_system_prompt
from app.schemas import ProcessResponse, TextProcessRequest
from app.services.ollama_service import (
    OllamaModelMissingError,
    OllamaResponseError,
    OllamaTimeoutError,
    OllamaUnavailableError,
    generate_with_ollama,
)


router = APIRouter(
    prefix="/text",
    tags=["text"],
)


@router.post("/process", response_model=ProcessResponse)
async def process_text(request: TextProcessRequest):
    if not request.text.strip():
        raise HTTPException(
            status_code=400,
            detail="Transcript text cannot be empty.",
        )

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

    except (
        OllamaUnavailableError,
        OllamaModelMissingError,
        OllamaTimeoutError,
        OllamaResponseError,
    ) as error:
        raise_ollama_http_exception(error)

    return ProcessResponse(
        source="text",
        original_text=request.text,
        cleaned_text=cleaned_text,
        clean_with_llm=True,
        system_prompt=request.system_prompt,
        audio=None,
    )