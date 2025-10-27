# Verdis - Crop Health Assessment Platform

A comprehensive web application for crop health assessment using drone-based surveying, AI-powered plant disease classification, and intelligent farm management.

## 🌟 Features

### 🚁 Drone Survey Analysis
- **OpenDroneMap Integration**: Process drone survey images to generate orthomosaics
- **NDVI Mapping**: Analyze vegetation health across large areas
- **Automated Processing**: Upload multiple images for batch processing
- **Health Zone Detection**: Identify healthy, warning, and critical areas

### 🔬 Plant Disease Classification
- **AI-Powered Analysis**: Upload single crop images for instant disease diagnosis
- **38 Disease Classes**: Support for tomatoes, potatoes, corn, and more
- **Confidence Scoring**: Get detailed confidence levels for predictions
- **Treatment Recommendations**: Receive actionable advice for disease management

### 🗺️ Farm Management
- **Area Labeling**: Label different farm areas by crop type
- **Health Tracking**: Monitor crop health progression over time
- **Interactive Maps**: Visualize farm areas with health status indicators
- **Historical Data**: Track NDVI trends and health metrics

### 🤖 AI Assistant
- **Intelligent Chatbot**: Get expert advice on crop health issues
- **Context-Aware**: Understands your farm data and provides relevant recommendations
- **Treatment Guidance**: Receive specific treatment plans for identified issues
- **Prevention Tips**: Learn about preventive measures for common diseases

### 📊 Analytics & Reporting
- **NDVI Trend Analysis**: Track vegetation health over time
- **Crop-Specific Dashboards**: Detailed analytics for each crop type
- **Weather Integration**: Correlate weather data with crop health
- **Performance Metrics**: Monitor yield efficiency and health distribution

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- OpenDroneMap (for drone processing)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd verdis
   ```

2. **Install Python dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Install Node.js dependencies**
   ```bash
   npm install
   ```

4. **Start the application**
   ```bash
   python start.py
   ```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 🏗️ Architecture

### Backend (Python/FastAPI)
- **Plant Disease Model**: PyTorch-based CNN for disease classification
- **OpenDroneMap Service**: Integration with ODM for drone image processing
- **Database Service**: SQLite-based persistent storage
- **REST API**: Comprehensive API for all operations

### Frontend (React/TypeScript)
- **Modern UI**: Clean, intuitive interface built with Tailwind CSS
- **Interactive Maps**: Leaflet-based farm visualization
- **Real-time Updates**: Live data synchronization
- **Responsive Design**: Works on desktop and mobile devices

### Key Components
- **Dashboard**: Central hub for farm management
- **Drone Survey**: Upload and process aerial imagery
- **Image Analysis**: Single image disease classification
- **Farm Areas**: Manage and track different crop areas
- **Health Progression**: Monitor crop health over time
- **AI Chatbot**: Intelligent assistance for crop health

## 📁 Project Structure

```
verdis/
├── backend/
│   ├── main.py                 # FastAPI application
│   ├── plant_disease_model.py  # PyTorch model for disease classification
│   ├── odm_service.py          # OpenDroneMap integration
│   ├── database.py             # Database service
│   ├── chatbot.py             # AI chatbot service
│   ├── model_weights.pth      # Pre-trained model weights
│   ├── class_names.txt        # Disease class names
│   └── requirements.txt       # Python dependencies
├── src/
│   ├── components/
│   │   ├── Dashboard/         # Main dashboard components
│   │   ├── Farm/             # Farm management components
│   │   ├── Map/              # Interactive map components
│   │   └── Layout/           # Layout components
│   ├── data/                 # Mock data and types
│   └── utils/                # Utility functions
├── start.py                  # Application startup script
└── README.md                 # This file
```

## 🔧 Configuration

### Backend Configuration
The backend can be configured through environment variables:

```bash
# Database
DATABASE_URL=sqlite:///farm_data.db

# Model paths
MODEL_WEIGHTS_PATH=model_weights.pth
CLASS_NAMES_PATH=class_names.txt

# ODM settings
ODM_PATH=odm
OUTPUT_DIR=odm_outputs
```

### Frontend Configuration
The frontend uses Vite for development and building:

```bash
# Development
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## 📊 API Endpoints

### Core Endpoints
- `GET /api/health` - Health check
- `POST /api/predict` - Plant disease prediction
- `POST /api/chat` - AI chatbot interaction
- `POST /api/process-drone-survey` - Drone survey processing

### Farm Management
- `GET /api/farm-areas` - Get all farm areas
- `POST /api/farm-areas` - Create new farm area
- `PUT /api/farm-areas/{id}` - Update farm area
- `DELETE /api/farm-areas/{id}` - Delete farm area
- `GET /api/farm-statistics` - Get farm statistics

### Health Tracking
- `GET /api/health-assessments/{area_id}` - Get health assessments
- `POST /api/health-assessments` - Create health assessment
- `GET /api/ndvi-history/{area_id}` - Get NDVI history
- `POST /api/ndvi-measurements` - Create NDVI measurement

## 🧪 Testing

### Backend Testing
```bash
cd backend
python -m pytest tests/
```

### Frontend Testing
```bash
npm run test
```

## 🚀 Deployment

### Production Backend
```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Production Frontend
```bash
npm run build
npm run preview
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the API documentation at `/docs`
- Review the component documentation

## 🔮 Future Enhancements

- [ ] Multi-language support
- [ ] Mobile app development
- [ ] Advanced analytics dashboard
- [ ] Integration with IoT sensors
- [ ] Machine learning model improvements
- [ ] Real-time notifications
- [ ] Export capabilities (PDF, Excel)
- [ ] User authentication and authorization
- [ ] Multi-farm management
- [ ] Advanced weather integration

---

**Verdis** - Empowering farmers with AI-driven crop health insights 🌱
