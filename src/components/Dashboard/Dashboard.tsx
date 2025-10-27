import React, { useState, useEffect } from 'react';
import { Upload, Camera, Drone, Image as ImageIcon, TrendingUp, MapPin, AlertTriangle } from 'lucide-react';

interface DashboardProps {
  onSelectOption: (option: 'drone' | 'single') => void;
}

interface FarmStats {
  totalArea: number;
  healthyCrops: number;
  warningCrops: number;
  unhealthyCrops: number;
  lastSurvey: string;
}

const Dashboard: React.FC<DashboardProps> = ({ onSelectOption }) => {
  const [farmStats, setFarmStats] = useState<FarmStats>({
    totalArea: 0,
    healthyCrops: 0,
    warningCrops: 0,
    unhealthyCrops: 0,
    lastSurvey: 'Never'
  });

  useEffect(() => {
    // Load farm statistics from backend
    loadFarmStats();
  }, []);

  const loadFarmStats = async () => {
    try {
      // In a real implementation, this would fetch from your backend
      // const response = await fetch('/api/farm-stats');
      // const stats = await response.json();
      
      // Mock data for now
      setFarmStats({
        totalArea: 125.5,
        healthyCrops: 85,
        warningCrops: 12,
        unhealthyCrops: 3,
        lastSurvey: '2 days ago'
      });
    } catch (error) {
      console.error('Error loading farm stats:', error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Farm Health Dashboard</h1>
        <p className="text-gray-600">Monitor your crop health and make data-driven decisions</p>
      </div>

      {/* Farm Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <MapPin className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Area</p>
              <p className="text-2xl font-semibold text-gray-900">{farmStats.totalArea} acres</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Healthy Crops</p>
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

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Drone Surveying Option */}
        <div 
          className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow duration-300 cursor-pointer"
          onClick={() => onSelectOption('drone')}
        >
          <div className="p-6">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 mb-4 mx-auto">
              <Drone className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2 text-center">Drone Survey</h2>
            <p className="text-gray-600 text-center mb-4">
              Upload drone survey images to generate orthomosaics and analyze large areas with NDVI mapping.
            </p>
            <div className="text-sm text-gray-500 text-center">
              Last survey: {farmStats.lastSurvey}
            </div>
          </div>
          <div className="bg-blue-50 px-6 py-4 border-t border-gray-100">
            <div className="text-sm text-blue-600 font-medium text-center">
              Start Survey <span aria-hidden="true">→</span>
            </div>
          </div>
        </div>

        {/* Single Image Upload Option */}
        <div 
          className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow duration-300 cursor-pointer"
          onClick={() => onSelectOption('single')}
        >
          <div className="p-6">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-green-100 text-green-600 mb-4 mx-auto">
              <ImageIcon className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2 text-center">Image Analysis</h2>
            <p className="text-gray-600 text-center mb-4">
              Upload a single crop image for quick health assessment and AI-powered recommendations.
            </p>
            <div className="text-sm text-gray-500 text-center">
              Instant analysis with AI chatbot
            </div>
          </div>
          <div className="bg-green-50 px-6 py-4 border-t border-gray-100">
            <div className="text-sm text-green-600 font-medium text-center">
              Analyze Image <span aria-hidden="true">→</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
