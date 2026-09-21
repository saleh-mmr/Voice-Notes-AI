from typing import Literal

from pydantic import BaseModel, Field


PromptType = Literal[
    "default",
    "formal",
    "short",
]


class AudioMetadata(BaseModel):
    filename: str
    content_type: str | None = None


class TextProcessRequest(BaseModel):
    text: str = Field(min_length=1)
    clean_with_llm: bool = True
    system_prompt: PromptType = "default"


class ProcessResponse(BaseModel):
    source: Literal["text", "audio"]
    original_text: str
    cleaned_text: str
    clean_with_llm: bool
    system_prompt: PromptType
    audio: AudioMetadata | None = None