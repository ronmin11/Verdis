import { WeatherData, HealthAssessment, MapLayer, FieldBoundary } from '../types';

export const mockWeatherData: WeatherData = {
  current: {
    temperature: 24,
    humidity: 68,
    windSpeed: 12,
    windDirection: 225,
    precipitation: 0,
    condition: 'Partly Cloudy',
    icon: 'partly-cloudy'
  },
  forecast: [
    { date: '2025-01-15', high: 26, low: 18, precipitation: 0, condition: 'Sunny', icon: 'sunny' },
    { date: '2025-01-16', high: 28, low: 20, precipitation: 2, condition: 'Light Rain', icon: 'light-rain' },
    { date: '2025-01-17', high: 25, low: 17, precipitation: 8, condition: 'Rain', icon: 'rain' },
    { date: '2025-01-18', high: 23, low: 15, precipitation: 0, condition: 'Cloudy', icon: 'cloudy' },
    { date: '2025-01-19', high: 27, low: 19, precipitation: 0, condition: 'Sunny', icon: 'sunny' },
    { date: '2025-01-20', high: 29, low: 21, precipitation: 1, condition: 'Partly Cloudy', icon: 'partly-cloudy' },
    { date: '2025-01-21', high: 26, low: 18, precipitation: 0, condition: 'Sunny', icon: 'sunny' }
  ],
  historical: [
    { date: '2025-01-08', temperature: 22, precipitation: 0 },
    { date: '2025-01-09', temperature: 24, precipitation: 3 },
    { date: '2025-01-10', temperature: 26, precipitation: 0 },
    { date: '2025-01-11', temperature: 25, precipitation: 1 },
    { date: '2025-01-12', temperature: 23, precipitation: 5 },
    { date: '2025-01-13', temperature: 21, precipitation: 12 },
    { date: '2025-01-14', temperature: 24, precipitation: 0 }
  ]
};

export const mockHealthAssessments: HealthAssessment[] = [
  {
    id: '1',
    location: { lat: 40.7128, lng: -74.0060, identifier: 'Field A, Zone 1' },
    healthStatus: 'healthy',
    confidence: 94,
    lastAssessed: '2025-01-14T10:30:00Z',
    ndviValue: 0.78
  },
  {
    id: '2',
    location: { lat: 40.7130, lng: -74.0058, identifier: 'Field A, Zone 2' },
    healthStatus: 'warning',
    confidence: 87,
    predictedIssue: {
      disease: 'Early Blight',
      confidence: 87,
      recommendedAction: 'Apply copper-based fungicide within 48 hours. Monitor closely.',
      severity: 'medium'
    },
    lastAssessed: '2025-01-14T10:32:00Z',
    ndviValue: 0.65
  },
  {
    id: '3',
    location: { lat: 40.7132, lng: -74.0056, identifier: 'Field A, Zone 3' },
    healthStatus: 'unhealthy',
    confidence: 92,
    predictedIssue: {
      disease: 'Late Blight',
      pest: 'Spider Mites',
      confidence: 92,
      recommendedAction: 'Immediate treatment required. Apply systemic fungicide and miticide. Consider crop rotation.',
      severity: 'high'
    },
    lastAssessed: '2025-01-14T10:34:00Z',
    ndviValue: 0.42
  },
  {
    id: '4',
    location: { lat: 40.7134, lng: -74.0054, identifier: 'Field B, Zone 1' },
    healthStatus: 'healthy',
    confidence: 96,
    lastAssessed: '2025-01-14T10:36:00Z',
    ndviValue: 0.82
  },
  {
    id: '5',
    location: { lat: 40.7136, lng: -74.0052, identifier: 'Field B, Zone 2' },
    healthStatus: 'warning',
    confidence: 89,
    predictedIssue: {
      disease: 'Powdery Mildew',
      confidence: 89,
      recommendedAction: 'Increase air circulation. Apply preventive fungicide spray.',
      severity: 'low'
    },
    lastAssessed: '2025-01-14T10:38:00Z',
    ndviValue: 0.68
  }
];

export const mockMapLayers: MapLayer[] = [
  {
    id: 'orthomosaic',
    name: 'Orthomosaic Imagery',
    type: 'orthomosaic',
    visible: true,
    opacity: 1.0
  },
  {
    id: 'ndvi',
    name: 'NDVI Overlay',
    type: 'ndvi',
    visible: false,
    opacity: 0.7
  },
  {
    id: 'boundaries',
    name: 'Field Boundaries',
    type: 'boundaries',
    visible: true,
    opacity: 1.0
  },
  {
    id: '3d-model',
    name: '3D Model View',
    type: '3d-model',
    visible: false,
    opacity: 1.0
  }
];

export const mockFieldBoundaries: FieldBoundary[] = [
  {
    id: 'field-a',
    name: 'Field A - Tomatoes',
    coordinates: [
      [40.7125, -74.0065],
      [40.7135, -74.0065],
      [40.7135, -74.0050],
      [40.7125, -74.0050],
      [40.7125, -74.0065]
    ],
    area: 2.5,
    cropType: 'Tomatoes'
  },
  {
    id: 'field-b',
    name: 'Field B - Corn',
    coordinates: [
      [40.7135, -74.0065],
      [40.7145, -74.0065],
      [40.7145, -74.0045],
      [40.7135, -74.0045],
      [40.7135, -74.0065]
    ],
    area: 3.2,
    cropType: 'Corn'
  }
];