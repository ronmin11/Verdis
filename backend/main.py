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
from chatbot import generate_streaming_response
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

        # Initialize chatbot model - Using Llama-3.2-1B-Instruct for better performance
        try:
            from transformers import AutoTokenizer, AutoModelForCausalLM
            # Using Llama-3.2-1B-Instruct model
            model_name = "meta-llama/Llama-3.2-1B-Instruct"
            
            tokenizer = AutoTokenizer.from_pretrained(model_name)
            chat_model = AutoModelForCausalLM.from_pretrained(model_name)
            logger.info(f"Chatbot model loaded successfully: {model_name}")
        except Exception as e:
            logger.warning(f"Failed to load chatbot model: {e}")
            logger.info("Chatbot will use fallback responses")

    except Exception as e:
        logger.error(f"Error initializing services: {e}")
        raise

# Health check endpoint
@app.get("/api/health")
async def health_check():
    return {"status": "ok", "timestamp": datetime.utcnow()}


@app.post("/api/chat/stream")
async def chat_stream(chat_request: ChatRequest):
    """Streaming chat endpoint for real-time responses"""
    try:
        # Get the last user message
        last_message = next((msg for msg in reversed(chat_request.messages) if msg.role == "user"), None)
        if not last_message:
            raise HTTPException(status_code=400, detail="No user message found")
        
        # Check if chatbot model is available
        if not chat_model or not tokenizer:
            # Use fallback response for streaming
            def fallback_generate():
                yield "data: I'm currently using a simplified response system. Let me provide you with helpful information based on your question.\n\n"
                
                # Generate fallback response
                user_question = last_message.content.lower()
                if "treatment" in user_question or "cure" in user_question or "fix" in user_question:
                    response = """**Treatment Recommendations:**

1. **Immediate Actions:**
   - Remove and destroy infected plant material
   - Improve air circulation around plants
   - Avoid overhead watering

2. **Fungicide Applications:**
   - Apply copper-based fungicides as a preventive measure
   - Use systemic fungicides for active infections
   - Follow label instructions carefully

3. **Cultural Controls:**
   - Implement crop rotation (2-3 year intervals)
   - Use disease-resistant varieties
   - Maintain proper plant spacing

**Important:** Always consult with local agricultural extension services for region-specific recommendations."""
                    
                elif "prevent" in user_question or "prevention" in user_question:
                    response = """**Prevention Strategies:**

1. **Site Preparation:**
   - Choose well-drained locations
   - Ensure proper soil pH and fertility
   - Plan for adequate air circulation

2. **Planting Practices:**
   - Use disease-free seeds and transplants
   - Implement proper spacing
   - Avoid planting in low-lying areas

3. **Cultural Management:**
   - Practice crop rotation
   - Remove plant debris regularly
   - Water at the base of plants

**Pro Tip:** Prevention is always more cost-effective than treatment!"""
                    
                elif "symptom" in user_question or "sign" in user_question or "look" in user_question:
                    response = """**Common Disease Symptoms to Watch For:**

1. **Leaf Symptoms:**
   - Yellowing or browning of leaves
   - Spots, lesions, or blotches
   - Wilting or curling
   - Premature leaf drop

2. **Stem Symptoms:**
   - Cankers or lesions
   - Discoloration
   - Wilting or stunting

**Early Detection Tips:**
- Inspect plants regularly (weekly)
- Look for changes in color, texture, or growth
- Check both upper and lower leaf surfaces"""
                    
                else:
                    response = f"""I understand you're asking about: "{last_message.content}"

Based on the crop health analysis provided, here are some general recommendations:

1. **Monitor the affected area closely** for any changes in symptoms
2. **Consider environmental factors** like humidity, temperature, and soil conditions  
3. **Implement proper crop rotation** to prevent disease buildup
4. **Use appropriate fungicides or treatments** as recommended by agricultural experts

**For more specific advice, try asking about:**
- Treatment options
- Prevention strategies  
- Symptom identification"""
                
                # Stream the response word by word for real-time effect
                import time
                words = response.split(' ')
                for i, word in enumerate(words):
                    # Add space after word except for last word
                    if i < len(words) - 1:
                        yield f"data: {word} \n\n"
                    else:
                        yield f"data: {word}\n\n"
                    time.sleep(0.05)  # Small delay for smooth streaming
                
                yield "data: [DONE]\n\n"
            
            return StreamingResponse(fallback_generate(), media_type="text/plain")
        
        def generate():
            try:
                # Simple prompt
                prompt = f"User asks: {last_message.content}. Provide helpful agricultural advice:"
                
                # Generate response with proper streaming and formatting
                if chat_model and tokenizer:
                    # Create a better prompt for agricultural advice
                    agricultural_prompt = f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>

