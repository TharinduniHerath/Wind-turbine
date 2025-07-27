// Mock data for wind turbine monitoring system
export interface SensorData {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  timestamp: string;
}

export interface PowerData {
  time: string;
  power: number;
  efficiency: number;
}

export interface TemperatureData {
  time: string;
  gearbox: number;
  generator: number;
  bearing: number;
}

export interface MaintenanceTask {
  id: string;
  component: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'overdue';
  description: string;
}

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

// Real-time sensor data
export const sensorData: SensorData[] = [
  {
    id: '1',
    name: 'Wind Speed',
    value: 12.5,
    unit: 'm/s',
    status: 'normal',
    timestamp: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Power Output',
    value: 1.8,
    unit: 'MW',
    status: 'normal',
    timestamp: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Blade Pitch',
    value: 15.2,
    unit: '°',
    status: 'normal',
    timestamp: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'Generator Temp',
    value: 78,
    unit: '°C',
    status: 'warning',
    timestamp: new Date().toISOString(),
  },
  {
    id: '5',
    name: 'Gearbox Temp',
    value: 65,
    unit: '°C',
    status: 'normal',
    timestamp: new Date().toISOString(),
  },
  {
    id: '6',
    name: 'Vibration Level',
    value: 2.3,
    unit: 'mm/s',
    status: 'normal',
    timestamp: new Date().toISOString(),
  },
];

// Power generation data for charts
export const powerGenerationData: PowerData[] = [
  { time: '00:00', power: 1.2, efficiency: 85 },
  { time: '04:00', power: 0.8, efficiency: 72 },
  { time: '08:00', power: 1.5, efficiency: 88 },
  { time: '12:00', power: 2.1, efficiency: 92 },
  { time: '16:00', power: 1.9, efficiency: 89 },
  { time: '20:00', power: 1.4, efficiency: 81 },
];

// Temperature monitoring data
export const temperatureData: TemperatureData[] = [
  { time: '00:00', gearbox: 62, generator: 75, bearing: 45 },
  { time: '04:00', gearbox: 58, generator: 71, bearing: 42 },
  { time: '08:00', gearbox: 65, generator: 78, bearing: 48 },
  { time: '12:00', gearbox: 70, generator: 82, bearing: 52 },
  { time: '16:00', gearbox: 68, generator: 80, bearing: 50 },
  { time: '20:00', gearbox: 63, generator: 76, bearing: 46 },
];

// Maintenance schedule data
export const maintenanceTasks: MaintenanceTask[] = [
  {
    id: '1',
    component: 'Blade Assembly',
    type: 'Inspection',
    priority: 'medium',
    dueDate: '2025-01-15',
    status: 'scheduled',
    description: 'Visual inspection of blade surface and lightning protection',
  },
  {
    id: '2',
    component: 'Gearbox',
    type: 'Oil Change',
    priority: 'high',
    dueDate: '2025-01-10',
    status: 'in-progress',
    description: 'Replace gearbox oil and filter',
  },
  {
    id: '3',
    component: 'Generator',
    type: 'Cleaning',
    priority: 'low',
    dueDate: '2025-01-20',
    status: 'scheduled',
    description: 'Clean generator cooling system',
  },
  {
    id: '4',
    component: 'Main Bearing',
    type: 'Lubrication',
    priority: 'critical',
    dueDate: '2025-01-08',
    status: 'overdue',
    description: 'Replace main bearing lubrication',
  },
];

// System notifications
export const notifications: Notification[] = [
  {
    id: '1',
    type: 'warning',
    title: 'High Generator Temperature',
    message: 'Generator temperature has exceeded normal operating range',
    timestamp: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
    read: false,
  },
  {
    id: '2',
    type: 'error',
    title: 'Maintenance Overdue',
    message: 'Main bearing lubrication is 2 days overdue',
    timestamp: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
    read: false,
  },
  {
    id: '3',
    type: 'success',
    title: 'System Optimization Complete',
    message: 'Power optimization algorithm has improved efficiency by 3%',
    timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
    read: true,
  },
  {
    id: '4',
    type: 'info',
    title: 'Weather Update',
    message: 'Favorable wind conditions expected for next 6 hours',
    timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    read: true,
  },
];

// System status
export const systemStatus = {
  turbineStatus: 'operational',
  connectionStatus: 'connected',
  lastUpdate: new Date().toISOString(),
  uptime: '45 days, 12 hours',
  totalPowerGenerated: 2847.5, // kWh today
  efficiency: 87.3, // percentage
};