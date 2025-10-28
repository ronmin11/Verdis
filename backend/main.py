# backend/main.py
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
import uvicorn
from typing import Optional, List
import os
from pathlib import Path
import shutil
import uuid
from datetime import datetime
import sys
import logging

# Add the current directory to the path so we can import chatbot
sys.path.append(str(Path(__file__).parent))
from plant_disease_model import PlantDiseaseModel
from odm_service import ODMService
from database import DatabaseService
import torch
import requests

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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

# Global model instances
plant_model = None
odm_service = None
db_service = None
chat_model = None
tokenizer = None

# NodeODM REST API Client
class NodeODMClient:
    def __init__(self, base_url="http://localhost:3000"):
        self.base_url = base_url
    
    def create_task(self, image_paths, options=None):
        """Create a new processing task using NodeODM REST API"""
        if options is None:
            options = {
                'dsm': True,
                'orthophoto': True,
                'point-cloud': True,
                'mesh': True,
                'gltf': True,
                'cog': True,
                'pc-ept': True
            }
        
        logger.info(f"Creating ODM task with {len(image_paths)} images")
        logger.info(f"Options: {options}")
        
        files = []
        for image_path in image_paths:
            if os.path.exists(image_path):
                with open(image_path, 'rb') as f:
                    files.append(('images', (os.path.basename(image_path), f.read(), 'image/jpeg')))
            else:
                logger.warning(f"Image file not found: {image_path}")
        
        if not files:
            raise Exception("No valid image files found")
        
        try:
            logger.info(f"Creating task with NodeODM at: {self.base_url}")
            response = requests.post(f"{self.base_url}/task/new", files=files, data=options, timeout=30, 
                                   verify=False, headers={'Connection': 'close'})
            logger.info(f"NodeODM API response status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"Task created successfully: {result}")
                return result
            else:
                logger.error(f"NodeODM API error: {response.status_code} - {response.text}")
                raise Exception(f"Failed to create task: {response.status_code} - {response.text}")
                
        except requests.exceptions.ConnectionError as e:
            logger.error(f"Cannot connect to NodeODM server: {str(e)}")
            raise Exception("NodeODM server is not running. Please start NodeODM first.")
        except requests.exceptions.Timeout as e:
            logger.error(f"NodeODM request timeout: {str(e)}")
            raise Exception("NodeODM request timed out. The server may be overloaded.")
        except Exception as e:
            logger.error(f"Error creating ODM task: {str(e)}")
            raise e

# Initialize the NodeODM client
odm_client = NodeODMClient("http://localhost:3000")

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

# Initialize models and services on startup
@app.on_event("startup")
async def startup_event():
    global plant_model, odm_service, db_service, chat_model, tokenizer
    try:
        # Initialize plant disease model
        plant_model = PlantDiseaseModel(
            model_weights_path="model_weights.pth",
            class_names_path="class_names.txt"
        )
        logger.info("Plant disease model loaded successfully")

        # Initialize ODM service
        # Check if NodeODM should be used (can be set via environment variable)
        use_nodeodm = os.getenv("USE_NODEODM", "false").lower() == "true"
        nodeodm_url = os.getenv("NODEODM_URL", "http://localhost:3000")
        
        if use_nodeodm:
            logger.info(f"Initializing ODM service with NodeODM: {nodeodm_url}")
            odm_service = ODMService(
                use_nodeodm=True,
                nodeodm_url=nodeodm_url
            )
        else:
            logger.info("Initializing ODM service with local ODM CLI")
            odm_service = ODMService(use_nodeodm=False)
        
        logger.info("ODM service initialized successfully")

        # Initialize database service
        db_service = DatabaseService()
        logger.info("Database service initialized successfully")

        # Initialize chatbot model in background (non-blocking)
        import asyncio
        asyncio.create_task(load_chatbot_model())

    except Exception as e:
        logger.error(f"Error initializing services: {e}")
        raise

async def load_chatbot_model():
    """Load chatbot model in background without blocking startup."""
    global chat_model, tokenizer
    try:
        from transformers import AutoTokenizer, AutoModelForCausalLM
        model_name = "meta-llama/Llama-3.2-1B-Instruct"
        logger.info(f"Loading Llama model in background: {model_name}")
        
        # Load tokenizer first (faster)
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        tokenizer.pad_token = tokenizer.eos_token
        logger.info("Tokenizer loaded successfully")
        
        # Load model
        logger.info("Loading Llama model (this may take a moment)...")
        chat_model = AutoModelForCausalLM.from_pretrained(
            model_name,
            torch_dtype=torch.float16,  # Use half precision for faster loading
            device_map="auto"  # Auto device mapping
        )
        logger.info("Llama model loaded successfully")
    except Exception as e:
        logger.warning(f"Failed to load Llama model: {e}")
        logger.info("Chat will use fallback responses")
        # Set to None to ensure fallback works
        chat_model = None
        tokenizer = None

def generate_response(prompt, max_new_tokens=800, temperature=0.8):
    """Generate a clean, well-formatted chatbot response using the local model."""
    if not chat_model or not tokenizer:
        logger.warning("Model not loaded, using fallback response")
        return (
            "I'm an agricultural assistant. I can help with plant disease questions. "
            "What would you like to know about crop health?"
        )

    try:
        # === Construct a clean conversation prompt ===
        conversation = (
            "<|begin_of_text|>"
            "<|start_header_id|>system<|end_header_id|>\n"
            "You are a helpful agricultural assistant. "
            "Provide clear, practical advice about plant diseases and crop health. "
            "Keep responses informative and don't cut off the response mid sentence.<|eot_id|>\n"
            "<|start_header_id|>user<|end_header_id|>\n"
            f"{prompt.strip()}<|eot_id|>\n"
            "<|start_header_id|>assistant<|end_header_id|>\n"
        )

        logger.info(f"Generating response for: {prompt[:60]}...")

        # === Encode input and move to correct device ===
        inputs = tokenizer.encode(conversation, return_tensors="pt")
        device = next(chat_model.parameters()).device
        inputs = inputs.to(device)

        # === Generate output ===
        with torch.no_grad():
            outputs = chat_model.generate(
                inputs,
                max_new_tokens=max_new_tokens,
                temperature=temperature,
                do_sample=True,
                top_p=0.9,
                top_k=50,
                repetition_penalty=1.1,
                no_repeat_ngram_size=3,
                pad_token_id=tokenizer.eos_token_id,
                eos_token_id=tokenizer.eos_token_id,
                early_stopping=True,
            )

        # === Decode and clean ===
        decoded = tokenizer.decode(outputs[0], skip_special_tokens=False)

        # Extract only the assistant's part
        if "<|start_header_id|>assistant<|end_header_id|>" in decoded:
            response = decoded.split("<|start_header_id|>assistant<|end_header_id|>")[-1]
        else:
            response = decoded

        # Trim everything after the next <|eot_id|>
        if "<|eot_id|>" in response:
            response = response.split("<|eot_id|>")[0]

        # Remove leftover tokens or metadata
        import re
        response = re.sub(r"<\|.*?\|>", "", response).strip()

        # === Final fallback if response is too short ===
        if not response or len(response) < 10:
            response = (
                f"Based on your question about '{prompt}', here are some general agricultural recommendations:\n\n"
                "• Monitor your crops regularly for signs of disease\n"
                "• Check for discoloration, spots, or unusual growth patterns\n"
                "• Consider environmental factors like humidity and temperature\n"
                "• Consult with local agricultural experts for specific treatment options\n"
                "• Practice good crop rotation and field sanitation"
            )

        logger.info(f"Final cleaned response: {response}")
        return response

    except Exception as e:
        logger.error(f"Generation error: {e}")
        return (
            f"I understand you're asking about: '{prompt}'. "
            "For plant health advice, I recommend monitoring your crops regularly and consulting with "
            "agricultural experts for specific treatment options."
        )


# Health check endpoint
@app.get("/api/health")
async def health_check():
    return {"status": "ok", "timestamp": datetime.utcnow()}

# Simple test endpoint for debugging
@app.get("/api/test")
async def test_endpoint():
    return {"message": "Backend is working!", "timestamp": datetime.utcnow()}

@app.post("/api/chat/stream")
async def chat_stream(chat_request: ChatRequest):
    """Streaming chat endpoint for real-time responses"""
    try:
        # Get the latest user message
        last_message = next((msg for msg in reversed(chat_request.messages) if msg.role == "user"), None)
        if not last_message:
            raise HTTPException(status_code=400, detail="No user message found")

        async def event_stream():
            try:
                # Generate response normally (non-streaming model output)
                response = generate_response(last_message.content)
                # Format for SSE
                yield f"data: {response}\n\n"
                yield "data: [DONE]\n\n"
            except Exception as e:
                logger.error(f"Error while generating response: {e}")
                yield "data: Sorry, an error occurred while generating a response.\n\n"
                yield "data: [DONE]\n\n"

        # ✅ Correct SSE headers and media type
        return StreamingResponse(
            event_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Transfer-Encoding": "chunked",
                "Access-Control-Allow-Origin": "*"
            },
        )

    except Exception as e:
        logger.error(f"Stream chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))



@app.post("/api/chat")
async def chat(chat_request: ChatRequest):
    try:
        # Get the last user message
        last_message = next((msg for msg in reversed(chat_request.messages) if msg.role == "user"), None)
        if not last_message:
            raise HTTPException(status_code=400, detail="No user message found")
        
        # Use the local implementation
        # Generate response using local function
        response_text = generate_response(last_message.content)
        
        return {
            "choices": [{
                "message": {
                    "role": "assistant",
                    "content": response_text
                }
            }]
        }
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Plant disease prediction endpoint
@app.post("/api/predict")
async def predict_disease(file: UploadFile = File(...)):
    """
    Endpoint for plant disease prediction from image upload.
    """
    if not plant_model:
        raise HTTPException(status_code=503, detail="Plant disease model not initialized")
    
    # Check file type
    content_type = file.content_type
    if not content_type or not content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Check filename exists
        filename_attr = file.filename
        if not filename_attr:
            raise HTTPException(status_code=400, detail="No filename provided")
        
        # Generate a unique filename
        file_ext = filename_attr.split('.')[-1]
        filename = f"{uuid.uuid4()}.{file_ext}"
        file_path = UPLOAD_DIR / filename
        
        # Save the file
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Make prediction
        result = plant_model.predict(str(file_path))
        
        # Store prediction in database
        if db_service:
            try:
                prediction_id = db_service.create_crop_prediction({
                    'predicted_class': result.get('class', 'unknown'),
                    'confidence': result.get('confidence', 0.0),
                    'top5_predictions': result.get('top5_predictions', []),
                    'image_path': str(file_path)
                })
                result['prediction_id'] = prediction_id
            except Exception as e:
                logger.warning(f"Failed to store prediction in database: {e}")
        
        # Clean up the temporary file
        file_path.unlink()
        
        return JSONResponse(content={
            "status": "success",
            "prediction": result
        })
        
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Image upload endpoint
@app.post("/api/upload")
async def upload_image(file: UploadFile = File(...)):
    try:
        # Generate a unique filename
        filename_attr = file.filename
        if not filename_attr:
            raise HTTPException(status_code=400, detail="No filename provided")
        file_ext = filename_attr.split('.')[-1]
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
async def process_drone_survey(files: List[UploadFile] = File(...), project_name: str = Form(...)):
    """
    Process drone survey images using OpenDroneMap.
    """
    try:
        logger.info(f"Received {len(files)} files for drone survey processing with project name: {project_name}")
        
        # Save files temporarily
        temp_files = []
        saved_files = []
        for file in files:
            logger.info(f"Processing file: {file.filename}, size: {file.size}")
            filename_attr = file.filename
            if not filename_attr:
                continue
            file_ext = filename_attr.split('.')[-1]
            filename = f"{uuid.uuid4()}.{file_ext}"
            file_path = UPLOAD_DIR / filename
            
            with file_path.open("wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            temp_files.append(str(file_path))
            saved_files.append({
                "original_name": filename_attr,
                "saved_as": filename,
                "size": file.size
            })
        
        logger.info(f"Successfully saved {len(saved_files)} files")
        
        # Create ODM task with comprehensive options
        options = {
            'dsm': True,
            'orthophoto': True,
            'point-cloud': True,
            'mesh': True,
            'gltf': True,
            'cog': True,
            'pc-ept': True,
            'quality': 'high',
            'feature-type': 'orb'
        }
        
        # Use ODM service if available, otherwise use NodeODM client
        result = None
        if odm_service:
            try:
                result = odm_service.process_drone_survey(temp_files, project_name, options)
            except Exception as e:
                logger.warning(f"ODM service failed, trying NodeODM client: {e}")
                try:
                    result = odm_client.create_task(temp_files, options)
                except Exception as e2:
                    logger.warning(f"NodeODM client also failed: {e2}")
                    # Create a mock result for demo purposes
                    result = {"uuid": f"mock_task_{uuid.uuid4()}", "status": "processing"}
        else:
            try:
                result = odm_client.create_task(temp_files, options)
            except Exception as e:
                logger.warning(f"NodeODM client failed: {e}")
                # Create a mock result for demo purposes
                result = {"uuid": f"mock_task_{uuid.uuid4()}", "status": "processing"}
        
        logger.info(f"ODM task created: {result}")
        
        # Create survey record in database
        survey_data = {
            'id': f"survey_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            'survey_name': project_name,
            'survey_date': datetime.now().isoformat(),
            'status': 'processing',
            'notes': f"Processing {len(files)} images"
        }
        
        if db_service:
            survey_id = db_service.create_drone_survey(survey_data)
            survey_data['id'] = survey_id
        
        return {
            "status": "success",
            "message": f"Processing started for {len(files)} files",
            "files": saved_files,
            "task_id": result.get('uuid') if isinstance(result, dict) else str(result),
            "survey": survey_data
        }
        
    except Exception as e:
        logger.error(f"Error in process_drone_survey: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Farm data management endpoints
@app.get("/api/farm-areas")
async def get_farm_areas():
    """Get all farm areas."""
    if not db_service:
        raise HTTPException(status_code=503, detail="Database service not initialized")
    
    try:
        areas = db_service.get_farm_areas()
        return {"status": "success", "areas": areas}
    except Exception as e:
        logger.error(f"Error getting farm areas: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/farm-areas")
async def create_farm_area(area_data: dict):
    """Create a new farm area."""
    if not db_service:
        raise HTTPException(status_code=503, detail="Database service not initialized")
    
    try:
        area_id = db_service.create_farm_area(area_data)
        return {"status": "success", "area_id": area_id}
    except Exception as e:
        logger.error(f"Error creating farm area: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/farm-areas/{area_id}")
async def update_farm_area(area_id: str, update_data: dict):
    """Update a farm area."""
    if not db_service:
        raise HTTPException(status_code=503, detail="Database service not initialized")
    
    try:
        success = db_service.update_farm_area(area_id, update_data)
        if success:
            return {"status": "success", "message": "Farm area updated"}
        else:
            raise HTTPException(status_code=404, detail="Farm area not found")
    except Exception as e:
        logger.error(f"Error updating farm area: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/farm-areas/{area_id}")
async def delete_farm_area(area_id: str):
    """Delete a farm area."""
    if not db_service:
        raise HTTPException(status_code=503, detail="Database service not initialized")
    
    try:
        success = db_service.delete_farm_area(area_id)
        if success:
            return {"status": "success", "message": "Farm area deleted"}
        else:
            raise HTTPException(status_code=404, detail="Farm area not found")
    except Exception as e:
        logger.error(f"Error deleting farm area: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/farm-statistics")
async def get_farm_statistics():
    """Get farm statistics."""
    if not db_service:
        raise HTTPException(status_code=503, detail="Database service not initialized")
    
    try:
        stats = db_service.get_farm_statistics()
        return {"status": "success", "statistics": stats}
    except Exception as e:
        logger.error(f"Error getting farm statistics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health-assessments/{area_id}")
async def get_health_assessments(area_id: str):
    """Get health assessments for a specific area."""
    if not db_service:
        raise HTTPException(status_code=503, detail="Database service not initialized")
    
    try:
        assessments = db_service.get_health_assessments(area_id)
        return {"status": "success", "assessments": assessments}
    except Exception as e:
        logger.error(f"Error getting health assessments: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/health-assessments")
async def create_health_assessment(assessment_data: dict):
    """Create a new health assessment."""
    if not db_service:
        raise HTTPException(status_code=503, detail="Database service not initialized")
    
    try:
        assessment_id = db_service.create_health_assessment(assessment_data)
        return {"status": "success", "assessment_id": assessment_id}
    except Exception as e:
        logger.error(f"Error creating health assessment: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/ndvi-history/{area_id}")
async def get_ndvi_history(area_id: str, days: int = 30):
    """Get NDVI history for an area."""
    if not db_service:
        raise HTTPException(status_code=503, detail="Database service not initialized")
    
    try:
        history = db_service.get_ndvi_history(area_id, days)
        return {"status": "success", "history": history}
    except Exception as e:
        logger.error(f"Error getting NDVI history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ndvi-measurements")
async def create_ndvi_measurement(measurement_data: dict):
    """Create a new NDVI measurement."""
    if not db_service:
        raise HTTPException(status_code=503, detail="Database service not initialized")
    
    try:
        measurement_id = db_service.create_ndvi_measurement(measurement_data)
        return {"status": "success", "measurement_id": measurement_id}
    except Exception as e:
        logger.error(f"Error creating NDVI measurement: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/drone-surveys")
async def get_drone_surveys():
    """Get all drone surveys."""
    if not db_service:
        raise HTTPException(status_code=503, detail="Database service not initialized")
    
    try:
        surveys = db_service.get_drone_surveys()
        return {"status": "success", "surveys": surveys}
    except Exception as e:
        logger.error(f"Error getting drone surveys: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)