You are an agricultural expert. Provide clear, concise advice about plant diseases. Use bullet points and proper formatting.

<|eot_id|><|start_header_id|>user<|end_header_id|>

{last_message.content}

<|eot_id|><|start_header_id|>assistant<|end_header_id|>

**Diagnosis:**
- Identify the specific disease affecting the crop

**Treatment:**
- Apply appropriate fungicides or treatments
- Follow recommended application schedules

**Prevention:**
- Implement proper crop rotation
- Maintain good field hygiene
- Monitor weather conditions

**End of recommendations.**"""
                    
                    inputs = tokenizer(agricultural_prompt, return_tensors="pt")
                    
                    # Use TextIteratorStreamer for proper streaming
                    from transformers.generation.streamers import TextIteratorStreamer
                    from threading import Thread
                    
                    streamer = TextIteratorStreamer(tokenizer, skip_prompt=True)
                    
                    generation_kwargs = dict(
                        **inputs,
                        streamer=streamer,
                        max_new_tokens=100,  # Much shorter output
                        temperature=0.5,  # Lower temperature for more focused responses
                        do_sample=True,
                        top_p=0.8,
                        pad_token_id=tokenizer.eos_token_id,
                        repetition_penalty=1.5,  # Higher repetition penalty
                        no_repeat_ngram_size=2,  # Prevent repeating phrases
                    )
                    
                    # Start generation in a separate thread
                    thread = Thread(target=chat_model.generate, kwargs=generation_kwargs)
                    thread.start()
                    
                    # Stream the response with proper formatting
                    yield "data: **Agricultural Advice:**\n\n"
                    import time
                    time.sleep(0.2)
                    
                    # Stream the response in chunks with proper formatting
                    buffer = ""
                    for new_text in streamer:
                        if new_text and new_text.strip():
                            # Clean up the text and filter out unwanted content
                            clean_text = new_text.replace('\n', ' ').strip()
                            # Skip if it contains unwanted tokens or prompt remnants
                            if clean_text and not any(unwanted in clean_text.lower() for unwanted in ['data:', 'analysis:', 'disease:', 'confidence', '<|endoftext|>', 'apple___apple_scab']):
                                buffer += clean_text + " "  # Add space between words
                                # Stream when we have a complete sentence or phrase
                                if len(buffer) > 80 and ('.' in buffer or '!' in buffer or '?' in buffer):
                                    # Find the last complete sentence
                                    last_sentence_end = max(buffer.rfind('.'), buffer.rfind('!'), buffer.rfind('?'))
                                    if last_sentence_end > 0:
                                        sentence = buffer[:last_sentence_end + 1].strip()
                                        # Clean up any remaining concatenated words
                                        sentence = sentence.replace('apple___apple_scab', 'apple scab')
                                        sentence = sentence.replace('apple___', 'apple ')
                                        # Format with bullet points and spacing
                                        if sentence.startswith(('1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.', '9.')):
                                            yield f"data: • {sentence}\n\n"
                                        elif sentence.startswith(('Treatment:', 'Prevention:', 'Management:', 'Symptoms:', 'Planting:', 'Diseases Control Measures:')):
                                            yield f"data: **{sentence}**\n\n"
                                        else:
                                            yield f"data: {sentence}\n\n"
                                        buffer = buffer[last_sentence_end + 1:].strip()
                                    import time
                                time.sleep(0.05)
                    
                    # Stream any remaining text - only if it's a complete sentence
                    if buffer.strip():
                        final_text = buffer.strip().replace('apple___apple_scab', 'apple scab').replace('apple___', 'apple ')
                        # Only stream if it ends with proper punctuation
                        if final_text.endswith(('.', '!', '?', ':')):
                            yield f"data: {final_text}\n\n"
                        else:
                            # Complete the sentence if it's incomplete
                            yield f"data: {final_text}.\n\n"
                else:
                    yield "data: **Agricultural Advice:**\n\n"
                    yield "data: • Monitor crops regularly for disease signs\n\n"
                    yield "data: • Use proper irrigation and spacing\n\n"
                    yield "data: • Apply fungicides when needed\n\n"
                
                yield "data: [DONE]\n\n"
            except Exception as e:
                logger.error(f"Streaming error: {e}")
                yield f"data: Sorry, I encountered an error generating a response. Please try again.\n\n"
                yield "data: [DONE]\n\n"
        
        return StreamingResponse(generate(), media_type="text/plain")
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
        
        # Check if chatbot model is available
        if chat_model and tokenizer:
            try:
                # Use streaming response with AI model
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
                logger.error(f"Error generating streaming response: {e}")
                # Fall back to rule-based response
        
        # Generate a response based on the user's question (fallback)
        user_question = last_message.content.lower()
        
        # Create a contextual response based on the question
        if "treatment" in user_question or "cure" in user_question or "fix" in user_question:
            response = """**Treatment Recommendations:**

