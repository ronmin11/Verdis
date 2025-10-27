import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, MapPin, Calendar, TrendingUp } from 'lucide-react';

interface FarmArea {
  id: string;
  name: string;
  cropType: string;
  area: number; // in acres
  coordinates: {
    lat: number;
    lng: number;
  };
  plantingDate: string;
  expectedHarvest: string;
  healthStatus: 'healthy' | 'warning' | 'unhealthy';
  ndviValue?: number;
  lastAssessment: string;
  notes?: string;
}

interface FarmAreaManagerProps {
  areas?: FarmArea[];
  onAreaSelect?: (area: FarmArea) => void;
  onAreaUpdate?: (area: FarmArea) => void;
  onAreaDelete?: (areaId: string) => void;
}

const FarmAreaManager: React.FC<FarmAreaManagerProps> = ({ 
  areas: propAreas, 
  onAreaSelect, 
  onAreaUpdate,
  onAreaDelete 
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingArea, setEditingArea] = useState<FarmArea | null>(null);
  const [filter, setFilter] = useState<'all' | 'healthy' | 'warning' | 'unhealthy'>('all');

  // Use areas from props, or empty array if not provided
  const areas = propAreas || [];

  const handleAddArea = (newArea: Omit<FarmArea, 'id'>) => {
    // This is handled by the parent component now through the drawing modal
    setShowAddForm(false);
  };

  const handleEditArea = (updatedArea: FarmArea) => {
    setEditingArea(null);
    onAreaUpdate?.(updatedArea);
  };

  const handleDeleteArea = (areaId: string) => {
    if (window.confirm('Are you sure you want to delete this farm area?')) {
      onAreaDelete?.(areaId);
    }
  };

  const filteredAreas = areas.filter(area => 
    filter === 'all' || area.healthStatus === filter
  );

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'unhealthy': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Farm Areas</h2>
          <p className="text-gray-600">Manage your farm areas and track crop health</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Area
        </button>
      </div>

      {/* Filters */}
      <div className="flex space-x-2">
        {(['all', 'healthy', 'warning', 'unhealthy'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {status === 'all' ? 'All Areas' : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Areas List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAreas.map((area) => (
          <div
            key={area.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onAreaSelect?.(area)}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{area.name}</h3>
                <p className="text-sm text-gray-600">{area.cropType}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingArea(area);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteArea(area.id);
                  }}
                  className="text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Health Status</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getHealthColor(area.healthStatus)}`}>
                  {getHealthIcon(area.healthStatus)} {area.healthStatus}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Area</span>
                <span className="text-sm font-medium">{area.area} acres</span>
              </div>

              {area.ndviValue && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">NDVI</span>
                  <span className="text-sm font-medium">{area.ndviValue.toFixed(2)}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Last Assessment</span>
                <span className="text-sm font-medium">{area.lastAssessment}</span>
              </div>

              {area.notes && (
                <div className="mt-3">
                  <p className="text-sm text-gray-600">{area.notes}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Form Modal */}
      {(showAddForm || editingArea) && (
        <AreaForm
          area={editingArea}
          onSave={editingArea ? handleEditArea : handleAddArea}
          onCancel={() => {
            setShowAddForm(false);
            setEditingArea(null);
          }}
        />
      )}
    </div>
  );
};

// Area Form Component
interface AreaFormProps {
  area?: FarmArea | null;
  onSave: (area: FarmArea) => void;
  onCancel: () => void;
}

const AreaForm: React.FC<AreaFormProps> = ({ area, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: area?.name || '',
    cropType: area?.cropType || '',
    area: area?.area || 0,
    coordinates: area?.coordinates || { lat: 0, lng: 0 },
    plantingDate: area?.plantingDate || '',
    expectedHarvest: area?.expectedHarvest || '',
    healthStatus: area?.healthStatus || 'healthy' as const,
    notes: area?.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const areaData: FarmArea = {
      ...formData,
      id: area?.id || Date.now().toString(),
      ndviValue: area?.ndviValue,
      lastAssessment: area?.lastAssessment || new Date().toISOString().split('T')[0],
    };
    onSave(areaData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4">
          {area ? 'Edit Farm Area' : 'Add New Farm Area'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Area Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Crop Type
            </label>
            <select
              value={formData.cropType}
              onChange={(e) => setFormData(prev => ({ ...prev, cropType: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="">Select crop type</option>
              <option value="Tomatoes">Tomatoes</option>
              <option value="Corn">Corn</option>
              <option value="Potatoes">Potatoes</option>
              <option value="Wheat">Wheat</option>
              <option value="Soybeans">Soybeans</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Area (acres)
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.area}
              onChange={(e) => setFormData(prev => ({ ...prev, area: parseFloat(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Planting Date
              </label>
              <input
                type="date"
                value={formData.plantingDate}
                onChange={(e) => setFormData(prev => ({ ...prev, plantingDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expected Harvest
              </label>
              <input
                type="date"
                value={formData.expectedHarvest}
                onChange={(e) => setFormData(prev => ({ ...prev, expectedHarvest: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Health Status
            </label>
            <select
              value={formData.healthStatus}
              onChange={(e) => setFormData(prev => ({ ...prev, healthStatus: e.target.value as 'healthy' | 'warning' | 'unhealthy' }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="healthy">Healthy</option>
              <option value="warning">Warning</option>
              <option value="unhealthy">Unhealthy</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              {area ? 'Update' : 'Add'} Area
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FarmAreaManager;
