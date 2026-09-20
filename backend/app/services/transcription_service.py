from faster_whisper import WhisperModel

'''
What this does:
    - loads Whisper once when the backend starts
    - uses the local base model
    - runs on CPU
    - returns one combined transcription string
'''

MODEL_SIZE = "base"

whisper_model = WhisperModel(
    MODEL_SIZE,
    device="cpu",
    compute_type="int8",
)


def transcribe_audio(file_path: str) -> str:
    segments, _ = whisper_model.transcribe(
        file_path,
        beam_size=5,
    )

    transcript_parts = []

    for segment in segments:
        text = segment.text.strip()

        if text:
            transcript_parts.append(text)

    return " ".join(transcript_parts)