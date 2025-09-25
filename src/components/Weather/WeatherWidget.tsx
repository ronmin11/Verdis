import React from 'react';
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Eye,
  CloudRain,
  Sun,
  Cloud,
  CloudSnow
} from 'lucide-react';
import { WeatherData } from '../../types';

interface WeatherWidgetProps {
  weatherData: WeatherData;
  className?: string;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ weatherData, className = '' }) => {
  const { current } = weatherData;

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'sunny':
        return <Sun className="w-8 h-8 text-yellow-500" />;
      case 'partly-cloudy':
        return <Cloud className="w-8 h-8 text-gray-500" />;
      case 'cloudy':
        return <Cloud className="w-8 h-8 text-gray-600" />;
      case 'rain':
      case 'light-rain':
        return <CloudRain className="w-8 h-8 text-blue-500" />;
      case 'snow':
        return <CloudSnow className="w-8 h-8 text-blue-300" />;
      default:
        return <Sun className="w-8 h-8 text-yellow-500" />;
    }
  };

  const getWindDirection = (degrees: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  };

  return (
    <div className={`card p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Current Weather</h3>
        <div className="flex items-center space-x-2">
          {getWeatherIcon(current.condition)}
        </div>
      </div>

      <div className="space-y-4">
        {/* Temperature */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Thermometer className="w-4 h-4 text-red-500" />
            <span className="text-sm text-gray-600">Temperature</span>
          </div>
          <span className="text-lg font-semibold text-gray-900">{current.temperature}°C</span>
        </div>

        {/* Humidity */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Droplets className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-gray-600">Humidity</span>
          </div>
          <span className="text-sm font-medium text-gray-900">{current.humidity}%</span>
        </div>

        {/* Wind */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Wind className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Wind</span>
          </div>
          <span className="text-sm font-medium text-gray-900">
            {current.windSpeed} km/h {getWindDirection(current.windDirection)}
          </span>
        </div>

        {/* Precipitation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CloudRain className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-gray-600">Precipitation</span>
          </div>
          <span className="text-sm font-medium text-gray-900">{current.precipitation} mm</span>
        </div>

        {/* Condition */}
        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">Conditions</span>
            </div>
            <span className="text-sm font-medium text-gray-900">{current.condition}</span>
          </div>
        </div>
      </div>

      {/* Quick forecast */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <h4 className="text-sm font-medium text-gray-700 mb-2">7-Day Outlook</h4>
        <div className="grid grid-cols-7 gap-1">
          {weatherData.forecast.map((day, index) => (
            <div key={index} className="text-center">
              <div className="text-xs text-gray-500 mb-1">
                {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div className="flex justify-center mb-1">
                {getWeatherIcon(day.condition)}
              </div>
              <div className="text-xs">
                <div className="font-medium text-gray-900">{day.high}°</div>
                <div className="text-gray-500">{day.low}°</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;