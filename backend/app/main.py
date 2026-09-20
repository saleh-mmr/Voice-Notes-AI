from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(
    title="Local AI Voice Transcript API",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TextProcessRequest(BaseModel):
    text: str
    clean_with_llm: bool = True
    system_prompt: str = "default"

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/audio/upload")
async def upload_audio(file: UploadFile = File(...)):
    return {
        "filename": file.filename,
        "content_type": file.content_type,
    }

@app.post("/text/process")
async def process_text(request: TextProcessRequest):
    return {
        "original_text": request.text,
        "cleaned_text": request.text,
        "clean_with_llm": request.clean_with_llm,
        "system_prompt": request.system_prompt,
    }