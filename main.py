import requests
from fastapi import FastAPI, UploadFile, File

app = FastAPI()

ODM_API = "http://localhost:3000"

@app.post("/process-drone-images/")
async def process_images(files: list[UploadFile] = File(...)):
    upload_files = []
    for f in files:
        upload_files.append(("images", (f.filename, await f.read(), f.content_type)))
    
    response = requests.post(f"{ODM_API}/task/new", files=upload_files)
    return response.json()