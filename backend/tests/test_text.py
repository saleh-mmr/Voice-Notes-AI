from fastapi.testclient import TestClient

from app.main import app
import app.routers.text as text_router

from app.services.ollama_service import (
    OllamaModelMissingError,
    OllamaResponseError,
    OllamaTimeoutError,
    OllamaUnavailableError,
)


client = TestClient(app)


def test_process_text_without_llm(monkeypatch):
    async def should_not_be_called(*args, **kwargs):
        raise AssertionError(
            "Ollama should not be called when clean_with_llm is false."
        )

    monkeypatch.setattr(
        text_router,
        "generate_with_ollama",
        should_not_be_called,
    )

    response = client.post(
        "/text/process",
        json={
            "text": "hello this is my transcript",
            "clean_with_llm": False,
            "system_prompt": "default",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data == {
        "source": "text",
        "original_text": "hello this is my transcript",
        "cleaned_text": "hello this is my transcript",
        "clean_with_llm": False,
        "system_prompt": "default",
        "audio": None,
    }


def test_process_text_with_mocked_ollama(monkeypatch):
    async def fake_generate_with_ollama(
        text: str,
        system_prompt: str,
    ) -> str:
        return "Hello, this is my cleaned transcript."

    monkeypatch.setattr(
        text_router,
        "generate_with_ollama",
        fake_generate_with_ollama,
    )

    response = client.post(
        "/text/process",
        json={
            "text": "um hello this is my transcript",
            "clean_with_llm": True,
            "system_prompt": "default",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["source"] == "text"
    assert data["original_text"] == "um hello this is my transcript"
    assert data["cleaned_text"] == (
        "Hello, this is my cleaned transcript."
    )
    assert data["clean_with_llm"] is True
    assert data["system_prompt"] == "default"
    assert data["audio"] is None


def test_process_text_rejects_whitespace():
    response = client.post(
        "/text/process",
        json={
            "text": "   ",
            "clean_with_llm": True,
            "system_prompt": "default",
        },
    )

    assert response.status_code == 400
    assert response.json() == {
        "detail": "Transcript text cannot be empty."
    }


def test_process_text_rejects_empty_string():
    response = client.post(
        "/text/process",
        json={
            "text": "",
            "clean_with_llm": True,
            "system_prompt": "default",
        },
    )

    assert response.status_code == 422


def test_process_text_ollama_unavailable(monkeypatch):
    async def fake_generate(*args, **kwargs):
        raise OllamaUnavailableError()

    monkeypatch.setattr(
        text_router,
        "generate_with_ollama",
        fake_generate,
    )

    response = client.post(
        "/text/process",
        json={
            "text": "hello world",
            "clean_with_llm": True,
            "system_prompt": "default",
        },
    )

    assert response.status_code == 503
    assert response.json() == {
        "detail": "Ollama is not running or cannot be reached."
    }


def test_process_text_ollama_model_missing(monkeypatch):
    async def fake_generate(*args, **kwargs):
        raise OllamaModelMissingError()

    monkeypatch.setattr(
        text_router,
        "generate_with_ollama",
        fake_generate,
    )

    response = client.post(
        "/text/process",
        json={
            "text": "hello world",
            "clean_with_llm": True,
            "system_prompt": "default",
        },
    )

    assert response.status_code == 503
    assert response.json() == {
        "detail": "The configured Ollama model is not installed."
    }


def test_process_text_ollama_timeout(monkeypatch):
    async def fake_generate(*args, **kwargs):
        raise OllamaTimeoutError()

    monkeypatch.setattr(
        text_router,
        "generate_with_ollama",
        fake_generate,
    )

    response = client.post(
        "/text/process",
        json={
            "text": "hello world",
            "clean_with_llm": True,
            "system_prompt": "default",
        },
    )

    assert response.status_code == 504
    assert response.json() == {
        "detail": "Ollama took too long to respond."
    }


def test_process_text_invalid_ollama_response(monkeypatch):
    async def fake_generate(*args, **kwargs):
        raise OllamaResponseError()

    monkeypatch.setattr(
        text_router,
        "generate_with_ollama",
        fake_generate,
    )

    response = client.post(
        "/text/process",
        json={
            "text": "hello world",
            "clean_with_llm": True,
            "system_prompt": "default",
        },
    )

    assert response.status_code == 502
    assert response.json() == {
        "detail": "Ollama returned an invalid response."
    }