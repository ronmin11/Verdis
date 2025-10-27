#!/usr/bin/env python3
"""
Startup script for the Verdis crop health assessment application.
This script helps users start both the backend and frontend services.
"""

import subprocess
import sys
import os
import time
import webbrowser
from pathlib import Path

def check_requirements():
    """Check if required dependencies are installed."""
    print("Checking requirements...")
    
    # Check Python dependencies
    try:
        import fastapi
        import uvicorn
        import torch
        import transformers
        print("Python dependencies found")
    except ImportError as e:
        print(f"Missing Python dependency: {e}")
        print("Please install requirements: pip install -r backend/requirements.txt")
        return False
    
    # Check if model files exist
    model_files = [
        "backend/model_weights.pth",
        "backend/class_names.txt"
    ]
    
    # Also check in Verdis subdirectory
    verdis_model_files = [
        "Verdis/backend/model_weights.pth",
        "Verdis/backend/class_names.txt"
    ]
    
    all_model_files = model_files + verdis_model_files
    found_files = []
    
    for file_path in all_model_files:
        if Path(file_path).exists():
            found_files.append(file_path)
    
    if len(found_files) < 2:
        print("Missing model files")
        print("Please ensure model files are in the backend directory")
        print("Required files: model_weights.pth, class_names.txt")
        return False
    
    print("All requirements satisfied")
    return True

def start_backend():
    """Start the FastAPI backend server."""
    print("Starting backend server...")
    
    # Look for backend directory in current directory or Verdis subdirectory
    backend_dir = Path("backend")
    if not backend_dir.exists():
        # Try Verdis subdirectory
        backend_dir = Path("Verdis/backend")
        if not backend_dir.exists():
            print("Backend directory not found")
            return None
    
    try:
        # Change to backend directory and start server
        process = subprocess.Popen(
            [sys.executable, "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"],
            cwd=backend_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        # Wait a moment for server to start
        time.sleep(3)
        
        if process.poll() is None:
            print("Backend server started on http://localhost:8000")
            return process
        else:
            stdout, stderr = process.communicate()
            print(f"Failed to start backend server: {stderr.decode()}")
            return None
            
    except Exception as e:
        print(f"Error starting backend server: {e}")
        return None

def start_frontend():
    """Start the React frontend development server."""
    print("Starting frontend server...")
    
    # Look for package.json in current directory or Verdis subdirectory
    frontend_dir = Path(".")
    if not (frontend_dir / "package.json").exists():
        # Try Verdis subdirectory
        frontend_dir = Path("Verdis")
        if not (frontend_dir / "package.json").exists():
            print("Frontend package.json not found")
            return None
    
    try:
        # Check if node_modules exists
        if not (frontend_dir / "node_modules").exists():
            print("Installing frontend dependencies...")
            install_process = subprocess.run(
                ["npm", "install"],
                cwd=frontend_dir,
                capture_output=True,
                text=True
            )
            
            if install_process.returncode != 0:
                print(f"Failed to install dependencies: {install_process.stderr}")
                return None
        
        # Start development server
        process = subprocess.Popen(
            ["npm", "run", "dev"],
            cwd=frontend_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        # Wait a moment for server to start
        time.sleep(5)
        
        if process.poll() is None:
            print("Frontend server started on http://localhost:5173")
            return process
        else:
            stdout, stderr = process.communicate()
            print(f"Failed to start frontend server: {stderr.decode()}")
            return None
            
    except Exception as e:
        print(f"Error starting frontend server: {e}")
        return None

def main():
    """Main startup function."""
    print("Starting Verdis Crop Health Assessment Application")
    print("=" * 60)
    
    # Check requirements
    if not check_requirements():
        print("\nRequirements check failed. Please fix the issues above.")
        return 1
    
    print("\nStarting services...")
    
    # Start backend
    backend_process = start_backend()
    if not backend_process:
        print("\nFailed to start backend server")
        return 1
    
    # Start frontend
    frontend_process = start_frontend()
    if not frontend_process:
        print("\nFailed to start frontend server")
        backend_process.terminate()
        return 1
    
    print("\nBoth services started successfully!")
    print("\nApplication URLs:")
    print("   Frontend: http://localhost:5173")
    print("   Backend API: http://localhost:8000")
    print("   API Docs: http://localhost:8000/docs")
    
    print("\nFeatures available:")
    print("   • Drone survey processing with OpenDroneMap")
    print("   • Plant disease classification with AI")
    print("   • Farm area management and tracking")
    print("   • NDVI analysis and health progression")
    print("   • Interactive farm maps")
    print("   • AI-powered chatbot assistance")
    
    print("\nTips:")
    print("   • Upload drone images for orthomosaic generation")
    print("   • Use single image upload for quick disease diagnosis")
    print("   • Label farm areas to track crop health over time")
    print("   • Chat with the AI assistant for crop advice")
    
    # Open browser
    try:
        webbrowser.open("http://localhost:5173")
        print("\nOpening application in browser...")
    except:
        print("\nPlease open http://localhost:5173 in your browser")
    
    print("\nPress Ctrl+C to stop both services")
    
    try:
        # Wait for user to stop
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\nStopping services...")
        
        if backend_process:
            backend_process.terminate()
            print("Backend server stopped")
        
        if frontend_process:
            frontend_process.terminate()
            print("Frontend server stopped")
        
        print("\nApplication stopped. Goodbye!")
        return 0

if __name__ == "__main__":
    sys.exit(main())
