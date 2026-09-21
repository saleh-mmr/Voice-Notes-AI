from faster_whisper import WhisperModel
from app.config import (WHISPER_COMPUTE_TYPE, WHISPER_DEVICE, WHISPER_MODEL)
from functools import lru_cache

'''
What this does:
    - transcribes audio files using the Faster Whisper model
    - uses the model specified in the WHISPER_MODEL environment variable
    - uses the device specified in the WHISPER_DEVICE environment variable
    - uses the compute type specified in the WHISPER_COMPUTE_TYPE environment variable
    - returns the transcribed text as a single string
'''

@lru_cache(maxsize=1)
def get_whisper_model() -> WhisperModel:
    return WhisperModel(
        WHISPER_MODEL,
        device=WHISPER_DEVICE,
        compute_type=WHISPER_COMPUTE_TYPE,
    )


def transcribe_audio(file_path: str) -> str:
    model = get_whisper_model()

    segments, _ = model.transcribe(
        file_path,
        beam_size=5,
    )

    transcript_parts: list[str] = []

    for segment in segments:
        text = segment.text.strip()

        if text:
            transcript_parts.append(text)

    return " ".join(transcript_parts)