import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, FeatureGroup, Polygon, useMap } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import L from 'leaflet';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface DrawableFarmMapProps {
  center?: [number, number];
  zoom?: number;
  onPolygonCreated: (coordinates: [number, number][], area: number) => void;
  existingPolygons?: Array<{
    id: string;
    coordinates: [number, number][];
    name: string;
    cropType: string;
    color: string;
  }>;
}

// Component to update map view when props change
const MapUpdater: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  
  return null;
};

const DrawableFarmMap: React.FC<DrawableFarmMapProps> = ({
  center = [40.7128, -74.0060],
  zoom = 15,
  onPolygonCreated,
  existingPolygons = []
}) => {
  const [mapCenter, setMapCenter] = useState<[number, number]>(center);
  const [mapZoom, setMapZoom] = useState(zoom);
  const [mapLayer, setMapLayer] = useState<'street' | 'satellite' | 'terrain'>('satellite');
  const featureGroupRef = useRef<L.FeatureGroup>(null);

  useEffect(() => {
    setMapCenter(center);
  }, [center]);

  useEffect(() => {
    setMapZoom(zoom);
  }, [zoom]);

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
        return 'Tiles &copy; Esri';
      case 'terrain':
        return 'Map data: &copy; OpenStreetMap contributors';
      case 'street':
      default:
        return '&copy; OpenStreetMap contributors';
    }
  };

  // Calculate polygon area using Shoelace formula (approximate)
  const calculateArea = (coords: [number, number][]): number => {
    if (coords.length < 3) return 0;
    
    let area = 0;
    for (let i = 0; i < coords.length; i++) {
      const j = (i + 1) % coords.length;
      area += coords[i][0] * coords[j][1];
      area -= coords[j][0] * coords[i][1];
    }
    area = Math.abs(area) / 2;
    
    // Convert to approximate square meters (very rough approximation)
    // At equator: 1 degree ≈ 111km, so 1 degree² ≈ 12321 km²
    const metersPerDegree = 111000;
    const areaInSquareMeters = area * metersPerDegree * metersPerDegree;
    
    return areaInSquareMeters;
  };

  const handleCreated = (e: any) => {
    const layer = e.layer;
    const coordinates: [number, number][] = [];
    
    if (layer instanceof L.Polygon) {
      const latlngs = layer.getLatLngs()[0] as L.LatLng[];
      latlngs.forEach((latlng: L.LatLng) => {
        coordinates.push([latlng.lat, latlng.lng]);
      });
      
      // Calculate area
      const area = calculateArea(coordinates);
      
      onPolygonCreated(coordinates, area);
    }
  };

  return (
    <div className="h-[500px] w-full rounded-lg overflow-hidden border border-gray-200 relative">
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

      {/* Drawing Instructions */}
      <div className="absolute top-4 left-4 z-[1000] bg-white rounded-lg shadow-lg border border-gray-200 p-3 max-w-xs">
        <h4 className="text-xs font-semibold text-gray-700 mb-1">Draw Your Farm Area</h4>
        <p className="text-xs text-gray-600">
          Click the polygon tool (⬟) on the left, then click on the map to draw your farm boundary. Double-click to finish.
        </p>
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

        <FeatureGroup ref={featureGroupRef}>
          <EditControl
            position="topleft"
            onCreated={handleCreated}
            draw={{
              rectangle: false,
              circle: false,
              circlemarker: false,
              marker: false,
              polyline: false,
              polygon: {
                allowIntersection: false,
                drawError: {
                  color: '#e74c3c',
                  message: '<strong>Error:</strong> Shape edges cannot cross!'
                },
                shapeOptions: {
                  color: '#3b82f6',
                  fillColor: '#3b82f6',
                  fillOpacity: 0.3
                }
              }
            }}
            edit={{
              edit: false,
              remove: false
            }}
          />

          {/* Display existing polygons */}
          {existingPolygons.map((polygon) => (
            <Polygon
              key={polygon.id}
              positions={polygon.coordinates}
              pathOptions={{
                color: polygon.color,
                fillColor: polygon.color,
                fillOpacity: 0.3,
                weight: 2
              }}
            />
          ))}
        </FeatureGroup>
      </MapContainer>
    </div>
  );
};

export default DrawableFarmMap;
