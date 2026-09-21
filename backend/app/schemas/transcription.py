'''
This module defines the Pydantic models used for request and response validation in the FastAPI application.
This gives you:
    one request schema for text
    one shared response schema for both text and audio
    one nested schema for audio metadata
'''

from typing import Literal
from pydantic import BaseModel, Field


class AudioMetadata(BaseModel):
    filename: str
    content_type: str | None = None


class TextProcessRequest(BaseModel):
    text: str = Field(min_length=1)
    clean_with_llm: bool = True
    system_prompt: str = "default"


class ProcessResponse(BaseModel):
    source: Literal["text", "audio"]
    original_text: str
    cleaned_text: str
    clean_with_llm: bool
    system_prompt: str
    audio: AudioMetadata | None = None