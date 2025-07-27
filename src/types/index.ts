export interface TurbineData {
  timestamp: string;
  powerOutput: number;
  windSpeed: number;
  rotorRpm: number;
  nacelle: {
    yaw: number;
    temperature: number;
  };
  blades: {
    pitch: number;
    vibration: number;
  };
  noise: {
    level: number;
    frequency: number;
  };
  weather: {
    temperature: number;
    humidity: number;
    pressure: number;
    windDirection: number;
  };
  maintenance: {
    nextService: string;
    operatingHours: number;
    alerts: Alert[];
  };
}

export interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: string;
  module: 'noise' | 'power' | 'weather' | 'maintenance';
}

export interface KPI {
  id: string;
  label: string;
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  icon: string;
}

export interface ChartDataPoint {
  timestamp: string;
  value: number;
  predicted?: number;
}

export type ActiveModule = 'overview' | 'noise' | 'power' | 'weather' | 'maintenance';