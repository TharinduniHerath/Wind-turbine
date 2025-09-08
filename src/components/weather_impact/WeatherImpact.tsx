import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera } from '@react-three/drei';
import { motion } from 'framer-motion';
import { Cloud, Wind, Thermometer, Droplets, Gauge, Eye, Download, AlertTriangle, Zap, Shield, Activity, RefreshCw } from 'lucide-react';


// Import your Three.js components
import WindTurbine from './Turbine3DModelWeather/WindTurbine';


interface TurbineData {
  id: string;
  last_hour: {
    actual_power: number;
    predicted_power: number;
    performance_gap: number;
    performance_ratio: number;
    status: string;
    color: string;
    explanation: string;
  };
  current_hour: {
    forecast_power: number;
  };
  next_hour: {
    forecast_power: number;
  };
}

interface PowerLossData {
  forecast: any[];
  summary: any;
  impact: any;
  loading: boolean;
  error: string | null;
}


interface WeatherData {
  Temperature: number;
  Wind_Speed_10m: number;
  Wind_Direction_50m: number;
  Relative_Humidity: number;
  Surface_Pressure: number;
  Wind_Speed_50m: number;
  Hour: number;
  Month: number;
}

interface ApiResponse {
  current_time: string;
  simulated_time: string;
  analysis_periods: {
    last_hour: string;
    current_hour: string;
    next_hour: string;
  };
  weather_last_hour: WeatherData;
  weather_current_hour: WeatherData;
  weather_next_hour: WeatherData;
  weather_analysis: {
    last_hour: string[];
    current_hour: string[];
    next_hour: string[];
  };
  turbines: TurbineData[];
  summary: {
    total_turbines: number;
    optimal: number;
    suboptimal: number;
    critical: number;
    shutdown: number;
    unknown: number;
    total_actual_power: number;
    total_predicted_power: number;
    total_current_forecast: number;
    total_next_forecast: number;
    average_performance_ratio: number;
  };
}

// Lightning Risk Interfaces
interface LightningForecast {
  period_type: string;
  time_range: string;
  full_time: string;
  risk_percent: number;
  risk_level: 'NORMAL' | 'ELEVATED' | 'HIGH' | 'NO_DATA' | 'ERROR';
  max_precipitation: string;
  guidance: string;
}

interface LightningData {
  current_time: string;
  current_period_start: string;
  last_updated: string;
  next_update: string;
  forecasts: LightningForecast[];
  model_info: {
    update_boundaries: string[];
    thresholds_used: {
      normal: number;
      elevated: number;
      high: number;
    };
    features_calculated: number;
    forecast_explanation: string;
  };
}

