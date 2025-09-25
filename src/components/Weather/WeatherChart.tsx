import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { WeatherData } from '../../types';

interface WeatherChartProps {
  weatherData: WeatherData;
  className?: string;
}

const WeatherChart: React.FC<WeatherChartProps> = ({ weatherData, className = '' }) => {
  // Combine historical and forecast data
  const chartData = [
    ...weatherData.historical.map(day => ({
      date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      temperature: day.temperature,
      precipitation: day.precipitation,
      type: 'historical'
    })),
    ...weatherData.forecast.map(day => ({
      date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      temperature: (day.high + day.low) / 2,
      precipitation: day.precipitation,
      type: 'forecast'
    }))
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-soft">
          <p className="text-sm font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey === 'temperature' ? 'Temperature' : 'Precipitation'}: {entry.value}
              {entry.dataKey === 'temperature' ? '°C' : 'mm'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`card p-4 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Weather Trends</h3>
        <p className="text-sm text-gray-600">7-day historical and forecast data</p>
      </div>

      <div className="space-y-6">
        {/* Temperature Chart */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Temperature (°C)</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="temperature" 
                  stroke="#22c55e" 
                  strokeWidth={2}
                  dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#22c55e', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Precipitation Chart */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Precipitation (mm)</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="precipitation" 
                  fill="#3b82f6"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
            <span className="text-gray-600">Temperature</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600">Precipitation</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherChart;