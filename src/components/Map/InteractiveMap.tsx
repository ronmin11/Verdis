import React, { useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { HealthAssessment, FieldBoundary } from '../../types';
import { TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, CircleAlert as AlertCircle, MapPin } from 'lucide-react';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface InteractiveMapProps {
  healthAssessments: HealthAssessment[];
  fieldBoundaries: FieldBoundary[];
  onLocationSelect: (lat: number, lng: number) => void;
  onAssessmentSelect: (assessment: HealthAssessment) => void;
  selectedAssessment?: HealthAssessment;
  className?: string;
}

// Custom marker icons
const createCustomIcon = (status: string) => {
  const colors = {
    healthy: '#22c55e',
    warning: '#eab308',
    unhealthy: '#ef4444'
  };

  return L.divIcon({
    html: `
      <div style="
        background-color: ${colors[status as keyof typeof colors]};
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 8px;
          height: 8px;
          background-color: white;
          border-radius: 50%;
        "></div>
      </div>
    `,
    className: 'custom-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

const MapClickHandler: React.FC<{ onLocationSelect: (lat: number, lng: number) => void }> = ({ 
  onLocationSelect 
}) => {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
};

const InteractiveMap: React.FC<InteractiveMapProps> = ({
  healthAssessments,
  fieldBoundaries,
  onLocationSelect,
  onAssessmentSelect,
  selectedAssessment,
  className = ''
}) => {
  const mapRef = useRef<L.Map>(null);
  const [mapCenter] = useState<[number, number]>([40.7128, -74.0060]);
  const [mapZoom] = useState(15);
  const [mapReady, setMapReady] = useState(false);

  // Handle map ready state
  const handleMapReady = useCallback(() => {
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current?.invalidateSize();
        setMapReady(true);
      }, 100);
    }
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-primary-600" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-secondary-600" />;
      case 'unhealthy':
        return <AlertTriangle className="w-4 h-4 text-danger-600" />;
      default:
        return <MapPin className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return '#22c55e';
      case 'warning':
        return '#eab308';
      case 'unhealthy':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  // Set the map container to take full width/height of its parent
  const containerStyle = {
    width: '100%',
    height: '100%',
    minHeight: '500px',
    borderRadius: '0.5rem',
    overflow: 'hidden',
    zIndex: 0
  };

  return (
    <div className={`relative ${className}`} style={{ height: '500px', width: '100%' }}>
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        whenReady={handleMapReady}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapClickHandler onLocationSelect={onLocationSelect} />

        {/* Field Boundaries */}
        {fieldBoundaries.map((field) => (
          <Polygon
            key={field.id}
            positions={field.coordinates}
            pathOptions={{
              color: '#3b82f6',
              weight: 2,
              opacity: 0.8,
              fillColor: '#3b82f6',
              fillOpacity: 0.1
            }}
          >
            <Popup>
              <div className="p-2">
                <h4 className="font-semibold text-gray-900">{field.name}</h4>
                <p className="text-sm text-gray-600">Area: {field.area} hectares</p>
                <p className="text-sm text-gray-600">Crop: {field.cropType}</p>
              </div>
            </Popup>
          </Polygon>
        ))}

        {/* Health Assessment Markers */}
        {healthAssessments.map((assessment) => (
          <Marker
            key={assessment.id}
            position={[assessment.location.lat, assessment.location.lng]}
            icon={createCustomIcon(assessment.healthStatus)}
            eventHandlers={{
              click: () => onAssessmentSelect(assessment)
            }}
          >
            <Popup>
              <div className="p-3 min-w-[250px]">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">
                    {assessment.location.identifier}
                  </h4>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(assessment.healthStatus)}
                    <span className={`text-sm font-medium capitalize`} 
                          style={{ color: getStatusColor(assessment.healthStatus) }}>
                      {assessment.healthStatus}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Confidence:</span>
                    <span className="font-medium">{assessment.confidence}%</span>
                  </div>
                  
                  {assessment.ndviValue && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">NDVI:</span>
                      <span className="font-medium">{assessment.ndviValue.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Assessed:</span>
                    <span className="font-medium">
                      {new Date(assessment.lastAssessed).toLocaleDateString()}
                    </span>
                  </div>

                  {assessment.predictedIssue && (
                    <div className="pt-2 border-t border-gray-200">
                      <div className="font-medium text-danger-700 mb-1">
                        {assessment.predictedIssue.disease}
                        {assessment.predictedIssue.pest && ` & ${assessment.predictedIssue.pest}`}
                      </div>
                      <p className="text-xs text-gray-600">
                        {assessment.predictedIssue.recommendedAction}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map Controls Overlay */}
      <div className="absolute top-4 right-4 z-[1000]">
        <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-soft p-2">
          <div className="text-xs text-gray-600 mb-2">Click map to select location</div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-xs">
              <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
              <span>Healthy</span>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <div className="w-3 h-3 bg-secondary-500 rounded-full"></div>
              <span>Warning</span>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <div className="w-3 h-3 bg-danger-500 rounded-full"></div>
              <span>Unhealthy</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveMap;