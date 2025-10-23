# backend/main.py
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from typing import Optional, List
import os
from pathlib import Path
import shutil
import uuid
from datetime import datetime
import sys

# Add the current directory to the path so we can import chatbot
sys.path.append(str(Path(__file__).parent))
from chatbot import generate_streaming_response

# Initialize FastAPI app
app = FastAPI(title="Verdis API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    model: str = "Qwen/Qwen3-0.6B"

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Health check endpoint
@app.get("/api/health")
async def health_check():
    return {"status": "ok", "timestamp": datetime.utcnow()}


@app.post("/api/chat")
async def chat(chat_request: ChatRequest):
    try:
        # Get the last user message
        last_message = next((msg for msg in reversed(chat_request.messages) if msg.role == "user"), None)
        if not last_message:
            raise HTTPException(status_code=400, detail="No user message found")
        
        # Generate response using the chatbot's streaming function
        response_text = ""
        for chunk in generate_streaming_response(last_message.content):
            response_text += chunk
        
        return {
            "choices": [{
                "message": {
                    "role": "assistant",
                    "content": response_text
                }
            }]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Image upload endpoint
@app.post("/api/upload")
async def upload_image(file: UploadFile = File(...)):
    try:
        # Generate a unique filename
        file_ext = file.filename.split('.')[-1]
        filename = f"{uuid.uuid4()}.{file_ext}"
        file_path = UPLOAD_DIR / filename
        
        # Save the file
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        return {
            "filename": filename,
            "url": f"/uploads/{filename}",
            "message": "File uploaded successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Drone survey processing endpoint
@app.post("/api/process-drone-survey")
async def process_drone_survey(files: List[UploadFile] = File(...)):
    try:
        saved_files = []
        for file in files:
            file_ext = file.filename.split('.')[-1]
            filename = f"{uuid.uuid4()}.{file_ext}"
            file_path = UPLOAD_DIR / filename
            
            with file_path.open("wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            saved_files.append({
                "original_name": file.filename,
                "saved_as": filename,
                "size": file.size
            })
        
        return {
            "message": f"Received {len(files)} files",
            "files": saved_files,
            "orthomosaic_url": None,  # Would be the URL to the generated orthomosaic
            "analysis": {}  # Would contain the analysis results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)