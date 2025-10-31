import cv2
import numpy as np
from pathlib import Path
from datetime import datetime
import json

class OpenCVImageProcessor:
    def __init__(self, output_dir):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        self.detector = cv2.SIFT_create()
        self.matcher = cv2.BFMatcher()

    def stitch_images(self, image_paths, project_name):
        project_dir = self.output_dir / project_name
        project_dir.mkdir(exist_ok=True)

        images = [cv2.imread(p) for p in image_paths if cv2.imread(p) is not None]
        stitcher = cv2.Stitcher_create()
        status, stitched = stitcher.stitch(images)
        if status != cv2.Stitcher_OK:
            raise ValueError(f"Stitching failed: {status}")

        stitched_path = project_dir / "stitched_panorama.jpg"
        cv2.imwrite(str(stitched_path), stitched)

        ndvi_path = self.generate_ndvi_map(stitched, project_dir)
        health_analysis = self.analyze_crop_health(stitched, project_dir)
        boundary_result = self.detect_field_boundaries(stitched, project_dir)

        return {
            "project_name": project_name,
            "stitched_image": str(stitched_path),
            "ndvi_map": str(ndvi_path),
            "health_analysis": health_analysis,
            "field_boundaries": boundary_result,
            "created_at": datetime.now().isoformat()
        }

    def generate_ndvi_map(self, image, output_dir):
        rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        red = rgb[:, :, 0].astype(np.float32)
        green = rgb[:, :, 1].astype(np.float32)
        nir = green  # approximate NIR from green channel

        ndvi = np.divide(nir - red, nir + red + 1e-10)
        ndvi_normalized = (ndvi + 1) / 2

        ndvi_colored = np.zeros((ndvi.shape[0], ndvi.shape[1], 3), dtype=np.uint8)
        for i in range(ndvi.shape[0]):
            for j in range(ndvi.shape[1]):
                val = ndvi_normalized[i, j]
                if val < 0.33:
                    r, g, b = 255, int(255 * (val / 0.33)), 0
                elif val < 0.66:
                    r, g, b = int(255 * (1 - (val - 0.33) / 0.33)), 255, 0
                else:
                    r, g, b = 0, 255, 0
                ndvi_colored[i, j] = [b, g, r]

        ndvi_path = output_dir / "ndvi_map.jpg"
        cv2.imwrite(str(ndvi_path), ndvi_colored)
        return str(ndvi_path)

    def analyze_crop_health(self, image, output_dir):
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)

        healthy_mask = cv2.inRange(hsv, np.array([35, 40, 40]), np.array([85, 255, 255]))
        stressed_mask = cv2.inRange(hsv, np.array([15, 40, 40]), np.array([35, 255, 255]))
        unhealthy_mask = cv2.inRange(hsv, np.array([0, 40, 40]), np.array([15, 255, 255]))

        total = image.shape[0] * image.shape[1]
        healthy = np.sum(healthy_mask > 0)
        stressed = np.sum(stressed_mask > 0)
        unhealthy = np.sum(unhealthy_mask > 0)

        healthy_pct = healthy / total * 100
        stressed_pct = stressed / total * 100
        unhealthy_pct = unhealthy / total * 100

        visualization = np.zeros_like(image)
        visualization[healthy_mask > 0] = [0, 255, 0]
        visualization[stressed_mask > 0] = [0, 255, 255]
        visualization[unhealthy_mask > 0] = [0, 0, 255]

        health_path = output_dir / "health_analysis.jpg"
        cv2.imwrite(str(health_path), visualization)

        score = (healthy_pct * 1.0 + stressed_pct * 0.5) / 100

        return {
            "healthy_percentage": round(healthy_pct, 2),
            "stressed_percentage": round(stressed_pct, 2),
            "unhealthy_percentage": round(unhealthy_pct, 2),
            "overall_health_score": round(score, 3),
            "health_visualization": str(health_path)
        }

    def detect_field_boundaries(self, image, output_dir):
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        edges = cv2.Canny(blurred, 50, 150)
        edges = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))

        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        large = [c for c in contours if cv2.contourArea(c) > 1000]

        boundary_img = image.copy()
        cv2.drawContours(boundary_img, large, -1, (0, 255, 0), 2)

        boundary_path = output_dir / "field_boundaries.jpg"
        cv2.imwrite(str(boundary_path), boundary_img)

        return {
            "total_contours": len(contours),
            "large_contours": len(large),
            "boundary_image": str(boundary_path)
        }

    def process_drone_survey(self, image_paths, project_name):
        result = self.stitch_images(image_paths, project_name)
        return result