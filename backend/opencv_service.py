import cv2
import numpy as np
import os
import logging
from typing import List, Tuple, Dict, Any
from pathlib import Path
import json
from datetime import datetime

logger = logging.getLogger(__name__)

class OpenCVImageProcessor:
    """OpenCV-based image processing for drone surveys and crop analysis."""
    
    def __init__(self, output_dir: str = "opencv_outputs"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        # Initialize feature detector and matcher
        self.detector = cv2.SIFT_create()  # type: ignore
        self.matcher = cv2.BFMatcher()
        
    def stitch_images(self, image_paths: List[str], project_name: str) -> Dict[str, Any]:
        """
        Stitch multiple drone images into a panoramic view with professional post-processing.
        
        Args:
            image_paths: List of paths to input images
            project_name: Name for the project/output folder
            
        Returns:
            Dictionary with processing results and file paths
        """
        # Create project output directory
        project_dir = self.output_dir / project_name
        project_dir.mkdir(exist_ok=True)
        
        # Load images
        images = []
        for img_path in image_paths:
            img = cv2.imread(img_path)
            if img is not None:
                images.append(img)
            else:
                logger.warning(f"Failed to load image: {img_path}")
        
        # Stitch images using OpenCV
        stitcher = cv2.Stitcher_create()  # type: ignore
        status, stitched = stitcher.stitch(images)
        
        if status != cv2.Stitcher_OK:
            raise ValueError(f"Stitching failed with status: {status}")
        
        # Save stitched image
        stitched_path = project_dir / "stitched_panorama.jpg"
        cv2.imwrite(str(stitched_path), stitched)
        
        # Generate NDVI map
        ndvi_path = self.generate_ndvi_map(stitched, project_dir)
        
        # Generate crop health analysis
        health_analysis = self.analyze_crop_health(stitched, project_dir)
        
        # Calculate processing statistics
        processing_stats = {
            "input_images": len(images),
            "stitched_dimensions": stitched.shape,
            "processing_time": "N/A",
            "status": "completed"
        }
        
        result = {
            "project_name": project_name,
            "stitched_image": str(stitched_path),
            "ndvi_map": str(ndvi_path),
            "health_analysis": health_analysis,
            "processing_stats": processing_stats,
            "created_at": datetime.now().isoformat()
        }
        
        # Save metadata
        metadata_path = project_dir / "metadata.json"
        with open(metadata_path, 'w') as f:
            json.dump(result, f, indent=2)
        
        return result
    
    def generate_ndvi_map(self, image: np.ndarray, output_dir: Path) -> str:
        """
        Generate NDVI (Normalized Difference Vegetation Index) map from RGB image.
        
        Args:
            image: Input RGB image
            output_dir: Directory to save NDVI map
            
        Returns:
            Path to saved NDVI map
        """
        # Convert BGR to RGB
        rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Extract Red and NIR channels (approximate NIR from RGB)
        red = rgb[:, :, 0].astype(np.float32)
        green = rgb[:, :, 1].astype(np.float32)
        
        # Approximate NIR using green channel
        nir = green
        
        # Calculate NDVI
        ndvi = np.divide(nir - red, nir + red + 1e-10)
        
        # Normalize NDVI to 0-1 range
        ndvi_normalized = (ndvi + 1) / 2
        
        # Create red-yellow-green colormap for NDVI
        ndvi_colored = np.zeros((ndvi.shape[0], ndvi.shape[1], 3), dtype=np.uint8)
        
        # Create red-yellow-green colormap
        for i in range(ndvi.shape[0]):
            for j in range(ndvi.shape[1]):
                ndvi_val = ndvi_normalized[i, j]
                
                if ndvi_val < 0.33:  # Low vegetation - Red
                    red_intensity = 255
                    green_intensity = int(255 * (ndvi_val / 0.33))
                    blue_intensity = 0
                elif ndvi_val < 0.66:  # Medium vegetation - Yellow to Green
                    red_intensity = int(255 * (1 - (ndvi_val - 0.33) / 0.33))
                    green_intensity = 255
                    blue_intensity = 0
                else:  # High vegetation - Green
                    red_intensity = 0
                    green_intensity = 255
                    blue_intensity = 0
                
                ndvi_colored[i, j] = [blue_intensity, green_intensity, red_intensity]
        
        # Save NDVI map
        ndvi_path = output_dir / "ndvi_map.jpg"
        cv2.imwrite(str(ndvi_path), ndvi_colored)
        
        return str(ndvi_path)
    
    def analyze_crop_health(self, image: np.ndarray, output_dir: Path) -> Dict[str, Any]:
        """
        Analyze crop health from stitched image using color analysis.
        
        Args:
            image: Input stitched image
            output_dir: Directory to save analysis results
            
        Returns:
            Dictionary with health analysis results
        """
        # Convert to HSV for color analysis
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        
        # Define color ranges for different health levels
        healthy_lower = np.array([35, 40, 40])
        healthy_upper = np.array([85, 255, 255])
        healthy_mask = cv2.inRange(hsv, healthy_lower, healthy_upper)
        
        stressed_lower = np.array([15, 40, 40])
        stressed_upper = np.array([35, 255, 255])
        stressed_mask = cv2.inRange(hsv, stressed_lower, stressed_upper)
        
        unhealthy_lower = np.array([0, 40, 40])
        unhealthy_upper = np.array([15, 255, 255])
        unhealthy_mask = cv2.inRange(hsv, unhealthy_lower, unhealthy_upper)
        
        # Calculate percentages
        total_pixels = image.shape[0] * image.shape[1]
        healthy_pixels = np.sum(healthy_mask > 0)
        stressed_pixels = np.sum(stressed_mask > 0)
        unhealthy_pixels = np.sum(unhealthy_mask > 0)
        
        healthy_percentage = (healthy_pixels / total_pixels) * 100
        stressed_percentage = (stressed_pixels / total_pixels) * 100
        unhealthy_percentage = (unhealthy_pixels / total_pixels) * 100
        
        # Create health visualization
        health_visualization = np.zeros_like(image)
        health_visualization[healthy_mask > 0] = [0, 255, 0]  # Green for healthy
        health_visualization[stressed_mask > 0] = [0, 255, 255]  # Yellow for stressed
        health_visualization[unhealthy_mask > 0] = [0, 0, 255]  # Red for unhealthy
        
        # Save health visualization
        health_path = output_dir / "health_analysis.jpg"
        cv2.imwrite(str(health_path), health_visualization)
        
        # Calculate overall health score
        health_score = (healthy_percentage * 1.0 + stressed_percentage * 0.5 + unhealthy_percentage * 0.0) / 100
        
        return {
            "healthy_percentage": round(healthy_percentage, 2),
            "stressed_percentage": round(stressed_percentage, 2),
            "unhealthy_percentage": round(unhealthy_percentage, 2),
            "overall_health_score": round(health_score, 3),
            "health_visualization": str(health_path),
            "total_area_analyzed": total_pixels,
            "analysis_timestamp": datetime.now().isoformat()
        }
    
    def detect_field_boundaries(self, image: np.ndarray, output_dir: Path) -> Dict[str, Any]:
        """
        Detect field boundaries and crop rows using edge detection.
        
        Args:
            image: Input stitched image
            output_dir: Directory to save boundary detection results
            
        Returns:
            Dictionary with boundary detection results
        """
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Apply Gaussian blur
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # Edge detection
        edges = cv2.Canny(blurred, 50, 150)
        
        # Morphological operations to clean up edges
        kernel = np.ones((3, 3), np.uint8)
        edges = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel)
        
        # Find contours
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # Filter contours by area
        min_area = 1000
        large_contours = [c for c in contours if cv2.contourArea(c) > min_area]
        
        # Draw contours on original image
        boundary_image = image.copy()
        cv2.drawContours(boundary_image, large_contours, -1, (0, 255, 0), 2)
        
        # Save boundary detection result
        boundary_path = output_dir / "field_boundaries.jpg"
        cv2.imwrite(str(boundary_path), boundary_image)
        
        return {
            "total_contours": len(contours),
            "large_contours": len(large_contours),
            "boundary_image": str(boundary_path),
            "detection_timestamp": datetime.now().isoformat()
        }
    
    def process_drone_survey(self, image_paths: List[str], project_name: str) -> Dict[str, Any]:
        """
        Complete drone survey processing pipeline.
        
        Args:
            image_paths: List of paths to drone images
            project_name: Name for the project
            
        Returns:
            Complete processing results
        """
        # Step 1: Stitch images
        stitching_result = self.stitch_images(image_paths, project_name)
        
        # Step 2: Load stitched image for further processing
        stitched_img = cv2.imread(stitching_result["stitched_image"])
        if stitched_img is None:
            raise ValueError("Failed to load stitched image")
        
        # Step 3: Detect field boundaries
        boundary_result = self.detect_field_boundaries(stitched_img, Path(stitching_result["stitched_image"]).parent)
        
        # Combine all results
        return {
            **stitching_result,
            "field_boundaries": boundary_result,
            "processing_pipeline": "opencv",
            "completed_at": datetime.now().isoformat()
        }
