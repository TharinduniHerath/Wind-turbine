import { create } from 'zustand';
import { TurbineData, Alert, KPI, ActiveModule, ChartDataPoint } from '../types';

interface TurbineStore {
  // Current state
  activeModule: ActiveModule;
  selectedTurbine: string;
  currentData: TurbineData | null;
  alerts: Alert[];
  isLoading: boolean;
  error: string | null;
  
  // Historical data
  powerHistory: ChartDataPoint[];
  noiseHistory: ChartDataPoint[];
  weatherHistory: ChartDataPoint[];
  
  // KPIs
  kpis: KPI[];
  
  // 3D simulation state
  simulationActive: boolean;
  turbineAnimation: {
    rotorSpeed: number;
    yaw: number;
    pitch: number;
  };
  
  // Actions
  setActiveModule: (module: ActiveModule) => void;
  setSelectedTurbine: (turbine: string) => void;
  updateTurbineData: (data: TurbineData) => void;
  addAlert: (alert: Alert) => void;
  removeAlert: (alertId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  toggleSimulation: () => void;
  updateAnimation: (animation: Partial<TurbineStore['turbineAnimation']>) => void;
  initializeData: () => void;
}

export const useTurbineStore = create<TurbineStore>((set, get) => ({
  // Initial state
  activeModule: 'overview',
  selectedTurbine: 'Turbine-1',
  currentData: null,
  alerts: [],
  isLoading: false,
  error: null,
  powerHistory: [],
  noiseHistory: [],
  weatherHistory: [],
  kpis: [],
  simulationActive: false,
  turbineAnimation: {
    rotorSpeed: 0,
    yaw: 0,
    pitch: 0,
  },
  
  // Actions
  setActiveModule: (module) => set({ activeModule: module }),
  setSelectedTurbine: (turbine) => set({ selectedTurbine: turbine }),
  
  updateTurbineData: (data) => {
    const state = get();
    
    // Update historical data
    const timestamp = data.timestamp;
    const newPowerPoint = { timestamp, value: data.powerOutput };
    const newNoisePoint = { timestamp, value: data.noise.level };
    const newWeatherPoint = { timestamp, value: data.windSpeed };
    
    // Keep last 50 data points
    const maxPoints = 50;
    const powerHistory = [...state.powerHistory, newPowerPoint].slice(-maxPoints);
    const noiseHistory = [...state.noiseHistory, newNoisePoint].slice(-maxPoints);
    const weatherHistory = [...state.weatherHistory, newWeatherPoint].slice(-maxPoints);
    
    // Update KPIs
    const kpis: KPI[] = [
      {
        id: 'power',
        label: 'Power Output',
        value: data.powerOutput,
        unit: 'MW',
        status: data.powerOutput > 2.0 ? 'normal' : data.powerOutput > 1.0 ? 'warning' : 'critical',
        trend: state.powerHistory.length > 0 && data.powerOutput > state.powerHistory[state.powerHistory.length - 1].value ? 'up' : 'down',
        icon: 'Zap'
      },
      {
        id: 'wind',
        label: 'Wind Speed',
        value: data.windSpeed,
        unit: 'm/s',
        status: data.windSpeed > 3 && data.windSpeed < 25 ? 'normal' : 'warning',
        trend: 'stable',
        icon: 'Wind'
      },
      {
        id: 'rpm',
        label: 'Rotor RPM',
        value: data.rotorRpm,
        unit: 'RPM',
        status: data.rotorRpm > 10 && data.rotorRpm < 30 ? 'normal' : 'warning',
        trend: 'stable',
        icon: 'RotateCw'
      },
      {
        id: 'noise',
        label: 'Noise Level',
        value: data.noise.level,
        unit: 'dB',
        status: data.noise.level < 45 ? 'normal' : data.noise.level < 50 ? 'warning' : 'critical',
        trend: 'stable',
        icon: 'Volume2'
      }
    ];
    
    // Update animation based on data
    const turbineAnimation = {
      rotorSpeed: data.rotorRpm,
      yaw: data.nacelle.yaw,
      pitch: data.blades.pitch,
    };
    
    set({
      currentData: data,
      powerHistory,
      noiseHistory,
      weatherHistory,
      kpis,
      turbineAnimation,
    });
  },
  
  addAlert: (alert) => set((state) => ({
    alerts: [alert, ...state.alerts].slice(0, 20) // Keep last 20 alerts
  })),
  
  removeAlert: (alertId) => set((state) => ({
    alerts: state.alerts.filter(alert => alert.id !== alertId)
  })),
  
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  toggleSimulation: () => set((state) => ({ simulationActive: !state.simulationActive })),
  updateAnimation: (animation) => set((state) => ({
    turbineAnimation: { ...state.turbineAnimation, ...animation }
  })),
  
  initializeData: () => {
    // Generate initial mock data
    const mockData: TurbineData = {
      timestamp: new Date().toISOString(),
      powerOutput: 2.3,
      windSpeed: 12.5,
      rotorRpm: 18.2,
      nacelle: {
        yaw: 245,
        temperature: 65,
      },
      blades: {
        pitch: 3.2,
        vibration: 0.8,
      },
      noise: {
        level: 42.3,
        frequency: 125,
      },
      weather: {
        temperature: 18,
        humidity: 62,
        pressure: 1013.2,
        windDirection: 245,
      },
      maintenance: {
        nextService: '2024-03-15',
        operatingHours: 8742,
        alerts: [],
      },
      health: {
        gearbox: 'warning',
        bearing: 'normal',
        generator: 'normal',
        electronics: 'critical',
        sensor: 'normal',
      },
    };
    
    get().updateTurbineData(mockData);
  },
}));