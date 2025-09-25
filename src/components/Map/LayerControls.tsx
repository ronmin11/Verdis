import React from 'react';
import { Layers, Eye, EyeOff, Box, Map as MapIcon } from 'lucide-react';
import { MapLayer } from '../../types';
import { cn } from '../../utils/cn';

interface LayerControlsProps {
  layers: MapLayer[];
  onLayerToggle: (layerId: string) => void;
  onOpacityChange: (layerId: string, opacity: number) => void;
  className?: string;
}

const LayerControls: React.FC<LayerControlsProps> = ({
  layers,
  onLayerToggle,
  onOpacityChange,
  className = ''
}) => {
  const getLayerIcon = (type: string) => {
    switch (type) {
      case 'orthomosaic':
        return <MapIcon className="w-4 h-4" />;
      case 'ndvi':
        return <Layers className="w-4 h-4" />;
      case 'boundaries':
        return <Box className="w-4 h-4" />;
      case '3d-model':
        return <Box className="w-4 h-4" />;
      default:
        return <Layers className="w-4 h-4" />;
    }
  };

  return (
    <div className={`card p-4 ${className}`}>
      <div className="flex items-center space-x-2 mb-4">
        <Layers className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Map Layers</h3>
      </div>

      <div className="space-y-4">
        {layers.map((layer) => (
          <div key={layer.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => onLayerToggle(layer.id)}
                  className={cn(
                    'p-1 rounded transition-colors',
                    layer.visible 
                      ? 'text-primary-600 hover:text-primary-700' 
                      : 'text-gray-400 hover:text-gray-600'
                  )}
                >
                  {layer.visible ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </button>
                
                <div className="flex items-center space-x-2">
                  {getLayerIcon(layer.type)}
                  <span className={cn(
                    'text-sm font-medium',
                    layer.visible ? 'text-gray-900' : 'text-gray-500'
                  )}>
                    {layer.name}
                  </span>
                </div>
              </div>

              {layer.type === '3d-model' && layer.visible && (
                <button className="btn-primary text-xs px-2 py-1">
                  View 3D
                </button>
              )}
            </div>

            {layer.visible && layer.type !== '3d-model' && (
              <div className="ml-8">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Opacity:</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={layer.opacity}
                    onChange={(e) => onOpacityChange(layer.id, parseFloat(e.target.value))}
                    className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <span className="text-xs text-gray-500 w-8">
                    {Math.round(layer.opacity * 100)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Orthomosaic:</strong> High-resolution aerial imagery</p>
          <p><strong>NDVI:</strong> Vegetation health index overlay</p>
          <p><strong>Boundaries:</strong> Field and zone boundaries</p>
          <p><strong>3D Model:</strong> Three-dimensional crop visualization</p>
        </div>
      </div>
    </div>
  );
};

export default LayerControls;