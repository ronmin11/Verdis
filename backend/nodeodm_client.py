"""
NodeODM API Client
Documentation: https://github.com/OpenDroneMap/NodeODM/blob/master/docs/index.adoc
"""
import requests
import time
import logging
from typing import Dict, List, Optional, Any
from pathlib import Path
import os

logger = logging.getLogger(__name__)

class NodeODMClient:
    """
    Client for interacting with NodeODM API.
    NodeODM is a lightweight API server for processing images with ODM.
    """
    
    def __init__(self, base_url: str = "http://localhost:3000"):
        """
        Initialize NodeODM client.
        
        Args:
            base_url: Base URL of the NodeODM server (default: http://localhost:3000)
        """
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        
    def _make_request(self, method: str, endpoint: str, **kwargs) -> Any:
        """
        Make a request to the NodeODM API.
        
        Args:
            method: HTTP method (GET, POST, etc.)
            endpoint: API endpoint
            **kwargs: Additional arguments for requests
            
        Returns:
            Response JSON (may be Dict, List, or other types)
        """
        url = f"{self.base_url}{endpoint}"
        try:
            response = self.session.request(method, url, **kwargs)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"NodeODM API request failed: {e}")
            raise
    
    def get_info(self) -> Dict:
        """
        Get information about the NodeODM server.
        
        Returns:
            Server information
        """
        return self._make_request('GET', '/info')
    
    def get_tasks(self) -> List[Dict]:
        """
        Get list of all tasks.
        
        Returns:
            List of tasks
        """
        return self._make_request('GET', '/task/list')
    
    def get_task_info(self, task_uuid: str) -> Dict:
        """
        Get information about a specific task.
        
        Args:
            task_uuid: Task UUID
            
        Returns:
            Task information
        """
        return self._make_request('GET', f'/task/{task_uuid}/info')
    
    def create_task(
        self,
        image_files: List[str],
        options: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Create a new task for processing images.
        
        Args:
            image_files: List of paths to image files
            options: Processing options (e.g., {'orthophoto-resolution': '2'})
            
        Returns:
            Task UUID
        """
        # Prepare files for upload
        try:
            multipart_files = []
            for image_file in image_files:
                file_path = Path(image_file)
                if not file_path.exists():
                    raise FileNotFoundError(f"Image file not found: {image_file}")
                
                # Determine content type
                content_type = 'image/jpeg'
                if file_path.suffix.lower() in ['.png']:
                    content_type = 'image/png'
                
                # Open file for reading
                with open(file_path, 'rb') as f:
                    file_data = f.read()
                
                # Create tuple for multipart/form-data
                multipart_files.append(
                    ('images', (file_path.name, file_data, content_type))
                )
            
            # Prepare options as JSON string
            data = {}
            if options:
                import json
                data['options'] = json.dumps(options)
            
            # Make request with files
            url = f"{self.base_url}/task/new"
            response = self.session.post(url, files=multipart_files, data=data)
            response.raise_for_status()
            response_data = response.json()
            
            task_uuid = response_data.get('uuid')
            
            if not task_uuid:
                raise ValueError("No task UUID returned from NodeODM")
            
            logger.info(f"Created task with UUID: {task_uuid}")
            return task_uuid
        except Exception as e:
            logger.error(f"Failed to create task: {e}")
            raise
    
    def wait_for_task(self, task_uuid: str, timeout: int = 3600, poll_interval: int = 5) -> Dict:
        """
        Wait for a task to complete.
        
        Args:
            task_uuid: Task UUID
            timeout: Maximum time to wait in seconds
            poll_interval: Interval between status checks in seconds
            
        Returns:
            Task information when complete
        """
        start_time = time.time()
        
        while True:
            # Check timeout
            if time.time() - start_time > timeout:
                raise TimeoutError(f"Task {task_uuid} timed out after {timeout} seconds")
            
            # Get task info
            task_info = self.get_task_info(task_uuid)
            status = task_info.get('info', {}).get('status')
            
            logger.info(f"Task {task_uuid} status: {status}")
            
            if status == 'COMPLETED':
                return task_info
            elif status == 'FAILED':
                raise Exception(f"Task {task_uuid} failed: {task_info}")
            elif status in ['QUEUED', 'RUNNING']:
                time.sleep(poll_interval)
            else:
                raise Exception(f"Unknown task status: {status}")
    
    def get_task_output(self, task_uuid: str, filename: str, output_path: str) -> bool:
        """
        Download a task output file.
        
        Args:
            task_uuid: Task UUID
            filename: Name of the output file to download
            output_path: Path to save the file
            
        Returns:
            True if successful
        """
        url = f"{self.base_url}/task/{task_uuid}/download/{filename}"
        try:
            response = self.session.get(url, stream=True)
            response.raise_for_status()
            
            with open(output_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            logger.info(f"Downloaded {filename} to {output_path}")
            return True
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to download output: {e}")
            return False
    
    def get_task_downloads(self, task_uuid: str) -> List[str]:
        """
        Get list of available download files for a task.
        
        Args:
            task_uuid: Task UUID
            
        Returns:
            List of available file names
        """
        response = self._make_request('GET', f'/task/{task_uuid}/download')
        # NodeODM returns a list of strings directly
        if isinstance(response, list):
            return [str(item) for item in response]
        # If it's a dict with 'files' key, extract it
        elif isinstance(response, dict) and 'files' in response:
            files_value = response['files']
            if isinstance(files_value, list):
                return [str(item) for item in files_value]
            return []
        else:
            logger.warning(f"Unexpected download list format: {response}")
            return []
    
    def delete_task(self, task_uuid: str) -> bool:
        """
        Delete a task.
        
        Args:
            task_uuid: Task UUID
            
        Returns:
            True if successful
        """
        try:
            self._make_request('DELETE', f'/task/{task_uuid}')
            logger.info(f"Deleted task: {task_uuid}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete task: {e}")
            return False
    
    def process_drone_survey(
        self,
        image_files: List[str],
        output_dir: str,
        options: Optional[Dict[str, Any]] = None
    ) -> Dict:
        """
        Process a drone survey and download outputs.
        
        Args:
            image_files: List of paths to image files
            output_dir: Directory to save outputs (can be str or Path)
            options: Processing options
            
        Returns:
            Dictionary with processing results and output paths
        """
        # Convert to Path if it's a string
        if isinstance(output_dir, str):
            output_dir_path = Path(output_dir)
        else:
            output_dir_path = output_dir
        output_dir_path.mkdir(exist_ok=True, parents=True)
        
        # Create task
        logger.info(f"Creating NodeODM task with {len(image_files)} images")
        task_uuid = self.create_task(image_files, options)
        logger.info(f"Created task with UUID: {task_uuid}")
        
        try:
            # Wait for task to complete
            logger.info(f"Waiting for task {task_uuid} to complete...")
            task_info = self.wait_for_task(task_uuid)
            logger.info(f"Task {task_uuid} completed successfully")
            
            # Get list of available downloads
            logger.info("Getting available downloads...")
            downloads = self.get_task_downloads(task_uuid)
            logger.info(f"Found {len(downloads)} files to download")
            
            # Download outputs
            downloaded_files = {}
            for filename in downloads:
                logger.info(f"Downloading {filename}...")
                output_path = output_dir_path / filename
                if self.get_task_output(task_uuid, filename, str(output_path)):
                    downloaded_files[filename] = str(output_path)
                    logger.info(f"Downloaded {filename} to {output_path}")
            
            # Extract orthomosaic and NDVI paths
            orthomosaic_path = downloaded_files.get('orthophoto.tif') or \
                             downloaded_files.get('odm_orthophoto.tif')
            ndvi_path = downloaded_files.get('ndvi.tif') or \
                       downloaded_files.get('odm_ndvi.tif')
            
            return {
                "status": "success",
                "task_uuid": task_uuid,
                "orthomosaic_path": orthomosaic_path,
                "ndvi_path": ndvi_path,
                "output_files": downloaded_files,
                "project_dir": str(output_dir_path)
            }
            
        except Exception as e:
            logger.error(f"Drone survey processing failed: {e}")
            return {
                "status": "error",
                "error": str(e),
                "task_uuid": task_uuid
            }
        finally:
            # Clean up task
            try:
                self.delete_task(task_uuid)
            except Exception as e:
                logger.warning(f"Failed to delete task: {e}")
