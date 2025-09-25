import React, { useState } from 'react';
import Header from './components/Layout/Header';
import InteractiveMap from './components/Map/InteractiveMap';
import LayerControls from './components/Map/LayerControls';
import WeatherWidget from './components/Weather/WeatherWidget';
import WeatherChart from './components/Weather/WeatherChart';
import HealthList from './components/HealthAssessment/HealthList';
import { 
  mockWeatherData, 
  mockHealthAssessments, 
  mockMapLayers, 
  mockFieldBoundaries 
} from './data/mockData';
import { HealthAssessment, MapLayer } from './types';

function App() {
  const [activeView, setActiveView] = useState('map');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<HealthAssessment>();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [mapLayers, setMapLayers] = useState<MapLayer[]>(mockMapLayers);
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number}>();

  const handleViewChange = (view: string) => {
    setActiveView(view);
    setIsMobileMenuOpen(false);
  };

  const handleMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleAssessmentSelect = (assessment: HealthAssessment) => {
    setSelectedAssessment(assessment);
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
    console.log('Selected location:', { lat, lng });
  };

  const handleToggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const handleLayerToggle = (layerId: string) => {
    setMapLayers(layers => 
      layers.map(layer => 
        layer.id === layerId 
          ? { ...layer, visible: !layer.visible }
          : layer
      )
    );
  };

  const handleOpacityChange = (layerId: string, opacity: number) => {
    setMapLayers(layers => 
      layers.map(layer => 
        layer.id === layerId 
          ? { ...layer, opacity }
          : layer
      )
    );
  };

  if (activeView !== 'map') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header 
          activeView={activeView}
          onViewChange={handleViewChange}
          onMenuToggle={handleMenuToggle}
          isMobileMenuOpen={isMobileMenuOpen}
        />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {activeView === 'dashboard' && 'Dashboard'}
              {activeView === 'reports' && 'Reports'}
              {activeView === 'settings' && 'Settings'}
            </h2>
            <p className="text-gray-600">
              This section is under development. Please use the Map View to explore the crop health assessment features.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        activeView={activeView}
        onViewChange={handleViewChange}
        onMenuToggle={handleMenuToggle}
        isMobileMenuOpen={isMobileMenuOpen}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-140px)]">
          {/* Left Sidebar - Controls and Weather */}
          <div className="lg:col-span-1 space-y-6 overflow-y-auto custom-scrollbar">
            <LayerControls
              layers={mapLayers}
              onLayerToggle={handleLayerToggle}
              onOpacityChange={handleOpacityChange}
            />
            
            <WeatherWidget weatherData={mockWeatherData} />
            
            <div className="hidden xl:block">
              <WeatherChart weatherData={mockWeatherData} />
            </div>
          </div>

          {/* Center - Map */}
          <div className="lg:col-span-2">
            <div className="card p-0 h-full overflow-hidden">
              <InteractiveMap
                healthAssessments={mockHealthAssessments}
                fieldBoundaries={mockFieldBoundaries}
                onLocationSelect={handleLocationSelect}
                onAssessmentSelect={handleAssessmentSelect}
                selectedAssessment={selectedAssessment}
                className="h-full"
              />
            </div>
          </div>

          {/* Right Sidebar - Health Assessments */}
          <div className="lg:col-span-1">
            <HealthList
              assessments={mockHealthAssessments}
              onAssessmentSelect={handleAssessmentSelect}
              selectedAssessment={selectedAssessment}
              expandedItems={expandedItems}
              onToggleExpanded={handleToggleExpanded}
              className="h-full"
            />
          </div>
        </div>

        {/* Mobile Weather Chart */}
        <div className="xl:hidden mt-6">
          <WeatherChart weatherData={mockWeatherData} />
        </div>

        {/* Selected Location Display */}
        {selectedLocation && (
          <div className="fixed bottom-4 left-4 bg-white rounded-lg shadow-soft p-3 border border-gray-200">
            <div className="text-sm">
              <div className="font-medium text-gray-900">Selected Location</div>
              <div className="text-gray-600">
                Lat: {selectedLocation.lat.toFixed(6)}, Lng: {selectedLocation.lng.toFixed(6)}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;