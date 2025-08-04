import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, AlertTriangle, CheckCircle, Clock, Calendar, Wrench } from 'lucide-react';
import { useTurbineStore } from '../../store/turbineStore';
import PredictiveAlert from '../Common/PredictiveAlert';

interface ComponentPrediction {
  status: 'Critical' | 'Warning' | 'Normal';
  message: string;
  confidence: string;
  based_on: string;
}

interface PredictionsData {
  [component: string]: ComponentPrediction;
}

const Maintenance: React.FC = () => {
  const { currentData } = useTurbineStore();
  const [predictions, setPredictions] = useState<PredictionsData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maintenanceData = currentData?.maintenance;
  const nextServiceDate = maintenanceData?.nextService ? new Date(maintenanceData.nextService) : null;
  const daysUntilService = nextServiceDate 
    ? Math.ceil((nextServiceDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  const maintenanceItems = [
    {
      id: 1,
      component: 'Gearbox Oil',
      status: 'due',
      priority: 'high',
      lastService: '2024-01-15',
      nextService: '2024-03-15',
      description: 'Oil change and filter replacement required',
      estimatedDuration: '4 hours',
    },
    {
      id: 2,
      component: 'Blade Inspection',
      status: 'scheduled',
      priority: 'medium',
      lastService: '2023-12-10',
      nextService: '2024-06-10',
      description: 'Visual inspection and surface treatment',
      estimatedDuration: '6 hours',
    },
    {
      id: 3,
      component: 'Generator Bearing',
      status: 'completed',
      priority: 'low',
      lastService: '2024-02-20',
      nextService: '2024-08-20',
      description: 'Bearing lubrication and alignment check',
      estimatedDuration: '3 hours',
    },
    {
      id: 4,
      component: 'Control System',
      status: 'monitoring',
      priority: 'medium',
      lastService: '2024-01-30',
      nextService: '2024-04-30',
      description: 'Software update and sensor calibration',
      estimatedDuration: '2 hours',
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'due': return AlertTriangle;
      case 'scheduled': return Clock;
      case 'completed': return CheckCircle;
      case 'monitoring': return Settings;
      default: return Settings;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'due': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'scheduled': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'completed': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'monitoring': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-amber-400';
      case 'low': return 'text-green-400';
      default: return 'text-slate-400';
    }
  };

  // Fetch predictions from the FastAPI backend
  const fetchPredictions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
      
      const response = await fetch('http://localhost:8000/api/predict', {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setPredictions(data);
    } catch (err) {
      console.error('Error fetching predictions:', err);
      
      // Only show error if we don't have any existing predictions
      if (Object.keys(predictions).length === 0) {
        setError('Failed to fetch predictions');
      }
      
      // Set fallback predictions only if we don't have any
      if (Object.keys(predictions).length === 0) {
        setPredictions({
          "Gearbox": {
            "status": "Normal",
            "message": "Gearbox operating within normal parameters.",
            "confidence": "85%",
            "based_on": "30 days of logs"
          },
          "Bearings": {
            "status": "Normal",
            "message": "Bearing vibration levels are stable and within range.",
            "confidence": "88%",
            "based_on": "6 weeks of data"
          },
          "Generator": {
            "status": "Normal",
            "message": "Generator operating efficiently with stable output.",
            "confidence": "92%",
            "based_on": "2 months of telemetry"
          },
          "Rotors": {
            "status": "Normal",
            "message": "Rotor balance is optimal for current conditions.",
            "confidence": "87%",
            "based_on": "3 months of sensor data"
          },
          "Blades": {
            "status": "Normal",
            "message": "Blade aerodynamics are stable and efficient.",
            "confidence": "90%",
            "based_on": "60 days of telemetry"
          },
          "Temperature Sensors": {
            "status": "Normal",
            "message": "Temperature sensors operating within calibration range.",
            "confidence": "89%",
            "based_on": "90 days of data"
          }
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch predictions on component mount and every 3 seconds
  useEffect(() => {
    fetchPredictions();
    
    const interval = setInterval(fetchPredictions, 3000); // Changed from 5000 to 3000
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Maintenance Tracking</h2>
          <p className="text-slate-400">
            Predictive maintenance scheduling and component health monitoring
          </p>
        </div>
        <div className="p-4 rounded-xl bg-amber-400/10 border border-amber-400/20">
          <Wrench className="w-8 h-8 text-amber-400" />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800 rounded-xl p-6 border border-slate-700"
        >
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-6 h-6 text-amber-400" />
            <span className="text-amber-400 text-xs font-medium">UPCOMING</span>
          </div>
          <div className="space-y-2">
            <h3 className="text-slate-300 text-sm">Next Service</h3>
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-bold text-white">{daysUntilService}</span>
              <span className="text-slate-400">days</span>
            </div>
            <div className="text-xs text-slate-500">
              {nextServiceDate?.toLocaleDateString()}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800 rounded-xl p-6 border border-slate-700"
        >
          <div className="flex items-center justify-between mb-4">
            <Settings className="w-6 h-6 text-blue-400" />
            <span className="text-green-400 text-xs font-medium">OPERATIONAL</span>
          </div>
          <div className="space-y-2">
            <h3 className="text-slate-300 text-sm">Operating Hours</h3>
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-bold text-white">
                {maintenanceData?.operatingHours.toLocaleString() || '0'}
              </span>
              <span className="text-slate-400">hrs</span>
            </div>
            <div className="text-xs text-slate-500">
              Since installation
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800 rounded-xl p-6 border border-slate-700"
        >
          <div className="flex items-center justify-between mb-4">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <span className="text-red-400 text-xs font-medium">DUE</span>
          </div>
          <div className="space-y-2">
            <h3 className="text-slate-300 text-sm">Overdue Items</h3>
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-bold text-white">1</span>
              <span className="text-slate-400">item</span>
            </div>
            <div className="text-xs text-slate-500">
              Requires attention
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-800 rounded-xl p-6 border border-slate-700"
        >
          <div className="flex items-center justify-between mb-4">
            <CheckCircle className="w-6 h-6 text-green-400" />
            <span className="text-green-400 text-xs font-medium">COMPLETED</span>
          </div>
          <div className="space-y-2">
            <h3 className="text-slate-300 text-sm">This Month</h3>
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-bold text-white">3</span>
              <span className="text-slate-400">items</span>
            </div>
            <div className="text-xs text-slate-500">
              On schedule
            </div>
          </div>
        </motion.div>
      </div>

      {/* Maintenance Schedule */}
      <div className="bg-slate-800 rounded-xl border border-slate-700">
        <div className="p-6 border-b border-slate-700">
          <h3 className="text-white font-semibold">Maintenance Schedule</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {maintenanceItems.map((item, index) => {
              const StatusIcon = getStatusIcon(item.status);
              const statusColor = getStatusColor(item.status);
              const priorityColor = getPriorityColor(item.priority);
              
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start space-x-4 p-4 bg-slate-900 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  <div className={`p-2 rounded-lg ${statusColor}`}>
                    <StatusIcon className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-white font-medium">{item.component}</h4>
                        <p className="text-slate-400 text-sm">{item.description}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-1 rounded-full capitalize ${priorityColor.replace('text-', 'bg-').replace('-400', '-400/10')} ${priorityColor}`}>
                          {item.priority}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full capitalize ${statusColor}`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500">Last Service:</span>
                        <div className="text-slate-300">{new Date(item.lastService).toLocaleDateString()}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Next Service:</span>
                        <div className="text-slate-300">{new Date(item.nextService).toLocaleDateString()}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Duration:</span>
                        <div className="text-slate-300">{item.estimatedDuration}</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Component Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-semibold mb-4">Component Health Status</h3>
          <div className="space-y-4">
            {[
              { name: 'Main Bearing', health: 95, trend: 'stable', color: 'bg-green-400' },
              { name: 'Gearbox', health: 78, trend: 'declining', color: 'bg-amber-400' },
              { name: 'Generator', health: 92, trend: 'improving', color: 'bg-green-400' },
              { name: 'Power Electronics', health: 88, trend: 'stable', color: 'bg-green-400' },
              { name: 'Blade System', health: 85, trend: 'declining', color: 'bg-amber-400' },
              { name: 'Control System', health: 98, trend: 'stable', color: 'bg-green-400' },
            ].map((component, index) => (
              <div key={component.name} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 text-sm">{component.name}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-white text-sm">{component.health}%</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      component.trend === 'improving' ? 'bg-green-400/10 text-green-400' :
                      component.trend === 'declining' ? 'bg-amber-400/10 text-amber-400' :
                      'bg-blue-400/10 text-blue-400'
                    }`}>
                      {component.trend}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <motion.div
                    className={`h-2 rounded-full ${component.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${component.health}%` }}
                    transition={{ delay: index * 0.1, duration: 1 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Predictive Analytics - Dynamic Component Alerts */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Predictive Analytics</h3>
            {isLoading && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-slate-400">Updating...</span>
              </div>
            )}
          </div>
          
          {error && (
            <div className="p-3 bg-red-400/10 border border-red-400/20 rounded-lg mb-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
          
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {Object.entries(predictions).map(([component, prediction]) => (
                <PredictiveAlert
                  key={component}
                  component={component}
                  status={prediction.status}
                  message={prediction.message}
                  confidence={prediction.confidence}
                  based_on={prediction.based_on}
                />
              ))}
            </AnimatePresence>
            
            {Object.keys(predictions).length === 0 && !isLoading && (
              <div className="text-center py-8">
                <div className="text-slate-400 text-sm">No predictions available</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Maintenance;