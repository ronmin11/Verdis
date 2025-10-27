from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from transformers import AutoTokenizer, AutoModelForCausalLM
from transformers.generation.streamers import TextIteratorStreamer
from huggingface_hub import login, snapshot_download
import torch
from threading import Thread
import os
import io
from typing import Optional
from plant_disease_model import PlantDiseaseModel
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="Verdis Backend API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model instances
plant_model = None
chat_model = None
tokenizer = None

def init_models():
    """Initialize all ML models."""
    global plant_model, chat_model, tokenizer
    
    # Initialize plant disease model
    try:
        # Update these paths to your actual model files
        plant_model = PlantDiseaseModel(
            model_weights_path="model_weights.pth",
            class_names_path="class_names.txt"  # Optional: create this file with your class names
        )
        logger.info("Plant disease model loaded successfully")
    except Exception as e:
        logger.error(f"Error loading plant disease model: {e}")
        raise
    
    # Initialize chat model
    try:
        model_name = "Qwen/Qwen2-0.5B"
        logger.info(f"Loading chat model: {model_name}")
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        tokenizer.pad_token = tokenizer.eos_token
        logger.info("Tokenizer loaded successfully")
        chat_model = AutoModelForCausalLM.from_pretrained(model_name)
        logger.info("Chat model loaded successfully")
    except Exception as e:
        logger.error(f"Error loading chat model: {e}")
        logger.error(f"Error type: {type(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        # Don't raise, just log the error - the fallback responses will be used
        logger.info("Chat model will use fallback responses")

# Initialize models when the application starts
@app.on_event("startup")
async def startup_event():
    try:
        init_models()
    except Exception as e:
        logger.error(f"Failed to initialize models: {e}")
        # Don't raise - let the app start with fallback responses

def generate_streaming_response(prompt, max_new_tokens=500, temperature=0.7):
    """Generate a streaming response from the chat model."""
    if not chat_model or not tokenizer:
        yield "Chat model not initialized"
        return
        
    try:
        # Simple generation that actually works
        inputs = tokenizer.encode(prompt, return_tensors="pt")
        
        with torch.no_grad():
            outputs = chat_model.generate(
                inputs,
                max_new_tokens=max_new_tokens,
                temperature=temperature,
                do_sample=True,
                top_p=0.9,
                pad_token_id=tokenizer.eos_token_id,
                no_repeat_ngram_size=2,
            )
        
        # Decode the response
        response = tokenizer.decode(outputs[0], skip_special_tokens=True)
        response = response[len(prompt):].strip()
        
        # Simulate streaming by yielding chunks
        words = response.split()
        for i, word in enumerate(words):
            if i > 0:
                yield " "
            yield word
                
    except Exception as e:
        logger.error(f"Generation error: {e}")
        yield f"Error: {str(e)}"

# API Endpoints
@app.post("/api/predict")
async def predict_disease(file: UploadFile = File(...)):
    """
    Endpoint for plant disease prediction from image upload.
    """
    if not plant_model:
        raise HTTPException(status_code=503, detail="Plant disease model not initialized")
    
    # Check file type
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Read image file
        contents = await file.read()
        
        # Make prediction
        result = plant_model.predict(contents)
        
        return JSONResponse(content={
            "status": "success",
            "prediction": result
        })
        
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat")
async def chat(prompt: str):
    """
    Endpoint for chat-based interaction with the AI.
    """
    try:
        return StreamingResponse(
            generate_streaming_response(prompt),
            media_type="text/plain"
        )
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}

# Example usage
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)