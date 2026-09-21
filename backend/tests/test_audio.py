from fastapi.testclient import TestClient

from app.main import app
import app.routers.audio as audio_router

from app.services.ollama_service import OllamaUnavailableError


client = TestClient(app)


def test_process_audio_without_llm(monkeypatch):
    monkeypatch.setattr(
        audio_router,
        "transcribe_audio",
        lambda _: "This is the Whisper transcript.",
    )

    response = client.post(
        "/audio/process",
        files={
            "file": (
                "recording.wav",
                b"fake-audio-content",
                "audio/wav",
            )
        },
        data={
            "clean_with_llm": "false",
            "system_prompt": "default",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["source"] == "audio"
    assert data["original_text"] == "This is the Whisper transcript."
    assert data["cleaned_text"] == "This is the Whisper transcript."
    assert data["clean_with_llm"] is False

    assert data["audio"] == {
        "filename": "recording.wav",
        "content_type": "audio/wav",
    }


def test_process_audio_with_ollama(monkeypatch):
    monkeypatch.setattr(
        audio_router,
        "transcribe_audio",
        lambda _: "Um this is a transcript.",
    )

    async def fake_generate(
        text: str,
        system_prompt: str,
    ) -> str:
        return "This is a transcript."

    monkeypatch.setattr(
        audio_router,
        "generate_with_ollama",
        fake_generate,
    )

    response = client.post(
        "/audio/process",
        files={
            "file": (
                "recording.wav",
                b"fake-audio-content",
                "audio/wav",
            )
        },
        data={
            "clean_with_llm": "true",
            "system_prompt": "default",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["original_text"] == "Um this is a transcript."
    assert data["cleaned_text"] == "This is a transcript."
    assert data["clean_with_llm"] is True


def test_rejects_unsupported_audio_format():
    response = client.post(
        "/audio/process",
        files={
            "file": (
                "document.txt",
                b"not audio",
                "text/plain",
            )
        },
        data={
            "clean_with_llm": "false",
            "system_prompt": "default",
        },
    )

    assert response.status_code == 400
    assert response.json() == {
        "detail": "Unsupported audio format."
    }


def test_rejects_empty_audio():
    response = client.post(
        "/audio/process",
        files={
            "file": (
                "empty.wav",
                b"",
                "audio/wav",
            )
        },
        data={
            "clean_with_llm": "false",
            "system_prompt": "default",
        },
    )

    assert response.status_code == 400
    assert response.json() == {
        "detail": "Audio file is empty."
    }


def test_rejects_audio_over_size_limit(monkeypatch):
    monkeypatch.setattr(
        audio_router,
        "MAX_AUDIO_SIZE_BYTES",
        4,
    )

    response = client.post(
        "/audio/process",
        files={
            "file": (
                "large.wav",
                b"12345",
                "audio/wav",
            )
        },
        data={
            "clean_with_llm": "false",
            "system_prompt": "default",
        },
    )

    assert response.status_code == 413


def test_corrupt_audio_returns_422(monkeypatch):
    def fake_transcribe(_):
        raise RuntimeError("Decoder failed")

    monkeypatch.setattr(
        audio_router,
        "transcribe_audio",
        fake_transcribe,
    )

    response = client.post(
        "/audio/process",
        files={
            "file": (
                "broken.wav",
                b"broken audio",
                "audio/wav",
            )
        },
        data={
            "clean_with_llm": "false",
            "system_prompt": "default",
        },
    )

    assert response.status_code == 422

    assert response.json() == {
        "detail": (
            "The audio file could not be transcribed. "
            "It may be corrupt or unsupported."
        )
    }


def test_no_speech_returns_422(monkeypatch):
    monkeypatch.setattr(
        audio_router,
        "transcribe_audio",
        lambda _: "   ",
    )

    response = client.post(
        "/audio/process",
        files={
            "file": (
                "silence.wav",
                b"fake audio",
                "audio/wav",
            )
        },
        data={
            "clean_with_llm": "false",
            "system_prompt": "default",
        },
    )

    assert response.status_code == 422
    assert response.json() == {
        "detail": "No speech could be detected in the audio file."
    }


def test_audio_ollama_unavailable(monkeypatch):
    monkeypatch.setattr(
        audio_router,
        "transcribe_audio",
        lambda _: "Transcript produced successfully.",
    )

    async def fake_generate(*args, **kwargs):
        raise OllamaUnavailableError()

    monkeypatch.setattr(
        audio_router,
        "generate_with_ollama",
        fake_generate,
    )

    response = client.post(
        "/audio/process",
        files={
            "file": (
                "recording.wav",
                b"fake audio",
                "audio/wav",
            )
        },
        data={
            "clean_with_llm": "true",
            "system_prompt": "default",
        },
    )

    assert response.status_code == 503
    assert response.json() == {
        "detail": "Ollama is not running or cannot be reached."
    }