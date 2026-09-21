from fastapi import HTTPException

from app.services.ollama_service import (
    OllamaModelMissingError,
    OllamaResponseError,
    OllamaTimeoutError,
    OllamaUnavailableError,
)


def raise_ollama_http_exception(error: Exception) -> None:
    if isinstance(error, OllamaUnavailableError):
        raise HTTPException(
            status_code=503,
            detail="Ollama is not running or cannot be reached.",
        ) from error

    if isinstance(error, OllamaModelMissingError):
        raise HTTPException(
            status_code=503,
            detail="The configured Ollama model is not installed.",
        ) from error

    if isinstance(error, OllamaTimeoutError):
        raise HTTPException(
            status_code=504,
            detail="Ollama took too long to respond.",
        ) from error

    if isinstance(error, OllamaResponseError):
        raise HTTPException(
            status_code=502,
            detail="Ollama returned an invalid response.",
        ) from error

    raise error