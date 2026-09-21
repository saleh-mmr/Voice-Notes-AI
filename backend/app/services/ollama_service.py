import httpx

from app.config import OLLAMA_MODEL, OLLAMA_URL


class OllamaUnavailableError(Exception):
    pass


class OllamaModelMissingError(Exception):
    pass


class OllamaTimeoutError(Exception):
    pass


class OllamaResponseError(Exception):
    pass


async def generate_with_ollama(
    text: str,
    system_prompt: str,
) -> str:
    payload = {
        "model": OLLAMA_MODEL,
        "stream": False,
        "messages": [
            {
                "role": "system",
                "content": system_prompt,
            },
            {
                "role": "user",
                "content": text,
            },
        ],
    }

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                OLLAMA_URL,
                json=payload,
            )

    except httpx.ConnectError as error:
        raise OllamaUnavailableError(
            "Could not connect to Ollama."
        ) from error

    except httpx.TimeoutException as error:
        raise OllamaTimeoutError(
            "Ollama request timed out."
        ) from error

    if response.status_code == 404:
        raise OllamaModelMissingError(
            f"Ollama model '{OLLAMA_MODEL}' was not found."
        )

    if not response.is_success:
        raise OllamaResponseError(
            f"Ollama returned HTTP {response.status_code}."
        )

    try:
        data = response.json()
        result = data["message"]["content"].strip()
    except (KeyError, TypeError, ValueError) as error:
        raise OllamaResponseError(
            "Ollama returned an invalid response."
        ) from error

    if not result:
        raise OllamaResponseError(
            "Ollama returned an empty response."
        )

    return result