// Three.js Scene Component
const TurbineScene = ({ selectedTurbine, weather }: { 
  selectedTurbine: TurbineData | null, 
  weather: WeatherData | null 
}) => {
  // Calculate turbine parameters from data
  const rpm = selectedTurbine ? Math.max(selectedTurbine.last_hour.actual_power / 100, 0) : 5;
  const pitch = Math.PI / 8; // Default pitch
  const windDirection = weather?.Wind_Direction_50m || 0;

  return (
    <>
      <PerspectiveCamera makeDefault position={[15, 10, 15]} fov={50} />
      <OrbitControls 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={10}
        maxDistance={50}
        target={[0, 6, 0]}
      />
      
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight 
        position={[10, 10, 10]} 
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      
      {/* Environment */}
      <Environment preset="sunset" background />
      
      {/* Wind Turbine */}
      <WindTurbine
        rpm={rpm}
        pitch={pitch}
        windDirection={windDirection}
      />
      
      {/* Ground plane for better visualization */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#2d5016" />
      </mesh>
    </>
  );
};

// Add this new hook for wind direction data
const useWindDirectionData = () => {
  const [data, setData] = useState({
    current: [],
    summary: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setData(prev => ({ ...prev, loading: true, error: null }));
        
        const [currentRes, summaryRes] = await Promise.all([
          fetch('http://localhost:8000/api/wind-direction/current'),
          fetch('http://localhost:8000/api/wind-direction/summary')
        ]);

        if (!currentRes.ok || !summaryRes.ok) {
          throw new Error('Failed to fetch wind direction data');
        }

        const currentData = await currentRes.json();
        const summaryData = await summaryRes.json();

        setData({
          current: currentData.data.predictions || [],
          summary: summaryData.data || null,
          loading: false,
          error: null
        });

      } catch (error) {
        console.error('Error fetching wind direction data:', error);
        setData(prev => ({
          ...prev,
          loading: false,
          error: error.message
        }));
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  return data;
};

// Add this new hook with your other hooks
const useWindSpeedData = (testMode = false) => {
  const [data, setData] = useState({
    current: null,
    summary: null,
    periods: [],
    loading: true,
    error: null
  });

  // Dummy data for testing UI
  const dummyData = {
    current: {
      success: true,
      current_time: "2025-09-08T16:47:00",
      wind_loss_periods: [
        {
          id: 1,
          wind_condition: "Low Wind Speed",
          start_time: "2025-09-08T22:00:00",
          end_time: "2025-09-09T03:00:00",
          duration_hours: 5,
          power_loss_kw: 15430.2,
          avg_wind_speed: 2.1,
          min_wind_speed: 1.8,
          max_wind_speed: 2.6,
          turbine_count: 10,
          affected_turbines: ["WTG01", "WTG02", "WTG03", "WTG04", "WTG05", "WTG06", "WTG07", "WTG08", "WTG09", "WTG10"],
          impact_description: "Wind speeds below cut-in threshold - turbines cannot operate effectively",
          severity: "High"
        },
        {
          id: 2,
          wind_condition: "High Wind Speed",
          start_time: "2025-09-09T14:00:00",
          end_time: "2025-09-09T17:00:00",
          duration_hours: 3,
          power_loss_kw: 8920.5,
          avg_wind_speed: 26.8,
          min_wind_speed: 25.2,
          max_wind_speed: 28.4,
          turbine_count: 10,
          affected_turbines: ["WTG01", "WTG02", "WTG03", "WTG04", "WTG05", "WTG06", "WTG07", "WTG08", "WTG09", "WTG10"],
          impact_description: "Wind speeds exceed safe operating limits - turbines shut down for protection",
          severity: "Critical"
        },
        {
          id: 3,
          wind_condition: "Low Wind Speed",
          start_time: "2025-09-10T05:00:00",
          end_time: "2025-09-10T08:00:00",
          duration_hours: 3,
          power_loss_kw: 6280.3,
          avg_wind_speed: 2.8,
          min_wind_speed: 2.4,
          max_wind_speed: 3.1,
          turbine_count: 8,
          affected_turbines: ["WTG01", "WTG03", "WTG04", "WTG06", "WTG07", "WTG08", "WTG09", "WTG10"],
          impact_description: "Marginal wind conditions - reduced power generation efficiency",
          severity: "Medium"
        }
      ],
      forecast_info: {
        start_time: "2025-09-08T16:47:00",
        end_time: "2025-09-10T16:47:00",
        total_hours: 48
      },
      model_info: {
        model_type: "XGBoost",
        training_r2: 0.986,
        test_r2: 0.968,
        last_updated: "2025-09-08T16:47:00"
      }
    },
    summary: {
      total_power_loss_kw: 30631.0,
      low_wind_loss_kw: 21710.5,
      high_wind_loss_kw: 8920.5,
      total_periods: 3,
      low_wind_periods: 2,
      high_wind_periods: 1,
      estimated_revenue_impact_usd: 2450.48,
      has_wind_losses: true
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (testMode) {
        // Use dummy data for testing
        setData({
          current: dummyData.current,
          summary: dummyData.summary,
          periods: dummyData.current.wind_loss_periods,
          loading: false,
          error: null
        });
        return;
      }

      // Original API fetch logic
      try {
        setData(prev => ({ ...prev, loading: true, error: null }));
        
        const [currentRes, summaryRes] = await Promise.all([
          fetch('http://localhost:8000/api/wind-speed/current'),
          fetch('http://localhost:8000/api/wind-speed/summary')
        ]);

        if (!currentRes.ok || !summaryRes.ok) {
          throw new Error('Failed to fetch wind speed data');
        }

        const currentData = await currentRes.json();
        const summaryData = await summaryRes.json();

        setData({
          current: currentData,
          summary: summaryData.summary || null,
          periods: currentData.wind_loss_periods || [],
          loading: false,
          error: null
        });

      } catch (error) {
        console.error('Error fetching wind speed data:', error);
        setData(prev => ({
          ...prev,
          loading: false,
          error: error.message
        }));
      }
    };

    fetchData();
    if (!testMode) {
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }
  }, [testMode]);

  return data;
};

const WeatherImpact = () => {
  const [turbines, setTurbines] = useState<TurbineData[]>([]);
  const [weatherData, setWeatherData] = useState<{
    last_hour: WeatherData | null;
    current_hour: WeatherData | null;
    next_hour: WeatherData | null;
  }>({
    last_hour: null,
    current_hour: null,
    next_hour: null
  });
  
  
  const [lightningData, setLightningData] = useState<LightningData | null>(null);
  const [lightningLoading, setLightningLoading] = useState(true);
  const [lightningError, setLightningError] = useState<string | null>(null);
  const [selectedTurbine, setSelectedTurbine] = useState<TurbineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [apiConnected, setApiConnected] = useState(false);
  const [weatherAnalysis, setWeatherAnalysis] = useState<{
    last_hour: string[];
    current_hour: string[];
    next_hour: string[];
  }>({
    last_hour: [],
    current_hour: [],
    next_hour: []
  });
  const [summary, setSummary] = useState<any>(null);
  const [analysisPeriods, setAnalysisPeriods] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [testMode, setTestMode] = useState(false);
  
   // Add this line with your other hook declarations
const { 
  current: windDirectionPredictions, 
  summary: windDirectionSummary, 
  loading: windDirectionLoading, 
  error: windDirectionError 
} = useWindDirectionData();

// Add this line with your other hook declarations in WeatherImpact component
const { 
  current: windSpeedData, 
  summary: windSpeedSummary, 
  periods: windSpeedPeriods,
  loading: windSpeedLoading, 
  error: windSpeedError 
} = useWindSpeedData(testMode);

  // Fetch turbine data from backend
  const fetchTurbineData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:8000/api/real-time/real-time-turbines');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data: ApiResponse = await response.json();
      
      setTurbines(data.turbines);
      setWeatherData({
        last_hour: data.weather_last_hour,
        current_hour: data.weather_current_hour,
        next_hour: data.weather_next_hour
      });
      setWeatherAnalysis(data.weather_analysis);
      setSummary(data.summary);
      setAnalysisPeriods(data.analysis_periods);
      setApiConnected(true);
      
      if (!selectedTurbine && data.turbines.length > 0) {
        setSelectedTurbine(data.turbines[0]);
      }
      
    } catch (error) {
      console.error('Error fetching turbine data:', error);
      setApiConnected(false);
      setError((error as Error).message);
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  };


    // Fetch lightning risk data from backend
  const fetchLightningData = async () => {
    try {
      setLightningLoading(true);
      setLightningError(null);
      
      const response = await fetch('http://localhost:8000/api/lightning/forecast');
      
      if (!response.ok) {
        throw new Error(`Lightning API ${response.status}: ${response.statusText}`);
      }
      
      const data: LightningData = await response.json();
      setLightningData(data);
      
    } catch (error) {
      console.error('Error fetching lightning data:', error);
      setLightningError((error as Error).message);
    } finally {
      setLightningLoading(false);
    }
  };

  useEffect(() => {
  const fetchAllData = async () => {
    await Promise.all([
      fetchTurbineData(),
      fetchLightningData()
    ]);
  };
  
  fetchAllData();
  const interval = setInterval(fetchAllData, 30000); // Update every 30 seconds
  return () => clearInterval(interval);
  }, []);


  const handleDownload48h = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/wind-direction/download-predictions-csv');
      
      if (!response.ok) {
        throw new Error('Failed to download CSV');
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'hourly_power_loss_predictions.csv';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'OPTIMAL': return 'Optimal';
      case 'SUBOPTIMAL': return 'Suboptimal';
      case 'WARNING': return 'Warning';
      case 'CRITICAL': return 'Critical';
      case 'SHUTDOWN': return 'Shutdown';
      case 'UNKNOWN': return 'Unknown';
      default: return 'Unknown';
    }
  };

  if (loading) {
    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            <span className="text-white text-lg">Loading Dashboard...</span>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <div className="bg-red-400/10 border border-red-400/20 rounded-lg p-6 max-w-md">
            <div className="flex items-center space-x-3 mb-3">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <h2 className="text-white font-semibold">Connection Error</h2>
            </div>
            <p className="text-red-400 text-sm mb-4">{error}</p>
            <button 
              onClick={fetchTurbineData}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Retry Connection
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-900 flex flex-col">
        {/* Top Header */}
        <div className="bg-slate-800 border-b border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-white">Wind Farm Digital Twin - Weather Impact Analysis</h1>
              <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-lg text-sm ${
                apiConnected 
                  ? 'bg-green-400/10 border border-green-400/20 text-green-400' 
                  : 'bg-red-400/10 border border-red-400/20 text-red-400'
              }`}>
                <div className={`w-2 h-2 rounded-full ${apiConnected ? 'bg-green-400' : 'bg-red-400'}`} />
                {apiConnected ? 'Live Data' : 'Disconnected'}
              </div>
            </div>
            
            {/* Current Weather Summary */}
                      <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Thermometer className="w-4 h-4 text-red-400" />
                <span className="text-white">{weatherData.current_hour?.Temperature.toFixed(1)}°C</span>
              </div>
              <div className="flex items-center space-x-2">
                <Wind className="w-4 h-4 text-blue-400" />
                <span className="text-white">{weatherData.current_hour?.Wind_Speed_10m.toFixed(1)} m/s</span>
              </div>
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-purple-400" />
                <span className="text-white">{weatherData.current_hour?.Wind_Direction_50m.toFixed(0)}°</span>
              </div>
              
              {/* Test Mode Toggle */}
              <button 
                onClick={() => setTestMode(!testMode)}
                className={`flex items-center space-x-2 px-3 py-1 rounded-lg transition-colors text-sm ${
                  testMode 
                    ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                }`}
              >
                <Eye className="w-4 h-4" />
                <span>{testMode ? 'Test Mode' : 'Live Mode'}</span>
              </button>
              
              <button 
                onClick={() => {
                  fetchTurbineData();
                  fetchLightningData();
                }}
                className="flex items-center space-x-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex">
          {/* Left Sidebar - Turbine Grid */}
          <div className="w-80 bg-slate-800 border-r border-slate-700 flex flex-col">
            <div className="p-4 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Turbine Status</h2>
                <div className="text-sm text-slate-400">
                  {summary ? `${summary.optimal}/${summary.total_turbines} Optimal` : '0/0 Optimal'}
                </div>
              </div>
              {analysisPeriods && (
                <div className="mt-2 text-xs text-slate-400">
                  Analysis: {analysisPeriods.last_hour}
                </div>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-3">
              <div className="grid grid-cols-1 gap-2">
                {turbines.map((turbine, index) => (
                  <motion.div
                    key={turbine.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    onClick={() => setSelectedTurbine(turbine)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                      selectedTurbine?.id === turbine.id
                        ? 'bg-blue-600/20 border-blue-500/50'
                        : 'bg-slate-700 border-slate-600 hover:bg-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: turbine.last_hour.color }}
                        />
                        <div>
                          <div className="text-white font-semibold text-sm">{turbine.id}</div>
                          <div className="text-slate-400 text-xs">{turbine.last_hour.actual_power.toFixed(1)} kW</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white text-sm font-medium">
                          {(turbine.last_hour.performance_ratio * 100).toFixed(0)}%
                        </div>
                        <div className={`text-xs px-2 py-0.5 rounded-full ${
                          turbine.last_hour.status === 'OPTIMAL' ? 'bg-green-400/20 text-green-400' :
                          turbine.last_hour.status === 'SUBOPTIMAL' || turbine.last_hour.status === 'WARNING' ? 'bg-amber-400/20 text-amber-400' :
                          turbine.last_hour.status === 'UNKNOWN' ? 'bg-gray-400/20 text-gray-400' :
                          'bg-red-400/20 text-red-400'
                        }`}>
                          {getStatusText(turbine.last_hour.status)}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Center Area - Three.js Container */}
          <div className="flex-1 relative">
            <Canvas
              className="w-full h-full"
              gl={{ antialias: true }}
              shadows
            >
              <TurbineScene selectedTurbine={selectedTurbine} weather={weatherData.current_hour} />
            </Canvas>
            
            {/* Overlay - Selected Turbine Info */}
            {selectedTurbine && (
              <div className="absolute top-4 left-4">
                <div className="bg-slate-800/95 backdrop-blur-sm rounded-lg p-4 border border-slate-700 min-w-[320px]">
                  <div className="flex items-center space-x-3 mb-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: selectedTurbine.last_hour.color }}
                    />
                    <h4 className="text-white font-semibold">{selectedTurbine.id}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      selectedTurbine.last_hour.status === 'OPTIMAL' ? 'bg-green-400/20 text-green-400' :
                      selectedTurbine.last_hour.status === 'SUBOPTIMAL' || selectedTurbine.last_hour.status === 'WARNING' ? 'bg-amber-400/20 text-amber-400' :
                      selectedTurbine.last_hour.status === 'UNKNOWN' ? 'bg-gray-400/20 text-gray-400' :
                      'bg-red-400/20 text-red-400'
                    }`}>
                      {getStatusText(selectedTurbine.last_hour.status)}
                    </span>
                  </div>
                  
                  {/* Last Hour Performance */}
                  <div className="mb-4">
                    <h5 className="text-slate-300 text-xs font-medium mb-2">Last Hour Performance</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-300">Actual Power:</span>
                        <span className="text-white font-semibold">{selectedTurbine.last_hour.actual_power.toFixed(1)} kW</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">Expected Power:</span>
                        <span className="text-white font-semibold">{selectedTurbine.last_hour.predicted_power.toFixed(1)} kW</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">Performance:</span>
                        <span className="text-white font-semibold">{(selectedTurbine.last_hour.performance_ratio * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">Power Gap:</span>
                        <span className={`font-semibold ${
                          selectedTurbine.last_hour.performance_gap >= 0 
                            ? 'text-green-400' 
                            : 'text-red-400'
                        }`}>
                          {selectedTurbine.last_hour.performance_gap.toFixed(1)} kW
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Forecast Data */}
                  <div>
                    <h5 className="text-slate-300 text-xs font-medium mb-2">Predicted Power</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-300">Current Hour:</span>
                        <span className="text-blue-400 font-semibold">{selectedTurbine.current_hour.forecast_power.toFixed(1)} kW</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">Next Hour:</span>
                        <span className="text-purple-400 font-semibold">{selectedTurbine.next_hour.forecast_power.toFixed(1)} kW</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Farm Overview */}
            <div className="absolute top-4 right-4">
              <div className="bg-slate-800/95 backdrop-blur-sm rounded-lg p-4 border border-slate-700">
                <div className="text-center mb-3">
                  <div className="text-2xl font-bold text-white">
                    {summary ? summary.total_actual_power?.toFixed(0) || '0' : '0'}
                  </div>
                  <div className="text-slate-400 text-xs">Total Actual Power (kW)</div>
                </div>
                
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Current Forecast:</span>
                    <span className="text-blue-400 font-semibold">{summary?.total_current_forecast?.toFixed(0) || '0'} kW</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Next Hour:</span>
                    <span className="text-purple-400 font-semibold">{summary?.total_next_forecast?.toFixed(0) || '0'} kW</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-center space-x-4 mt-3 text-xs">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    <span className="text-slate-300">{summary?.optimal || 0}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                    <span className="text-slate-300">{summary?.suboptimal || 0}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 rounded-full bg-red-400"></div>
                    <span className="text-slate-300">{summary?.critical || 0}</span>
                  </div>
                  {summary?.unknown > 0 && (
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                      <span className="text-slate-300">{summary.unknown}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Weather Impact Analysis */}
          <div className="w-96 bg-slate-800 border-l border-slate-700 flex flex-col overflow-y-auto">
            {/* Time Periods */}
            <div className="p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-3">Analysis Periods</h3>
              {analysisPeriods && (
                <div className="space-y-2 text-sm">
                  <div className="bg-slate-700 rounded-lg p-2">
                    <div className="text-slate-300 text-xs">Last Hour (Historical)</div>
                    <div className="text-white font-medium">{analysisPeriods.last_hour}</div>
                  </div>
                  <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-2">
                    <div className="text-blue-300 text-xs">Current Hour (Forecast)</div>
                    <div className="text-white font-medium">{analysisPeriods.current_hour}</div>
                  </div>
                  <div className="bg-purple-600/20 border border-purple-500/30 rounded-lg p-2">
                    <div className="text-purple-300 text-xs">Next Hour (Forecast)</div>
                    <div className="text-white font-medium">{analysisPeriods.next_hour}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Weather Conditions - Current Hour */}
            <div className="p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-3">Current Weather Conditions</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-700 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <Thermometer className="w-4 h-4 text-red-400" />
                    <span className="text-slate-300 text-xs">Temperature</span>
                  </div>
                  <span className="text-white font-semibold text-lg">
                    {weatherData.current_hour?.Temperature.toFixed(1)}°C
                  </span>
                </div>
                <div className="bg-slate-700 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <Wind className="w-4 h-4 text-blue-400" />
                    <span className="text-slate-300 text-xs">Wind Speed</span>
                  </div>
                  <span className="text-white font-semibold text-lg">
                    {weatherData.current_hour?.Wind_Speed_10m.toFixed(1)} m/s
                  </span>
                </div>
                <div className="bg-slate-700 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <Droplets className="w-4 h-4 text-cyan-400" />
                    <span className="text-slate-300 text-xs">Humidity</span>
                  </div>
                  <span className="text-white font-semibold text-lg">
                    {weatherData.current_hour?.Relative_Humidity.toFixed(0)}%
                  </span>
                </div>
                <div className="bg-slate-700 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <Gauge className="w-4 h-4 text-purple-400" />
                    <span className="text-slate-300 text-xs">Pressure</span>
                  </div>
                  <span className="text-white font-semibold text-lg">
                    {weatherData.current_hour?.Surface_Pressure.toFixed(0)} hPa
                  </span>
                </div>
                <div className="bg-slate-700 rounded-lg p-3 col-span-2">
                  <div className="flex items-center space-x-2 mb-1">
                    <Activity className="w-4 h-4 text-purple-400" />
                    <span className="text-slate-300 text-xs">Wind Direction</span>
                  </div>
                  <span className="text-white font-semibold text-lg">
                    {weatherData.current_hour?.Wind_Direction_50m.toFixed(1)}°
                  </span>
                </div>
              </div>
            </div>
            {/* Power Loss Due to Wind Direction Change */}
            <div className="p-4 border-b border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">Power Loss Due to Wind Direction Change</h3>
                  <p className="text-slate-400 text-xs">
                    ML-powered predictions using trained XGBoost model with turbine-specific wind corrections
                  </p>
                </div>
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>

              {/* Next 6 Hours Forecast */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-white font-medium text-sm">Next 6 Hours</h4>
                  <button 
                    onClick={handleDownload48h}
                    className="flex items-center space-x-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    <span>48h CSV</span>
                  </button>
                </div>
                
                <div className="space-y-2">
                  {windDirectionLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400 mx-auto"></div>
                      <p className="text-slate-400 text-xs mt-1">Loading ML predictions...</p>
                    </div>
                  ) : windDirectionError ? (
                    <div className="text-center py-4">
                      <AlertTriangle className="w-6 h-6 text-red-400 mx-auto mb-1" />
                      <p className="text-red-400 text-xs">Error: {windDirectionError}</p>
                    </div>
                  ) : (
                    windDirectionPredictions.map((prediction: any, index: number) => (
                      <motion.div
                        key={prediction.time}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-2 bg-slate-700 rounded-lg"
                      >
                        <div className="text-center min-w-[40px]">
                          <div className="text-white font-semibold text-xs">{prediction.time}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-red-400 font-semibold text-xs">{prediction.powerLoss} kWh</div>
                          <div className="text-slate-400 text-xs">{prediction.duration}</div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>

              {/* Power Loss Summary */}
              <div className="space-y-3">
                <h4 className="text-white font-medium text-sm">Summary</h4>
                
                {windDirectionLoading || windDirectionError ? (
                  <div className="bg-red-400/10 border border-red-400/20 rounded-lg p-3">
                    <div className="text-center">
                      {windDirectionLoading ? (
                        <div className="text-slate-400 text-xs">Loading summary...</div>
                      ) : (
                        <div className="text-red-400 text-xs">Unable to load summary</div>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="bg-red-400/10 border border-red-400/20 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-red-400 font-medium text-xs">Next 6 Hours</span>
                        <AlertTriangle className="w-3 h-3 text-red-400" />
                      </div>
                      <div className="text-lg font-bold text-white">
                        {windDirectionSummary?.next_6_hours || 0} kWh
                      </div>
                      <div className="text-slate-400 text-xs">Total predicted loss</div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-700 rounded-lg p-2">
                        <div className="text-slate-400 text-xs">12 Hours</div>
                        <div className="text-white font-semibold text-sm">
                          {windDirectionSummary?.next_12_hours || 0} kWh
                        </div>
                      </div>
                      <div className="bg-slate-700 rounded-lg p-2">
                        <div className="text-slate-400 text-xs">24 Hours</div>
                        <div className="text-white font-semibold text-sm">
                          {windDirectionSummary?.next_24_hours || 0} kWh
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-700 rounded-lg p-3">
                      <h5 className="text-white font-medium mb-2 text-xs">Impact Analysis</h5>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-300">Avg. Repositioning:</span>
                          <span className="text-white">{windDirectionSummary?.avg_repositioning_time || 8.5} min</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-300">Direction Changes:</span>
                          <span className="text-white">{windDirectionSummary?.direction_changes || 0} events</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-300">Revenue Impact:</span>
                          <span className="text-red-400">-${windDirectionSummary?.revenue_impact || 0}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Lightning Risk Assessment */}
            <div className="p-4 border-b border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">Lightning Risk Assessment</h3>
                  {lightningData && (
                    <p className="text-slate-400 text-xs">
                      Next update: {new Date(lightningData.next_update).toLocaleTimeString()}
                    </p>
                  )}
                </div>
                <Zap className="w-5 h-5 text-amber-400" />
              </div>
              
              <div className="space-y-2">
                {lightningLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-400 mx-auto"></div>
                    <p className="text-slate-400 text-xs mt-1">Loading lightning data...</p>
                  </div>
                ) : lightningError ? (
                  <div className="text-center py-4">
                    <AlertTriangle className="w-6 h-6 text-red-400 mx-auto mb-1" />
                    <p className="text-red-400 text-xs">Lightning API Error: {lightningError}</p>
                    <button 
                      onClick={fetchLightningData}
                      className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs"
                    >
                      Retry
                    </button>
                  </div>
                ) : lightningData ? (
                  lightningData.forecasts.map((period, index) => (
                    <motion.div 
                      key={period.period_type}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-slate-700 rounded-lg p-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="text-white font-medium text-sm">{period.time_range}</span>
                          <div className="text-slate-400 text-xs">{period.full_time}</div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          period.risk_level === 'HIGH' ? 'bg-red-400/20 text-red-400' :
                          period.risk_level === 'ELEVATED' ? 'bg-amber-400/20 text-amber-400' :
                          period.risk_level === 'NORMAL' ? 'bg-green-400/20 text-green-400' :
                          'bg-gray-400/20 text-gray-400'
                        }`}>
                          {period.risk_level}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-300">Risk: {period.risk_percent}%</span>
                          <span className="text-slate-300">Precip: {period.max_precipitation}</span>
                        </div>
                        <div className="w-full bg-slate-600 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full ${
                              period.risk_level === 'HIGH' ? 'bg-red-400' :
                              period.risk_level === 'ELEVATED' ? 'bg-amber-400' :
                              'bg-green-400'
                            }`}
                            style={{ width: `${Math.min(period.risk_percent, 100)}%` }}
                          />
                        </div>
                        <div className="text-slate-400 text-xs">{period.guidance}</div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-slate-400 text-xs">No lightning data available</p>
                  </div>
                )}
              </div>
              
              {/* Lightning System Status */}
              {lightningData && (
                <div className="mt-3 pt-3 border-t border-slate-600">
                  <div className="text-xs text-slate-400">
                    <div>Current Period: {lightningData.current_period_start}</div>
                    <div>Last Updated: {new Date(lightningData.last_updated).toLocaleTimeString()}</div>
                    <div>Features: {lightningData.model_info.features_calculated}</div>
                  </div>
                </div>
              )}
            </div>
              {/* Wind Speed Power Loss */}
            <div className="flex-1 p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">Wind Speed Power Loss</h3>
                  <p className="text-slate-400 text-xs">
                    ML-powered predictions for low wind (&lt;3 m/s) and high wind (&gt;25 m/s) scenarios
                  </p>
                </div>
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              
              {/* Loading State */}
              {windSpeedLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
                  <p className="text-slate-400 text-sm mt-2">Loading wind speed predictions...</p>
                </div>
              ) : windSpeedError ? (
                /* Error State */
                <div className="text-center py-8">
                  <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                  <p className="text-red-400 text-sm">Wind Speed API Error</p>
                  <p className="text-slate-400 text-xs mt-1">{windSpeedError}</p>
                  <button 
                    onClick={() => window.location.reload()}
                    className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                  >
                    Retry
                  </button>
                </div>
              ) : windSpeedPeriods.length === 0 ? (
                /* No Wind Events State */
                <div className="text-center py-8">
                  <Shield className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <h4 className="text-green-400 font-medium mb-1">No Wind Issues Detected</h4>
                  <p className="text-slate-400 text-sm mb-2">
                    No low wind (&lt;3 m/s) or high wind (&gt;25 m/s) events expected in the next 48 hours
                  </p>
                  <div className="bg-green-400/10 border border-green-400/20 rounded-lg p-3 mt-3">
                    <div className="text-green-400 text-sm font-medium">Optimal Conditions</div>
                    <div className="text-slate-400 text-xs">All turbines expected to operate normally</div>
                  </div>
                  {windSpeedData?.forecast_info && (
                    <div className="text-xs text-slate-500 mt-3">
                      Forecast: {new Date(windSpeedData.forecast_info.start_time).toLocaleString()} to {new Date(windSpeedData.forecast_info.end_time).toLocaleString()}
                    </div>
                  )}
                </div>
              ) : (
                /* Wind Events Detected */
                <>
                  {/* Wind Loss Periods */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-white font-medium text-sm">Detected Wind Events (48h)</h4>
                      <span className="text-xs text-red-400 font-medium">
                        {windSpeedPeriods.length} event{windSpeedPeriods.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {windSpeedPeriods.map((period, index) => (
                      <motion.div
                        key={period.id || index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`p-3 rounded-lg border ${
                          period.wind_condition === 'Low Wind Speed' 
                            ? 'bg-blue-400/10 border-blue-400/20' 
                            : 'bg-red-400/10 border-red-400/20'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${
                              period.wind_condition === 'Low Wind Speed' ? 'bg-blue-400' : 'bg-red-400'
                            }`} />
                            <span className={`text-sm font-medium ${
                              period.wind_condition === 'Low Wind Speed' ? 'text-blue-400' : 'text-red-400'
                            }`}>
                              {period.wind_condition}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400">
                            {period.duration_hours}h
                          </span>
                        </div>
                        
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-300">Period:</span>
                            <span className="text-white">
                              {new Date(period.start_time).toLocaleString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })} - {new Date(period.end_time).toLocaleString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-300">Power Loss:</span>
                            <span className="text-red-400 font-semibold">{period.power_loss_kw} kW</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-300">Wind Speed:</span>
                            <span className="text-white">{period.avg_wind_speed} m/s</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-300">Affected:</span>
                            <span className="text-white">{period.turbine_count}/10 turbines</span>
                          </div>
                        </div>
                        
                        <div className="mt-2 text-xs text-slate-400">
                          {period.impact_description}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-slate-700 rounded-lg p-3">
                  <h4 className="text-white font-medium mb-2 text-sm">48-Hour Impact Summary</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">Total Power Loss:</span>
                      <span className="text-red-400 font-semibold">
                        {windSpeedSummary?.total_power_loss_kw || 0} kW
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">Low Wind Loss:</span>
                      <span className="text-blue-400 font-semibold">
                        {windSpeedSummary?.low_wind_loss_kw || 0} kW
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">High Wind Loss:</span>
                      <span className="text-red-400 font-semibold">
                        {windSpeedSummary?.high_wind_loss_kw || 0} kW
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">Revenue Impact:</span>
                      <span className="text-red-400 font-semibold">
                        -${windSpeedSummary?.estimated_revenue_impact_usd || 0}
                      </span>
                    </div>
                  </div>
                  
                  {windSpeedData?.forecast_info && (
                    <div className="mt-3 pt-2 border-t border-slate-600">
                      <div className="text-xs text-slate-400">
                        <div>Updated: {windSpeedData.model_info?.last_updated ? 
                          new Date(windSpeedData.model_info.last_updated).toLocaleTimeString() : 'Just now'}</div>
                        <div>Model: {windSpeedData.model_info?.model_type || 'XGBoost'} 
                          (R² = {windSpeedData.model_info?.training_r2 || 0.986})</div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-slate-700">
            <div className="text-xs text-slate-400 text-center">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
            <div className="text-xs text-slate-500 text-center mt-1">
              {apiConnected ? 'Connected to backend' : 'Backend disconnected'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherImpact;