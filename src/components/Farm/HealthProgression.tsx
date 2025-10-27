import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, Calendar } from 'lucide-react';

interface HealthDataPoint {
  date: string;
  ndvi: number;
  healthScore: number;
  temperature: number;
  humidity: number;
  rainfall: number;
}

interface HealthProgressionProps {
  areaId: string;
  areaName: string;
  cropType: string;
}

const HealthProgression: React.FC<HealthProgressionProps> = ({ areaId, areaName, cropType }) => {
  const [healthData, setHealthData] = useState<HealthDataPoint[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<'ndvi' | 'healthScore'>('ndvi');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHealthData();
  }, [areaId, timeRange]);

  const loadHealthData = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, this would fetch from your backend
      // const response = await fetch(`/api/health-progression/${areaId}?range=${timeRange}`);
      // const data = await response.json();
      
      // Mock data for demonstration
      const mockData: HealthDataPoint[] = generateMockHealthData(timeRange);
      setHealthData(mockData);
    } catch (error) {
      console.error('Error loading health data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockHealthData = (range: string): HealthDataPoint[] => {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365;
    const data: HealthDataPoint[] = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Generate realistic NDVI and health score data
      const baseNDVI = 0.7;
      const variation = Math.sin(i * 0.1) * 0.2 + Math.random() * 0.1;
      const ndvi = Math.max(0, Math.min(1, baseNDVI + variation));
      
      const healthScore = Math.round(ndvi * 100);
      
      data.push({
        date: date.toISOString().split('T')[0],
        ndvi: parseFloat(ndvi.toFixed(3)),
        healthScore,
        temperature: 20 + Math.sin(i * 0.05) * 10 + Math.random() * 5,
        humidity: 60 + Math.sin(i * 0.03) * 20 + Math.random() * 10,
        rainfall: Math.random() > 0.7 ? Math.random() * 20 : 0,
      });
    }
    
    return data;
  };

  const getHealthTrend = () => {
    if (healthData.length < 2) return { direction: 'stable', change: 0 };
    
    const recent = healthData.slice(-7);
    const older = healthData.slice(0, 7);
    
    const recentAvg = recent.reduce((sum, point) => sum + point.ndvi, 0) / recent.length;
    const olderAvg = older.reduce((sum, point) => sum + point.ndvi, 0) / older.length;
    
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    return {
      direction: change > 5 ? 'improving' : change < -5 ? 'declining' : 'stable',
      change: Math.abs(change)
    };
  };

  const getHealthStatus = (ndvi: number) => {
    if (ndvi >= 0.7) return { status: 'healthy', color: 'text-green-600', bg: 'bg-green-100' };
    if (ndvi >= 0.5) return { status: 'warning', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { status: 'unhealthy', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const trend = getHealthTrend();
  const currentHealth = healthData[healthData.length - 1];
  const healthStatus = currentHealth ? getHealthStatus(currentHealth.ndvi) : null;

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{areaName}</h3>
          <p className="text-sm text-gray-600">{cropType} • Health Progression</p>
        </div>
        <div className="flex space-x-2">
          {(['7d', '30d', '90d', '1y'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                timeRange === range
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Current Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Current NDVI</p>
              <p className="text-2xl font-semibold text-gray-900">
                {currentHealth?.ndvi.toFixed(3) || 'N/A'}
              </p>
            </div>
            <div className={`p-2 rounded-full ${healthStatus?.bg}`}>
              <span className="text-lg">{healthStatus?.status === 'healthy' ? '🟢' : healthStatus?.status === 'warning' ? '🟡' : '🔴'}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Health Score</p>
              <p className="text-2xl font-semibold text-gray-900">
                {currentHealth?.healthScore || 'N/A'}%
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Trend</p>
              <p className={`text-lg font-semibold ${
                trend.direction === 'improving' ? 'text-green-600' : 
                trend.direction === 'declining' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {trend.direction === 'improving' ? '↗' : 
                 trend.direction === 'declining' ? '↘' : '→'} {trend.change.toFixed(1)}%
              </p>
            </div>
            {trend.direction === 'improving' ? (
              <TrendingUp className="h-8 w-8 text-green-600" />
            ) : trend.direction === 'declining' ? (
              <TrendingDown className="h-8 w-8 text-red-600" />
            ) : (
              <AlertTriangle className="h-8 w-8 text-gray-600" />
            )}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-semibold text-gray-900">Health Metrics Over Time</h4>
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedMetric('ndvi')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                selectedMetric === 'ndvi'
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              NDVI
            </button>
            <button
              onClick={() => setSelectedMetric('healthScore')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                selectedMetric === 'healthScore'
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Health Score
            </button>
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={healthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis 
                domain={selectedMetric === 'ndvi' ? [0, 1] : [0, 100]}
                tickFormatter={(value) => selectedMetric === 'ndvi' ? value.toFixed(2) : `${value}%`}
              />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value: number) => [
                  selectedMetric === 'ndvi' ? value.toFixed(3) : `${value}%`,
                  selectedMetric === 'ndvi' ? 'NDVI' : 'Health Score'
                ]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey={selectedMetric}
                stroke={selectedMetric === 'ndvi' ? '#10b981' : '#3b82f6'}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Environmental Factors */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Environmental Factors</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-semibold text-blue-600">
              {currentHealth?.temperature.toFixed(1)}°C
            </div>
            <div className="text-sm text-gray-500">Temperature</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-blue-600">
              {currentHealth?.humidity.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500">Humidity</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-blue-600">
              {currentHealth?.rainfall.toFixed(1)}mm
            </div>
            <div className="text-sm text-gray-500">Rainfall</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthProgression;