1. **Immediate Actions:**
   - Remove and destroy infected plant material
   - Improve air circulation around plants
   - Avoid overhead watering

2. **Fungicide Applications:**
   - Apply copper-based fungicides as a preventive measure
   - Use systemic fungicides for active infections
   - Follow label instructions carefully

3. **Cultural Controls:**
   - Implement crop rotation (2-3 year intervals)
   - Use disease-resistant varieties
   - Maintain proper plant spacing

4. **Monitoring:**
   - Check plants regularly for new symptoms
   - Keep records of treatments and results
   - Adjust strategy based on effectiveness

**Important:** Always consult with local agricultural extension services for region-specific recommendations and proper fungicide selection."""
            
        elif "prevent" in user_question or "prevention" in user_question:
            response = """**Prevention Strategies:**

1. **Site Preparation:**
   - Choose well-drained locations
   - Ensure proper soil pH and fertility
   - Plan for adequate air circulation

2. **Planting Practices:**
   - Use disease-free seeds and transplants
   - Implement proper spacing
   - Avoid planting in low-lying areas

3. **Cultural Management:**
   - Practice crop rotation
   - Remove plant debris regularly
   - Water at the base of plants

4. **Monitoring:**
   - Regular field inspections
   - Early detection of symptoms
   - Weather-based disease forecasting

5. **Resistant Varieties:**
   - Select cultivars with known resistance
   - Rotate between different resistance genes
   - Maintain genetic diversity

**Pro Tip:** Prevention is always more cost-effective than treatment!"""
            
        elif "symptom" in user_question or "sign" in user_question or "look" in user_question:
            response = """**Common Disease Symptoms to Watch For:**

1. **Leaf Symptoms:**
   - Yellowing or browning of leaves
   - Spots, lesions, or blotches
   - Wilting or curling
   - Premature leaf drop

2. **Stem Symptoms:**
   - Cankers or lesions
   - Discoloration
   - Wilting or stunting

3. **Root Symptoms:**
   - Root rot or discoloration
   - Poor root development
   - Stunted growth

4. **Fruit/Flower Symptoms:**
   - Spots or lesions on fruit
   - Blossom end rot
   - Poor fruit development

**Early Detection Tips:**
- Inspect plants regularly (weekly)
- Look for changes in color, texture, or growth
- Check both upper and lower leaf surfaces
- Monitor environmental conditions

**When to Act:**
- Act immediately when symptoms are first noticed
- Don't wait for severe damage
- Document symptoms with photos
- Consult experts if unsure"""
            
        else:
            response = f"""I understand you're asking about: "{last_message.content}"

Based on the crop health analysis provided, here are some general recommendations:

1. **Monitor the affected area closely** for any changes in symptoms
2. **Consider environmental factors** like humidity, temperature, and soil conditions  
3. **Implement proper crop rotation** to prevent disease buildup
4. **Use appropriate fungicides or treatments** as recommended by agricultural experts
5. **Maintain good field hygiene** by removing infected plant material

**For more specific advice, try asking about:**
- Treatment options
- Prevention strategies  
- Symptom identification
- Environmental factors

**Important:** For accurate diagnosis and treatment, please consult with local agricultural extension services or plant pathologists who can provide region-specific advice."""
        
        return {
            "choices": [{
                "message": {
                    "role": "assistant",
                    "content": response
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