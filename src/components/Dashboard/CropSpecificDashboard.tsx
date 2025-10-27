import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, Calendar, Droplets, Thermometer, Sun } from 'lucide-react';

interface CropData {
  name: string;
  totalArea: number;
  healthyArea: number;
  warningArea: number;
  unhealthyArea: number;
  averageNDVI: number;
  lastAssessment: string;
  expectedYield: number;
  actualYield?: number;
  plantingDate: string;
  harvestDate: string;
}

interface WeatherData {
  date: string;
  temperature: number;
  humidity: number;
  rainfall: number;
  windSpeed: number;
}

interface NDVIData {
  date: string;
  ndvi: number;
  area: string;
}

interface CropSpecificDashboardProps {
  cropType: string;
  areas: any[];
}

const CropSpecificDashboard: React.FC<CropSpecificDashboardProps> = ({ cropType, areas }) => {
  const [cropData, setCropData] = useState<CropData | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  const [ndviData, setNdviData] = useState<NDVIData[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCropData();
  }, [cropType, selectedTimeRange]);

  const loadCropData = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, this would fetch from your backend
      // const response = await fetch(`/api/crop-dashboard/${cropType}?range=${selectedTimeRange}`);
      // const data = await response.json();
      
      // Mock data for demonstration
      const mockCropData: CropData = {
        name: cropType,
        totalArea: areas.reduce((sum, area) => sum + area.area, 0),
        healthyArea: areas.filter(area => area.healthStatus === 'healthy').reduce((sum, area) => sum + area.area, 0),
        warningArea: areas.filter(area => area.healthStatus === 'warning').reduce((sum, area) => sum + area.area, 0),
        unhealthyArea: areas.filter(area => area.healthStatus === 'unhealthy').reduce((sum, area) => sum + area.area, 0),
        averageNDVI: areas.reduce((sum, area) => sum + (area.ndviValue || 0), 0) / areas.length,
        lastAssessment: '2024-01-14',
        expectedYield: 1500, // kg per acre
        actualYield: 1420,
        plantingDate: '2024-03-15',
        harvestDate: '2024-08-15'
      };
      
      setCropData(mockCropData);
      setWeatherData(generateMockWeatherData(selectedTimeRange));
      setNdviData(generateMockNDVIData(selectedTimeRange));
    } catch (error) {
      console.error('Error loading crop data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockWeatherData = (range: string): WeatherData[] => {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365;
    const data: WeatherData[] = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toISOString().split('T')[0],
        temperature: 20 + Math.sin(i * 0.05) * 10 + Math.random() * 5,
        humidity: 60 + Math.sin(i * 0.03) * 20 + Math.random() * 10,
        rainfall: Math.random() > 0.7 ? Math.random() * 20 : 0,
        windSpeed: 5 + Math.random() * 10
      });
    }
    
    return data;
  };

  const generateMockNDVIData = (range: string): NDVIData[] => {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365;
    const data: NDVIData[] = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toISOString().split('T')[0],
        ndvi: 0.7 + Math.sin(i * 0.1) * 0.2 + Math.random() * 0.1,
        area: 'All Areas'
      });
    }
    
    return data;
  };

  const getHealthDistribution = () => {
    if (!cropData) return [];
    
    return [
      { name: 'Healthy', value: cropData.healthyArea, color: '#10b981' },
      { name: 'Warning', value: cropData.warningArea, color: '#f59e0b' },
      { name: 'Unhealthy', value: cropData.unhealthyArea, color: '#ef4444' }
    ];
  };

  const getYieldEfficiency = () => {
    if (!cropData || !cropData.actualYield || !cropData.expectedYield) return 0;
    return (cropData.actualYield / cropData.expectedYield) * 100;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!cropData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No data available for {cropType}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{cropType} Dashboard</h2>
          <p className="text-gray-600">Comprehensive analysis and monitoring</p>
        </div>
        <div className="flex space-x-2">
          {(['7d', '30d', '90d', '1y'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setSelectedTimeRange(range)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                selectedTimeRange === range
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Area</p>
              <p className="text-2xl font-semibold text-gray-900">{cropData.totalArea} acres</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Average NDVI</p>
              <p className="text-2xl font-semibold text-gray-900">{cropData.averageNDVI.toFixed(3)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Yield Efficiency</p>
              <p className="text-2xl font-semibold text-gray-900">{getYieldEfficiency().toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Expected Yield</p>
              <p className="text-2xl font-semibold text-gray-900">{cropData.expectedYield} kg/acre</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* NDVI Trend */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">NDVI Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ndviData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis domain={[0, 1]} />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value: number) => [value.toFixed(3), 'NDVI']}
                />
                <Line
                  type="monotone"
                  dataKey="ndvi"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Health Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Health Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={getHealthDistribution()}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {getHealthDistribution().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value} acres`, 'Area']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Weather Data */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Weather Conditions</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weatherData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="temperature"
                stroke="#ef4444"
                strokeWidth={2}
                name="Temperature (°C)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="humidity"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Humidity (%)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="rainfall"
                stroke="#06b6d4"
                strokeWidth={2}
                name="Rainfall (mm)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Environmental Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Thermometer className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-500">Average Temperature</p>
              <p className="text-2xl font-semibold text-gray-900">
                {weatherData.reduce((sum, day) => sum + day.temperature, 0) / weatherData.length}°C
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Droplets className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-500">Total Rainfall</p>
              <p className="text-2xl font-semibold text-gray-900">
                {weatherData.reduce((sum, day) => sum + day.rainfall, 0).toFixed(1)}mm
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Sun className="h-8 w-8 text-yellow-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-500">Average Humidity</p>
              <p className="text-2xl font-semibold text-gray-900">
                {weatherData.reduce((sum, day) => sum + day.humidity, 0) / weatherData.length}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CropSpecificDashboard;
