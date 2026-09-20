from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

'''
when you run uvicorn app.main:app --reload, Uvicorn will look for the app object in
the main.py file inside the app directory then run it as the ASGI application
The --reload flag enables auto-reloading of the server when code changes are detected.
'''
app = FastAPI(
    title="AI Voice Transcript API",
    version="1.0.0",
)

'''
CORS is necessary because your frontend and backend run on different origins during development.
For example:
    frontend: http://localhost:5173
    backend: http://127.0.0.1:8000
Without CORS, the browser may block frontend requests to the backend.
'''
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


# This gives you a very simple way to test whether the backend is alive.
@app.get("/health")
def health_check():
    return {"status": "ok"}

# This endpoint allows you to upload an audio file. It returns the filename and content type of the uploaded file.
# async def is a good fit for file-upload endpoints because file operations are I/O-bound.
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