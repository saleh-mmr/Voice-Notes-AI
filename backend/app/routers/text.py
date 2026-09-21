from fastapi import APIRouter, HTTPException
from app.prompts import get_system_prompt
from app.schemas import ProcessResponse, TextProcessRequest
from app.services.ollama_service import (
    OllamaModelMissingError,
    OllamaResponseError,
    OllamaTimeoutError,
    OllamaUnavailableError,
    generate_with_ollama,
)


'''
This router handles text processing requests.
'''

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

    except OllamaUnavailableError as error:
        raise HTTPException(
            status_code=503,
            detail="Ollama is not running or cannot be reached.",
        ) from error

    except OllamaModelMissingError as error:
        raise HTTPException(
            status_code=503,
            detail="The configured Ollama model is not installed.",
        ) from error

    except OllamaTimeoutError as error:
        raise HTTPException(
            status_code=504,
            detail="Ollama took too long to respond.",
        ) from error

    except OllamaResponseError as error:
        raise HTTPException(
            status_code=502,
            detail="Ollama returned an invalid response.",
        ) from error

    return ProcessResponse(
        source="text",
        original_text=request.text,
        cleaned_text=cleaned_text,
        clean_with_llm=True,
        system_prompt=request.system_prompt,
        audio=None,
    )