export interface WeatherData {
  current: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    windDirection: number;
    precipitation: number;
    condition: string;
    icon: string;
  };
  forecast: Array<{
    date: string;
    high: number;
    low: number;
    precipitation: number;
    condition: string;
    icon: string;
  }>;
  historical: Array<{
    date: string;
    temperature: number;
    precipitation: number;
  }>;
}

export interface HealthAssessment {
  id: string;
  location: {
    lat: number;
    lng: number;
    identifier: string;
  };
  healthStatus: 'healthy' | 'warning' | 'unhealthy';
  confidence: number;
  predictedIssue?: {
    disease: string;
    pest?: string;
    confidence: number;
    recommendedAction: string;
    severity: 'low' | 'medium' | 'high';
  };
  lastAssessed: string;
  ndviValue?: number;
}

export interface MapLayer {
  id: string;
  name: string;
  type: 'orthomosaic' | 'ndvi' | 'boundaries' | '3d-model';
  visible: boolean;
  opacity: number;
  url?: string;
}

export interface FieldBoundary {
  id: string;
  name: string;
  coordinates: Array<[number, number]>;
  area: number; // in hectares
  cropType: string;
}