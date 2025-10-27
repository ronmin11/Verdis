import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, AlertTriangle, TrendingUp, Info } from 'lucide-react';

interface FarmArea {
  id: string;
  name: string;
  cropType: string;
  area: number;
  coordinates: { lat: number; lng: number };
  healthStatus: 'healthy' | 'warning' | 'unhealthy';
  ndviValue?: number;
  lastAssessment: string;
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

interface AnnotatedFarmMapProps {
  areas: FarmArea[];
  boundaries: FieldBoundary[];
  onAreaSelect?: (area: FarmArea) => void;
  onBoundarySelect?: (boundary: FieldBoundary) => void;
  showNDVI?: boolean;
  showHealthZones?: boolean;
  center?: [number, number];
  zoom?: number;
}

// Component to update map view when props change
const MapUpdater: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  
  return null;
};

const AnnotatedFarmMap: React.FC<AnnotatedFarmMapProps> = ({
  areas,
  boundaries,
  onAreaSelect,
  onBoundarySelect,
  showNDVI = true,
  showHealthZones = true,
  center,
  zoom,
}) => {
  const [selectedArea, setSelectedArea] = useState<FarmArea | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(center || [40.7128, -74.0060]);
  const [mapZoom, setMapZoom] = useState(zoom || 15);
  const [mapLayer, setMapLayer] = useState<'street' | 'satellite' | 'terrain'>('satellite');

  useEffect(() => {
    if (center) {
      setMapCenter(center);
    } else if (areas.length > 0) {
      // Calculate center based on areas
      const avgLat = areas.reduce((sum, area) => sum + area.coordinates.lat, 0) / areas.length;
      const avgLng = areas.reduce((sum, area) => sum + area.coordinates.lng, 0) / areas.length;
      setMapCenter([avgLat, avgLng]);
    }
  }, [areas, center]);

  useEffect(() => {
    if (zoom) {
      setMapZoom(zoom);
    }
  }, [zoom]);

  const getHealthColor = (status: string, ndvi?: number) => {
    if (showNDVI && ndvi !== undefined) {
      if (ndvi >= 0.7) return '#10b981'; // green
      if (ndvi >= 0.5) return '#f59e0b'; // yellow
      return '#ef4444'; // red
    }
    
    switch (status) {
      case 'healthy': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'unhealthy': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy': return '🟢';
      case 'warning': return '🟡';
      case 'unhealthy': return '🔴';
      default: return '⚪';
    }
  };

  const createCustomIcon = (status: string, ndvi?: number) => {
    const color = getHealthColor(status, ndvi);
    return new Icon({
      iconUrl: `data:image/svg+xml;base64,${btoa(`
        <svg width="24" height="24" viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2"/>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="white"/>
        </svg>
      `)}`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12],
    });
  };

  const handleAreaClick = (area: FarmArea) => {
    setSelectedArea(area);
    onAreaSelect?.(area);
  };

  const handleBoundaryClick = (boundary: FieldBoundary) => {
    onBoundarySelect?.(boundary);
  };

  const getTileLayerUrl = () => {
    switch (mapLayer) {
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'terrain':
        return 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      case 'street':
      default:
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
  };

  const getTileLayerAttribution = () => {
    switch (mapLayer) {
      case 'satellite':
        return 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';
      case 'terrain':
        return 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>';
      case 'street':
      default:
        return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
    }
  };

  return (
    <div className="h-[600px] w-full rounded-lg overflow-hidden border border-gray-200 relative">
      {/* Map Layer Controls */}
      <div className="absolute top-4 right-4 z-[1000] bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        <div className="flex flex-col">
          <button
            onClick={() => setMapLayer('satellite')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              mapLayer === 'satellite'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            🛰️ Satellite
          </button>
          <button
            onClick={() => setMapLayer('terrain')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-t border-gray-200 ${
              mapLayer === 'terrain'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            🏔️ Terrain
          </button>
          <button
            onClick={() => setMapLayer('street')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-t border-gray-200 ${
              mapLayer === 'street'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            🗺️ Street
          </button>
        </div>
      </div>


      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <MapUpdater center={mapCenter} zoom={mapZoom} />
        <TileLayer
          key={mapLayer}
          attribution={getTileLayerAttribution()}
          url={getTileLayerUrl()}
          maxZoom={19}
        />
        
        {/* Field Boundaries */}
        {boundaries.map((boundary) => (
          <Polygon
            key={boundary.id}
            positions={boundary.coordinates}
            color={getHealthColor(boundary.healthStatus, boundary.ndviValue)}
            fillColor={getHealthColor(boundary.healthStatus, boundary.ndviValue)}
            fillOpacity={0.3}
            weight={2}
            eventHandlers={{
              click: () => handleBoundaryClick(boundary),
            }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold text-gray-900">{boundary.name}</h3>
                <p className="text-sm text-gray-600">{boundary.cropType}</p>
                <div className="flex items-center mt-2">
                  <span className="text-sm text-gray-500">Health:</span>
                  <span className={`ml-2 text-sm font-medium ${
                    boundary.healthStatus === 'healthy' ? 'text-green-600' :
                    boundary.healthStatus === 'warning' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {getHealthIcon(boundary.healthStatus)} {boundary.healthStatus}
                  </span>
                </div>
                {boundary.ndviValue && (
                  <div className="text-sm text-gray-500 mt-1">
                    NDVI: {boundary.ndviValue.toFixed(3)}
                  </div>
                )}
              </div>
            </Popup>
          </Polygon>
        ))}
        
        {/* Farm Areas */}
        {areas.map((area) => (
          <Marker
            key={area.id}
            position={[area.coordinates.lat, area.coordinates.lng]}
            icon={createCustomIcon(area.healthStatus, area.ndviValue)}
            eventHandlers={{
              click: () => handleAreaClick(area),
            }}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <h3 className="font-semibold text-gray-900">{area.name}</h3>
                <p className="text-sm text-gray-600">{area.cropType}</p>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Area:</span>
                    <span className="text-sm font-medium">{area.area} acres</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Health:</span>
                    <span className={`text-sm font-medium ${
                      area.healthStatus === 'healthy' ? 'text-green-600' :
                      area.healthStatus === 'warning' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {getHealthIcon(area.healthStatus)} {area.healthStatus}
                    </span>
                  </div>
                  {area.ndviValue && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">NDVI:</span>
                      <span className="text-sm font-medium">{area.ndviValue.toFixed(3)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Last Assessment:</span>
                    <span className="text-sm font-medium">{area.lastAssessment}</span>
                  </div>
                  {area.notes && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-600">{area.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Map Legend */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 z-[1000]">
        <h4 className="font-semibold text-gray-900 mb-2">Legend</h4>
        <div className="space-y-2">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">Healthy (NDVI ≥ 0.7)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">Warning (NDVI 0.5-0.7)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">Unhealthy (NDVI &lt; 0.5)</span>
          </div>
        </div>
      </div>
      
      {/* Map Controls */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-2 z-[1000]">
        <div className="flex space-x-2">
          <button
            onClick={() => setMapZoom(mapZoom + 1)}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
          >
            +
          </button>
          <button
            onClick={() => setMapZoom(mapZoom - 1)}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
          >
            -
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnnotatedFarmMap;
