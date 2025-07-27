import { TurbineData, Alert } from '../types';

export const generateMockTurbineData = (): TurbineData => {
  const now = new Date();
  const baseWindSpeed = 8 + Math.random() * 12; // 8-20 m/s
  const powerOutput = Math.min(3.0, Math.max(0, (baseWindSpeed - 3) * 0.3 + Math.random() * 0.5));
  const rotorRpm = Math.min(30, Math.max(0, baseWindSpeed * 1.2 + Math.random() * 3));
  
  return {
    timestamp: now.toISOString(),
    powerOutput: Number(powerOutput.toFixed(2)),
    windSpeed: Number(baseWindSpeed.toFixed(1)),
    rotorRpm: Number(rotorRpm.toFixed(1)),
    nacelle: {
      yaw: 180 + Math.random() * 180, // 180-360 degrees
      temperature: 60 + Math.random() * 20, // 60-80°C
    },
    blades: {
      pitch: 2 + Math.random() * 8, // 2-10 degrees
      vibration: 0.5 + Math.random() * 1.5, // 0.5-2.0 m/s²
    },
    noise: {
      level: 35 + Math.random() * 15, // 35-50 dB
      frequency: 100 + Math.random() * 50, // 100-150 Hz
    },
    weather: {
      temperature: 10 + Math.random() * 20, // 10-30°C
      humidity: 40 + Math.random() * 40, // 40-80%
      pressure: 1000 + Math.random() * 30, // 1000-1030 hPa
      windDirection: Math.random() * 360, // 0-360 degrees
    },
    maintenance: {
      nextService: '2024-03-15',
      operatingHours: 8742 + Math.floor(Math.random() * 100),
      alerts: generateMockAlerts(),
    },
  };
};

const generateMockAlerts = (): Alert[] => {
  const alerts: Alert[] = [];
  const alertTypes = ['warning', 'error', 'info'] as const;
  const modules = ['noise', 'power', 'weather', 'maintenance'] as const;
  
  const possibleAlerts = [
    { type: 'warning', message: 'Blade vibration approaching threshold', module: 'maintenance' },
    { type: 'info', message: 'Scheduled maintenance due in 7 days', module: 'maintenance' },
    { type: 'warning', message: 'Noise level elevated during peak hours', module: 'noise' },
    { type: 'error', message: 'Power output below expected for current wind conditions', module: 'power' },
    { type: 'info', message: 'Weather conditions optimal for operation', module: 'weather' },
  ];
  
  // Randomly select 0-3 alerts
  const numAlerts = Math.floor(Math.random() * 4);
  for (let i = 0; i < numAlerts; i++) {
    const alert = possibleAlerts[Math.floor(Math.random() * possibleAlerts.length)];
    alerts.push({
      id: `alert-${Date.now()}-${i}`,
      type: alert.type,
      message: alert.message,
      module: alert.module,
      timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(), // Random time in last hour
    });
  }
  
  return alerts;
};

export const generateHistoricalData = (hours: number = 24) => {
  const data = [];
  const now = new Date();
  
  for (let i = hours; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
    const baseWindSpeed = 8 + Math.sin(i * 0.1) * 4 + Math.random() * 2;
    const powerOutput = Math.min(3.0, Math.max(0, (baseWindSpeed - 3) * 0.3));
    const noiseLevel = 35 + baseWindSpeed * 0.8 + Math.random() * 5;
    
    data.push({
      timestamp: timestamp.toISOString(),
      powerOutput: Number(powerOutput.toFixed(2)),
      windSpeed: Number(baseWindSpeed.toFixed(1)),
      noiseLevel: Number(noiseLevel.toFixed(1)),
      predicted: Number((powerOutput * (0.95 + Math.random() * 0.1)).toFixed(2)),
    });
  }
  
  return data;
};