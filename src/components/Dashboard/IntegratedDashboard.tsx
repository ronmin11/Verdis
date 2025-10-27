import React, { useState, useEffect } from 'react';
import { MapPin, TrendingUp, AlertTriangle, Calendar, BarChart3, Camera, Drone, X } from 'lucide-react';
import FarmAreaManager from '../Farm/FarmAreaManager';
import HealthProgression from '../Farm/HealthProgression';
import AnnotatedFarmMap from '../Map/AnnotatedFarmMap';
import DrawableFarmMap from '../Map/DrawableFarmMap';
import LocationSearch from '../Map/LocationSearch';
import CropSpecificDashboard from './CropSpecificDashboard';
import DroneSurvey from './DroneSurvey';
import SingleImageUpload from './SingleImageUpload';

interface FarmArea {
  id: string;
  name: string;
  cropType: string;
  area: number;
  coordinates: { lat: number; lng: number };
  healthStatus: 'healthy' | 'warning' | 'unhealthy';
  ndviValue?: number;
  lastAssessment: string;
  plantingDate?: string;
  expectedHarvest?: string;
  notes?: string;
}

interface FieldBoundary {
  id: string;
  name: string;
  coordinates: [number, number][];
  cropType: string;
  healthStatus: 'healthy' | 'warning' | 'unhealthy';
  ndviValue?: number;
}

const IntegratedDashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<'overview' | 'areas' | 'map' | 'drone' | 'analysis'>('overview');
  const [selectedArea, setSelectedArea] = useState<FarmArea | null>(null);
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);
  // Initialize with sample farm areas for demo (not on map, just in list)
  const [farmAreas, setFarmAreas] = useState<FarmArea[]>([
    {
      id: 'demo-1',
      name: 'North Field',
      cropType: 'Tomatoes',
      area: 25.5,
      coordinates: { lat: 40.7128, lng: -74.0060 },
      healthStatus: 'healthy',
      ndviValue: 0.78,
      lastAssessment: '2024-01-14',
      plantingDate: '2024-03-15',
      expectedHarvest: '2024-08-15',
      notes: 'Excellent growth, no issues detected'
    },
    {
      id: 'demo-2',
      name: 'South Field',
      cropType: 'Corn',
      area: 40.2,
      coordinates: { lat: 40.7130, lng: -74.0058 },
      healthStatus: 'warning',
      ndviValue: 0.65,
      lastAssessment: '2024-01-14',
      plantingDate: '2024-04-01',
      expectedHarvest: '2024-09-15',
      notes: 'Some areas showing stress, monitor closely'
    },
    {
      id: 'demo-3',
      name: 'East Field',
      cropType: 'Potatoes',
      area: 18.7,
      coordinates: { lat: 40.7132, lng: -74.0056 },
      healthStatus: 'unhealthy',
      ndviValue: 0.42,
      lastAssessment: '2024-01-14',
      plantingDate: '2024-03-20',
      expectedHarvest: '2024-07-20',
      notes: 'Disease detected, treatment needed'
    }
  ]);
  // No demo boundaries on the map - keep it clean
  const [fieldBoundaries, setFieldBoundaries] = useState<FieldBoundary[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([40.7128, -74.0060]); // Default to NYC
  const [mapZoom, setMapZoom] = useState(15);
  const [showDrawingModal, setShowDrawingModal] = useState(false);
  const [showAreaForm, setShowAreaForm] = useState(false);
  const [drawnPolygon, setDrawnPolygon] = useState<{ coordinates: [number, number][]; area: number } | null>(null);
  const [newAreaData, setNewAreaData] = useState({
    name: '',
    cropType: '',
    plantingDate: '',
    expectedHarvest: '',
    notes: ''
  });
  const [farmStats, setFarmStats] = useState({
    totalArea: 0,
    healthyCrops: 0,
    warningCrops: 0,
    unhealthyCrops: 0,
    lastSurvey: 'Never'
  });

  useEffect(() => {
    loadFarmData();
  }, []);

  // Recalculate statistics whenever farm areas change
  useEffect(() => {
    const totalArea = farmAreas.reduce((sum, area) => sum + (area.area || 0), 0);
    const healthyCrops = farmAreas.filter(area => area.healthStatus === 'healthy').length;
    const warningCrops = farmAreas.filter(area => area.healthStatus === 'warning').length;
    const unhealthyCrops = farmAreas.filter(area => area.healthStatus === 'unhealthy').length;

    setFarmStats({
      totalArea: totalArea,
      healthyCrops: healthyCrops,
      warningCrops: warningCrops,
      unhealthyCrops: unhealthyCrops,
      lastSurvey: farmAreas.length > 0 ? 'Today' : 'Never'
    });
  }, [farmAreas]);

  const loadFarmData = async () => {
    try {
      // Load farm areas from backend
      const areasResponse = await fetch('http://localhost:8000/api/farm-areas');
      if (areasResponse.ok) {
        const areasData = await areasResponse.json();
        // Keep demo data and add backend data
        const demoAreas = farmAreas.filter(area => area.id.startsWith('demo-'));
        const backendAreas = areasData.areas || [];
        setFarmAreas([...demoAreas, ...backendAreas]);
      } else {
        console.warn('Backend not available, keeping demo data');
      }

      // Generate field boundaries from areas
      const boundaries: FieldBoundary[] = farmAreas.map(area => ({
        id: area.id,
        name: area.name,
        coordinates: [
          [area.coordinates.lat - 0.001, area.coordinates.lng - 0.001],
          [area.coordinates.lat + 0.001, area.coordinates.lng - 0.001],
          [area.coordinates.lat + 0.001, area.coordinates.lng + 0.001],
          [area.coordinates.lat - 0.001, area.coordinates.lng + 0.001],
          [area.coordinates.lat - 0.001, area.coordinates.lng - 0.001]
        ],
        cropType: area.cropType,
        healthStatus: area.healthStatus,
        ndviValue: area.ndviValue
      }));
      setFieldBoundaries(boundaries);

    } catch (error) {
      console.error('Error loading farm data:', error);
    }
  };

  const handleAreaSelect = (area: FarmArea) => {
    setSelectedArea(area);
    setSelectedCrop(area.cropType);
    // Don't change the view, just show the selected area details
  };

  const handleAreaUpdate = (updatedArea: FarmArea) => {
    setFarmAreas(prev => prev.map(area => 
      area.id === updatedArea.id ? updatedArea : area
    ));
    loadFarmData(); // Refresh data
  };

  const handleAreaDelete = (areaId: string) => {
    setFarmAreas(prev => prev.filter(area => area.id !== areaId));
    setFieldBoundaries(prev => prev.filter(boundary => boundary.id !== areaId));
    loadFarmData(); // Refresh data
  };

  const handleLocationSelect = (lat: number, lng: number, address: string) => {
    setMapCenter([lat, lng]);
    setMapZoom(16);
    console.log('Selected location:', address, lat, lng);
  };

  const handlePolygonCreated = (coordinates: [number, number][], area: number) => {
    setDrawnPolygon({ coordinates, area });
    setShowDrawingModal(false);
    setShowAreaForm(true);
  };

  const handleSaveNewArea = async () => {
    if (!drawnPolygon || !newAreaData.name || !newAreaData.cropType) {
      alert('Please fill in all required fields (Name and Crop Type)');
      return;
    }

    // Calculate center point of polygon
    const avgLat = drawnPolygon.coordinates.reduce((sum, coord) => sum + coord[0], 0) / drawnPolygon.coordinates.length;
    const avgLng = drawnPolygon.coordinates.reduce((sum, coord) => sum + coord[1], 0) / drawnPolygon.coordinates.length;

    const newArea: FarmArea = {
      id: Date.now().toString(),
      name: newAreaData.name,
      cropType: newAreaData.cropType,
      area: drawnPolygon.area / 4046.86, // Convert to acres
      coordinates: { lat: avgLat, lng: avgLng },
      healthStatus: 'healthy',
      ndviValue: 0.75,
      lastAssessment: new Date().toISOString().split('T')[0],
      notes: newAreaData.notes
    };

    // Add to farm areas
    setFarmAreas(prev => [...prev, newArea]);

    // Create boundary
    const newBoundary: FieldBoundary = {
      id: newArea.id,
      name: newArea.name,
      coordinates: drawnPolygon.coordinates,
      cropType: newArea.cropType,
      healthStatus: 'healthy',
      ndviValue: 0.75
    };

    setFieldBoundaries(prev => [...prev, newBoundary]);

    // Try to save to backend
    try {
      const response = await fetch('http://localhost:8000/api/farm-areas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newArea.name,
          crop_type: newArea.cropType,
          area: newArea.area,
          coordinates: { lat: avgLat, lng: avgLng },
          geometry: {
            type: 'Polygon',
            coordinates: [drawnPolygon.coordinates]
          },
          health_status: 'healthy',
          ndvi_value: 0.75,
          notes: newAreaData.notes
        })
      });

      if (response.ok) {
        console.log('Farm area saved to backend');
      }
    } catch (error) {
      console.error('Error saving to backend:', error);
    }

    // Reset form
    setShowAreaForm(false);
    setDrawnPolygon(null);
    setNewAreaData({
      name: '',
      cropType: '',
      plantingDate: '',
      expectedHarvest: '',
      notes: ''
    });

    // Reload data
    loadFarmData();
  };

  const handleCancelNewArea = () => {
    setShowAreaForm(false);
    setDrawnPolygon(null);
    setNewAreaData({
      name: '',
      cropType: '',
      plantingDate: '',
      expectedHarvest: '',
      notes: ''
    });
  };


  const renderCurrentView = () => {
    switch (currentView) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Farm Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <MapPin className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Area</p>
                    <p className="text-2xl font-semibold text-gray-900">{farmStats.totalArea.toFixed(1)} acres</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Healthy Areas</p>
                    <p className="text-2xl font-semibold text-green-600">{farmStats.healthyCrops}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-8 w-8 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Warning Areas</p>
                    <p className="text-2xl font-semibold text-yellow-600">{farmStats.warningCrops}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Critical Areas</p>
                    <p className="text-2xl font-semibold text-red-600">{farmStats.unhealthyCrops}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Location Search Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Find Your Farm</h2>
              <p className="text-sm text-gray-600 mb-4">
                Search for your farm location to get started
              </p>
              <LocationSearch onLocationSelect={handleLocationSelect} />
            </div>

            {/* Interactive Farm Map */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Interactive Farm Map</h2>
                <p className="text-sm text-gray-600 mt-1">
                  View your farm areas, health zones, and NDVI data
                </p>
              </div>
              <div className="p-6">
                <div className="h-[500px] rounded-lg overflow-hidden border border-gray-200">
                  <AnnotatedFarmMap
                    areas={farmAreas}
                    boundaries={fieldBoundaries}
                    onAreaSelect={handleAreaSelect}
                    onBoundarySelect={(boundary) => {
                      const area = farmAreas.find(a => a.id === boundary.id);
                      if (area) handleAreaSelect(area);
                    }}
                    showNDVI={true}
                    showHealthZones={true}
                    center={mapCenter}
                    zoom={mapZoom}
                  />
                </div>
              </div>
            </div>

            {/* Farm Area Management */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Manage Farm Areas</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Add, edit, and track your farm areas by crop type
                  </p>
                </div>
                <button
                  onClick={() => setShowDrawingModal(true)}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Draw Farm Area
                </button>
              </div>
              <div className="p-6">
                <FarmAreaManager 
                  areas={farmAreas}
                  onAreaSelect={handleAreaSelect}
                  onAreaUpdate={handleAreaUpdate}
                  onAreaDelete={handleAreaDelete}
                />
              </div>
            </div>
          </div>
        );

      case 'areas':
        return (
          <FarmAreaManager 
            areas={farmAreas}
            onAreaSelect={handleAreaSelect}
            onAreaUpdate={handleAreaUpdate}
            onAreaDelete={handleAreaDelete}
          />
        );

      case 'map':
        return (
          <div className="h-[600px]">
            <AnnotatedFarmMap
              areas={farmAreas}
              boundaries={fieldBoundaries}
              onAreaSelect={handleAreaSelect}
              onBoundarySelect={(boundary) => {
                const area = farmAreas.find(a => a.id === boundary.id);
                if (area) handleAreaSelect(area);
              }}
              showNDVI={true}
              showHealthZones={true}
            />
          </div>
        );

      case 'drone':
        return (
          <DroneSurvey onBack={() => setCurrentView('overview')} />
        );

      case 'analysis':
        return (
          <SingleImageUpload 
            onBack={() => setCurrentView('overview')} 
          />
        );

      default:
        return null;
    }
  };

  const renderSelectedAreaView = () => {
    if (!selectedArea) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{selectedArea.name}</h2>
            <p className="text-gray-600">{selectedArea.cropType} • {selectedArea.area} acres</p>
          </div>
          <button
            onClick={() => {
              setSelectedArea(null);
              setCurrentView('overview');
            }}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Back to Overview
          </button>
        </div>

        {selectedCrop && (
          <CropSpecificDashboard 
            cropType={selectedCrop}
            areas={farmAreas.filter(area => area.cropType === selectedCrop)}
          />
        )}

        <HealthProgression 
          areaId={selectedArea.id}
          areaName={selectedArea.name}
          cropType={selectedArea.cropType}
        />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Content */}
      {selectedArea ? renderSelectedAreaView() : renderCurrentView()}

      {/* Drawing Modal */}
      {showDrawingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[2000] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Draw Your Farm Area</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Use the polygon tool to outline your farm area on the map
                </p>
              </div>
              <button
                onClick={() => setShowDrawingModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <DrawableFarmMap
                center={mapCenter}
                zoom={mapZoom}
                onPolygonCreated={handlePolygonCreated}
              />
            </div>
          </div>
        </div>
      )}

      {/* Farm Area Details Form Modal */}
      {showAreaForm && drawnPolygon && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[2000] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Add Farm Area Details</h2>
              <p className="text-sm text-gray-600 mt-1">
                Area: {(drawnPolygon.area / 4046.86).toFixed(2)} acres
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Area Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newAreaData.name}
                  onChange={(e) => setNewAreaData({ ...newAreaData, name: e.target.value })}
                  placeholder="e.g., North Field, Section A"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Crop Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={newAreaData.cropType}
                  onChange={(e) => setNewAreaData({ ...newAreaData, cropType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select a crop</option>
                  <option value="Tomatoes">Tomatoes</option>
                  <option value="Corn">Corn</option>
                  <option value="Potatoes">Potatoes</option>
                  <option value="Wheat">Wheat</option>
                  <option value="Soybeans">Soybeans</option>
                  <option value="Rice">Rice</option>
                  <option value="Cotton">Cotton</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Planting Date
                  </label>
                  <input
                    type="date"
                    value={newAreaData.plantingDate}
                    onChange={(e) => setNewAreaData({ ...newAreaData, plantingDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expected Harvest
                  </label>
                  <input
                    type="date"
                    value={newAreaData.expectedHarvest}
                    onChange={(e) => setNewAreaData({ ...newAreaData, expectedHarvest: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={newAreaData.notes}
                  onChange={(e) => setNewAreaData({ ...newAreaData, notes: e.target.value })}
                  placeholder="Add any additional notes..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={handleCancelNewArea}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNewArea}
                className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
              >
                Save Farm Area
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntegratedDashboard;
