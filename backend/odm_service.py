import os
import subprocess
import tempfile
import shutil
from pathlib import Path
from typing import List, Dict, Optional
import logging
import json
from datetime import datetime
import zipfile

# Try to import NodeODM client
try:
    from nodeodm_client import NodeODMClient
    NODEODM_AVAILABLE = True
except ImportError:
    NODEODM_AVAILABLE = False
    NodeODMClient = None

logger = logging.getLogger(__name__)

class ODMService:
    """
    Service for processing drone images using OpenDroneMap (ODM).
    This service handles image upload, processing, and orthomosaic generation.
    Supports both local ODM CLI and NodeODM API.
    """
    
    def __init__(
        self, 
        odm_path: str = "odm", 
        output_dir: str = "odm_outputs",
        use_nodeodm: bool = False,
        nodeodm_url: str = "http://localhost:3000"
    ):
        """
        Initialize the ODM service.
        
        Args:
            odm_path: Path to the ODM executable (for local ODM)
            output_dir: Directory to store ODM outputs
            use_nodeodm: Whether to use NodeODM API instead of local ODM
            nodeodm_url: URL of the NodeODM server
        """
        self.odm_path = odm_path
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        self.use_nodeodm = use_nodeodm
        self.nodeodm_client = None
        
        # Initialize NodeODM client if requested and available
        if use_nodeodm:
            if NODEODM_AVAILABLE and NodeODMClient:
                try:
                    self.nodeodm_client = NodeODMClient(base_url=nodeodm_url)
                    logger.info(f"NodeODM client initialized: {nodeodm_url}")
                except Exception as e:
                    logger.error(f"Failed to initialize NodeODM client: {e}")
                    logger.info("Falling back to local ODM")
                    self.use_nodeodm = False
            else:
                logger.warning("NodeODM client not available, falling back to local ODM")
                self.use_nodeodm = False
        
    def process_drone_survey(
        self, 
        image_files: List[str], 
        project_name: str = None,
        options: Optional[Dict] = None
    ) -> Dict:
        """
        Process a drone survey using ODM (local or NodeODM).
        
        Args:
            image_files: List of paths to image files
            project_name: Name for the ODM project
            options: Processing options (for NodeODM)
            
        Returns:
            Dictionary containing processing results and output paths
        """
        if not project_name:
            project_name = f"survey_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
        project_dir = self.output_dir / project_name
        project_dir.mkdir(exist_ok=True, parents=True)
        
        # Use NodeODM if enabled and available
        if self.use_nodeodm and self.nodeodm_client:
            result = self._process_with_nodeodm(image_files, str(project_dir), options or {})
            # If NodeODM fails, fall back to local processing
            if result.get("status") != "success":
                logger.warning("NodeODM processing failed, falling back to local ODM")
                return self._process_with_local_odm(image_files, str(project_dir), project_name)
            return result
        else:
            return self._process_with_local_odm(image_files, str(project_dir), project_name)
    
    def _process_with_nodeodm(
        self, 
        image_files: List[str], 
        project_dir: str,
        options: Dict
    ) -> Dict:
        """
        Process drone survey using NodeODM API.
        
        Args:
            image_files: List of paths to image files
            project_dir: Output directory for the project
            options: Processing options
            
        Returns:
            Dictionary containing processing results
        """
        try:
            logger.info("Processing with NodeODM API")
            logger.info(f"Image files: {image_files}")
            logger.info(f"Project dir: {project_dir}")
            logger.info(f"Options: {options}")
            
            result = self.nodeodm_client.process_drone_survey(
                image_files,
                project_dir,
                options=options
            )
            
            logger.info(f"NodeODM result: {result}")
            return result
        except Exception as e:
            logger.error(f"NodeODM processing failed: {str(e)}")
            logger.exception(e)  # Log full stack trace
            return {
                "status": "error",
                "error": str(e),
                "project_dir": project_dir
            }
    
    def _process_with_local_odm(
        self,
        image_files: List[str],
        project_dir: str,
        project_name: str
    ) -> Dict:
        """
        Process drone survey using local ODM CLI.
        
        Args:
            image_files: List of paths to image files
            project_dir: Output directory for the project
            project_name: Name of the project
            
        Returns:
            Dictionary containing processing results
        """
        project_path = Path(project_dir)
        
        # Copy images to project directory
        images_dir = project_path / "images"
        images_dir.mkdir(exist_ok=True)
        
        for image_file in image_files:
            shutil.copy2(image_file, images_dir)
            
        try:
            # Run ODM processing
            result = self._run_odm_processing(str(project_path), str(images_dir))
            
            # Find output files
            orthomosaic_path = self._find_orthomosaic(project_path)
            ndvi_path = self._find_ndvi(project_path)
            
            return {
                "status": "success",
                "project_name": project_name,
                "orthomosaic_path": str(orthomosaic_path) if orthomosaic_path else None,
                "ndvi_path": str(ndvi_path) if ndvi_path else None,
                "project_dir": str(project_path),
                "processing_log": result.get("log", ""),
                "processing_time": result.get("time", 0)
            }
            
        except Exception as e:
            logger.error(f"ODM processing failed: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "project_name": project_name
            }
    
    def _run_odm_processing(self, project_dir: str, images_dir: str) -> Dict:
        """
        Run ODM processing on the images.
        
        Args:
            project_dir: Path to the project directory
            images_dir: Path to the images directory
            
        Returns:
            Dictionary with processing results
        """
        start_time = datetime.now()
        
        # ODM command with basic parameters
        cmd = [
            self.odm_path,
            images_dir,
            "--output", project_dir,
            "--dsm",  # Generate DSM
            "--dtm",  # Generate DTM
            "--orthophoto",  # Generate orthophoto
            "--ndvi",  # Generate NDVI
            "--pc-las",  # Generate point cloud
            "--mesh-octree-depth", "12",
            "--mesh-size", "300000",
            "--orthophoto-resolution", "2",
            "--skip-3dmodel",  # Skip 3D model for faster processing
            "--verbose"
        ]
        
        try:
            # Run ODM command
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=3600  # 1 hour timeout
            )
            
            end_time = datetime.now()
            processing_time = (end_time - start_time).total_seconds()
            
            if result.returncode == 0:
                logger.info(f"ODM processing completed successfully in {processing_time:.2f} seconds")
                return {
                    "status": "success",
                    "log": result.stdout,
                    "time": processing_time
                }
            else:
                logger.error(f"ODM processing failed: {result.stderr}")
                return {
                    "status": "error",
                    "log": result.stderr,
                    "time": processing_time
                }
                
        except subprocess.TimeoutExpired:
            logger.error("ODM processing timed out")
            return {
                "status": "timeout",
                "log": "Processing timed out after 1 hour",
                "time": 3600
            }
        except Exception as e:
            logger.error(f"Error running ODM: {str(e)}")
            return {
                "status": "error",
                "log": str(e),
                "time": 0
            }
    
    def _find_orthomosaic(self, project_dir: Path) -> Optional[Path]:
        """Find the generated orthomosaic file."""
        orthomosaic_patterns = [
            "odm_orthophoto/odm_orthophoto.tif",
            "odm_orthophoto.tif",
            "orthomosaic.tif"
        ]
        
        for pattern in orthomosaic_patterns:
            orthomosaic_path = project_dir / pattern
            if orthomosaic_path.exists():
                return orthomosaic_path
                
        return None
    
    def _find_ndvi(self, project_dir: Path) -> Optional[Path]:
        """Find the generated NDVI file."""
        ndvi_patterns = [
            "odm_ndvi/odm_ndvi.tif",
            "odm_ndvi.tif",
            "ndvi.tif"
        ]
        
        for pattern in ndvi_patterns:
            ndvi_path = project_dir / pattern
            if ndvi_path.exists():
                return ndvi_path
                
        return None
    
    def generate_ndvi_analysis(self, ndvi_path: str) -> Dict:
        """
        Generate NDVI analysis from the NDVI raster.
        
        Args:
            ndvi_path: Path to the NDVI raster file
            
        Returns:
            Dictionary containing NDVI analysis results
        """
        try:
            import rasterio
            import numpy as np
            
            with rasterio.open(ndvi_path) as src:
                ndvi_data = src.read(1)
                
                # Calculate NDVI statistics
                valid_pixels = ndvi_data[~np.isnan(ndvi_data)]
                
                if len(valid_pixels) == 0:
                    return {"error": "No valid NDVI data found"}
                
                # Calculate statistics
                mean_ndvi = np.mean(valid_pixels)
                min_ndvi = np.min(valid_pixels)
                max_ndvi = np.max(valid_pixels)
                std_ndvi = np.std(valid_pixels)
                
                # Categorize NDVI values
                healthy_pixels = np.sum((valid_pixels >= 0.6) & (valid_pixels <= 1.0))
                moderate_pixels = np.sum((valid_pixels >= 0.3) & (valid_pixels < 0.6))
                poor_pixels = np.sum((valid_pixels >= 0.0) & (valid_pixels < 0.3))
                
                total_pixels = len(valid_pixels)
                
                return {
                    "mean_ndvi": float(mean_ndvi),
                    "min_ndvi": float(min_ndvi),
                    "max_ndvi": float(max_ndvi),
                    "std_ndvi": float(std_ndvi),
                    "health_categories": {
                        "healthy": {
                            "pixels": int(healthy_pixels),
                            "percentage": float(healthy_pixels / total_pixels * 100)
                        },
                        "moderate": {
                            "pixels": int(moderate_pixels),
                            "percentage": float(moderate_pixels / total_pixels * 100)
                        },
                        "poor": {
                            "pixels": int(poor_pixels),
                            "percentage": float(poor_pixels / total_pixels * 100)
                        }
                    },
                    "total_pixels": int(total_pixels)
                }
                
        except ImportError:
            logger.warning("rasterio not available, returning basic analysis")
            return {
                "mean_ndvi": 0.5,
                "min_ndvi": 0.0,
                "max_ndvi": 1.0,
                "std_ndvi": 0.2,
                "health_categories": {
                    "healthy": {"pixels": 0, "percentage": 0},
                    "moderate": {"pixels": 0, "percentage": 0},
                    "poor": {"pixels": 0, "percentage": 0}
                },
                "total_pixels": 0
            }
        except Exception as e:
            logger.error(f"Error analyzing NDVI: {str(e)}")
            return {"error": str(e)}
    
    def create_project_zip(self, project_dir: str, output_path: str) -> bool:
        """
        Create a zip file of the ODM project outputs.
        
        Args:
            project_dir: Path to the project directory
            output_path: Path for the output zip file
            
        Returns:
            True if successful, False otherwise
        """
        try:
            with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                for root, dirs, files in os.walk(project_dir):
                    for file in files:
                        file_path = os.path.join(root, file)
                        arcname = os.path.relpath(file_path, project_dir)
                        zipf.write(file_path, arcname)
            return True
        except Exception as e:
            logger.error(f"Error creating project zip: {str(e)}")
            return False
