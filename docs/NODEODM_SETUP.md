# NodeODM Setup Guide

This guide explains how to set up and use NodeODM with the Verdis application for processing drone survey images.

## What is NodeODM?

NodeODM is a lightweight API server for processing drone images using OpenDroneMap (ODM). It provides:
- RESTful API for task management
- Remote processing capabilities
- Better scalability for handling multiple drone surveys
- Web-based task monitoring

Documentation: https://github.com/OpenDroneMap/NodeODM

## Installation

### Option 1: Docker (Recommended)

```bash
# Pull the latest NodeODM Docker image
docker pull opendronemap/nodeodm

# Run NodeODM
docker run -it -p 3000:3000 opendronemap/nodeodm
```

### Option 2: Manual Installation

1. Install Node.js and npm
2. Clone the NodeODM repository:
```bash
git clone https://github.com/OpenDroneMap/NodeODM.git
cd NodeODM
npm install
```

3. Start NodeODM:
```bash
npm start
```

## Configuration

By default, NodeODM runs on `http://localhost:3000`. You can configure the backend to use NodeODM by setting these environment variables:

```bash
# Enable NodeODM
USE_NODEODM=true

# NodeODM server URL
NODEODM_URL=http://localhost:3000
```

Or modify the ODM service initialization in `backend/main.py`:

```python
odm_service = ODMService(
    use_nodeodm=True,
    nodeodm_url="http://localhost:3000"
)
```

## Usage

### 1. Start NodeODM Server

```bash
# Using Docker
docker run -it -p 3000:3000 opendronemap/nodeodm

# Or using npm
cd NodeODM
npm start
```

### 2. Verify NodeODM is Running

Visit http://localhost:3000 in your browser or check the API:

```bash
curl http://localhost:3000/info
```

You should see NodeODM server information.

### 3. Process Drone Survey

The application will automatically use NodeODM if enabled. The backend will:
- Upload images to NodeODM
- Create a processing task
- Monitor task progress
- Download results when complete

## API Endpoints

NodeODM provides the following key endpoints:

### Get Server Information
```
GET /info
```

### List All Tasks
```
GET /task/list
```

### Get Task Information
```
GET /task/{uuid}/info
```

### Create New Task
```
POST /task/new
Content-Type: multipart/form-data

files: image files (multiple)
options: JSON string with processing options
```

### Download Task Output
```
GET /task/{uuid}/download/{filename}
```

### Delete Task
```
DELETE /task/{uuid}
```

## Processing Options

You can customize processing by passing options to NodeODM:

```python
options = {
    'orthophoto-resolution': '2',  # cm/pixel
    'dsm': True,  # Generate DSM
    'dtm': True,  # Generate DTM
    'ndvi': True,  # Generate NDVI
    'skip-3dmodel': True  # Skip 3D model generation
}

result = odm_service.process_drone_survey(
    image_files=image_files,
    options=options
)
```

## Troubleshooting

### NodeODM Not Starting

1. Check if port 3000 is already in use:
```bash
netstat -tlnp | grep 3000
```

2. Use a different port:
```bash
docker run -it -p 3001:3000 opendronemap/nodeodm
```

### Connection Errors

1. Verify NodeODM is running:
```bash
curl http://localhost:3000/info
```

2. Check firewall settings

3. Ensure the backend can reach the NodeODM server

### Task Processing Fails

1. Check task status:
```bash
curl http://localhost:3000/task/{uuid}/info
```

2. Review NodeODM logs for errors

3. Ensure sufficient disk space for processing

## Comparison: Local ODM vs NodeODM

| Feature | Local ODM | NodeODM |
|---------|-----------|---------|
| Installation | Requires ODM CLI | Docker or npm |
| Scalability | Single machine | Can distribute across servers |
| API | CLI only | RESTful API |
| Monitoring | Limited | Web interface available |
| Remote Access | No | Yes |
| Resource Usage | Dedicated to one task | Can queue multiple tasks |

## Best Practices

1. **Use Docker**: Simplifies deployment and updates
2. **Monitor Resources**: Drone processing is CPU and memory intensive
3. **Queue Management**: NodeODM can queue multiple tasks
4. **Clean Up**: Regularly delete completed tasks to free up space
5. **Backup Results**: Download and store important survey results

## Additional Resources

- NodeODM GitHub: https://github.com/OpenDroneMap/NodeODM
- OpenDroneMap Documentation: https://docs.opendronemap.org/
- NodeODM Web Client: https://github.com/OpenDroneMap/webodm
