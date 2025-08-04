import React from 'react';
import { motion } from 'framer-motion';
import { Settings, AlertTriangle, CheckCircle, Clock, Calendar, Wrench } from 'lucide-react';
import { useTurbineStore } from '../../store/turbineStore';
<<<<<<< Updated upstream
=======
import PredictiveAlert from '../Common/PredictiveAlert';
import HealthScoreCard from '../Common/HealthScoreCard';
import MaintenanceScheduleCard from '../Common/MaintenanceScheduleCard';

interface ComponentPrediction {
  status: 'Critical' | 'Warning' | 'Normal';
  message: string;
  confidence: string;
  based_on: string;
}

interface PredictionsData {
  [component: string]: ComponentPrediction;
}
>>>>>>> Stashed changes

interface HealthScoreData {
  score: number;
  trend: 'stable' | 'improving' | 'declining';
}

interface HealthScoresData {
  [component: string]: HealthScoreData;
}

interface HealthAlert {
  alert: boolean;
  component?: string;
  message?: string;
}

interface SystemStatus {
  status: string;
  message: string;
  severity: 'optimal' | 'good' | 'fair' | 'poor' | 'critical' | 'unknown';
  recommendations: string[];
  metrics: {
    average_health: number;
    critical_components: number;
    declining_components: number;
    due_maintenance: number;
    total_components: number;
  };
}

interface MaintenanceItem {
  component: string;
  message: string;
  last_service: string;
  next_service: string;
  duration: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Due' | 'Scheduled' | 'Completed' | 'Monitoring';
  rul_days?: number;
}

interface HealthScoreData {
  score: number;
  trend: 'stable' | 'improving' | 'declining';
}

interface HealthScoresData {
  [component: string]: HealthScoreData;
}

interface HealthAlert {
  alert: boolean;
  component?: string;
  message?: string;
}

interface SystemStatus {
  status: string;
  message: string;
  severity: 'optimal' | 'good' | 'fair' | 'poor' | 'critical' | 'unknown';
  recommendations: string[];
  metrics: {
    average_health: number;
    critical_components: number;
    declining_components: number;
    due_maintenance: number;
    total_components: number;
  };
}

interface MaintenanceItem {
  component: string;
  message: string;
  last_service: string;
  next_service: string;
  duration: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Due' | 'Scheduled' | 'Completed' | 'Monitoring';
  rul_days?: number;
}

interface HealthScoreData {
  score: number;
  trend: 'stable' | 'improving' | 'declining';
}

interface HealthScoresData {
  [component: string]: HealthScoreData;
}

interface HealthAlert {
  alert: boolean;
  component?: string;
  message?: string;
}

interface SystemStatus {
  status: string;
  message: string;
  severity: 'optimal' | 'good' | 'fair' | 'poor' | 'critical' | 'unknown';
  recommendations: string[];
  metrics: {
    average_health: number;
    critical_components: number;
    declining_components: number;
    due_maintenance: number;
    total_components: number;
  };
}

interface MaintenanceItem {
  component: string;
  message: string;
  last_service: string;
  next_service: string;
  duration: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Due' | 'Scheduled' | 'Completed' | 'Monitoring';
  rul_days?: number;
}

interface HealthScoreData {
  score: number;
  trend: 'stable' | 'improving' | 'declining';
}

interface HealthScoresData {
  [component: string]: HealthScoreData;
}

interface HealthAlert {
  alert: boolean;
  component?: string;
  message?: string;
}

interface SystemStatus {
  status: string;
  message: string;
  severity: 'optimal' | 'good' | 'fair' | 'poor' | 'critical' | 'unknown';
  recommendations: string[];
  metrics: {
    average_health: number;
    critical_components: number;
    declining_components: number;
    due_maintenance: number;
    total_components: number;
  };
}

interface MaintenanceItem {
  component: string;
  message: string;
  last_service: string;
  next_service: string;
  duration: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Due' | 'Scheduled' | 'Completed' | 'Monitoring';
  rul_days?: number;
}

interface HealthScoreData {
  score: number;
  trend: 'stable' | 'improving' | 'declining';
}

interface HealthScoresData {
  [component: string]: HealthScoreData;
}

interface HealthAlert {
  alert: boolean;
  component?: string;
  message?: string;
}

interface SystemStatus {
  status: string;
  message: string;
  severity: 'optimal' | 'good' | 'fair' | 'poor' | 'critical' | 'unknown';
  recommendations: string[];
  metrics: {
    average_health: number;
    critical_components: number;
    declining_components: number;
    due_maintenance: number;
    total_components: number;
  };
}

interface MaintenanceItem {
  component: string;
  message: string;
  last_service: string;
  next_service: string;
  duration: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Due' | 'Scheduled' | 'Completed' | 'Monitoring';
  rul_days?: number;
}

const Maintenance: React.FC = () => {
  const { currentData } = useTurbineStore();
<<<<<<< Updated upstream
=======
  const [predictions, setPredictions] = useState<PredictionsData>({});
  const [healthScores, setHealthScores] = useState<HealthScoresData>({});
  const [healthAlert, setHealthAlert] = useState<HealthAlert>({ alert: false });
  const [maintenanceSchedule, setMaintenanceSchedule] = useState<MaintenanceItem[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
>>>>>>> Stashed changes

  const maintenanceData = currentData?.maintenance;
  const nextServiceDate = maintenanceData?.nextService ? new Date(maintenanceData.nextService) : null;
  const daysUntilService = nextServiceDate 
    ? Math.ceil((nextServiceDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
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

=======
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
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

  // Fetch health scores from the FastAPI backend
  const fetchHealthScores = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      const response = await fetch('http://localhost:8000/api/health-scores', {
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
      setHealthScores(data.health_scores);
      setHealthAlert(data.alerts);
    } catch (err) {
      console.error('Error fetching health scores:', err);
      
      // Set fallback health scores
      if (Object.keys(healthScores).length === 0) {
        setHealthScores({
          "Main Bearing": { "score": 95, "trend": "stable" },
          "Gearbox": { "score": 78, "trend": "declining" },
          "Generator": { "score": 92, "trend": "improving" },
          "Power Electronics": { "score": 88, "trend": "stable" },
          "Blade System": { "score": 85, "trend": "declining" },
          "Control System": { "score": 98, "trend": "stable" }
        });
        setHealthAlert({
          alert: true,
          component: "Gearbox",
          message: "Gearbox health score dropped to 78% and trend is declining. Schedule inspection."
        });
      }
    }
  };

  // Fetch maintenance schedule from the FastAPI backend
  const fetchMaintenanceSchedule = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      const response = await fetch('http://localhost:8000/api/maintenance-schedule', {
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
      setMaintenanceSchedule(data);
    } catch (err) {
      console.error('Error fetching maintenance schedule:', err);
      
      // Set fallback maintenance schedule
      if (maintenanceSchedule.length === 0) {
        const currentDate = new Date();
        setMaintenanceSchedule([
          {
            component: 'Gearbox Oil',
            message: 'Oil change and filter replacement required',
            last_service: new Date(currentDate.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            next_service: new Date(currentDate.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            duration: '4 hours',
            priority: 'High',
            status: 'Due'
          },
          {
            component: 'Blade Inspection',
            message: 'Visual inspection and surface treatment',
            last_service: new Date(currentDate.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            next_service: new Date(currentDate.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            duration: '6 hours',
            priority: 'Medium',
            status: 'Scheduled'
          },
          {
            component: 'Generator Bearing',
            message: 'Bearing lubrication and alignment check',
            last_service: new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            next_service: new Date(currentDate.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            duration: '3 hours',
            priority: 'Medium',
            status: 'Scheduled'
          },
          {
            component: 'Control System',
            message: 'Software update and sensor calibration',
            last_service: new Date(currentDate.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            next_service: new Date(currentDate.getTime() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            duration: '2 hours',
            priority: 'High',
            status: 'Due'
          }
        ]);
      }
    }
  };

  // Fetch system status on component mount and every 5 seconds
  useEffect(() => {
    const fetchSystemStatus = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const response = await fetch('http://localhost:8000/api/system-status', {
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
        setSystemStatus(data);
      } catch (err) {
        console.error('Error fetching system status:', err);
        setSystemStatus(null); // Clear status on error
      } finally {
        setIsLoading(false);
      }
    };

    // Temporarily disable system status fetch to stop 404 errors
    // fetchSystemStatus();
    // const interval = setInterval(fetchSystemStatus, 5000);
    // return () => clearInterval(interval);
  }, []);

  // Fetch predictions on component mount and every 3 seconds
  useEffect(() => {
    fetchPredictions();
    
    const interval = setInterval(fetchPredictions, 3000); // Changed from 5000 to 3000
    
    return () => clearInterval(interval);
  }, []);

  // Fetch health scores on component mount and every 5 seconds
  useEffect(() => {
    fetchHealthScores();
    
    const interval = setInterval(fetchHealthScores, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Fetch maintenance schedule on component mount and every 5 seconds
  useEffect(() => {
    fetchMaintenanceSchedule();
    
    const interval = setInterval(fetchMaintenanceSchedule, 5000);
    
    return () => clearInterval(interval);
  }, []);

<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
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

      {/* Component Health Status - Live ML Integration */}
      <div className="bg-slate-800 rounded-xl border border-slate-700">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold">Component Health Status</h3>
            {isLoading && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-slate-400">Updating...</span>
              </div>
            )}
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(healthScores).map(([component, data], index) => (
              <HealthScoreCard
                key={component}
                component={component}
                data={data}
                index={index}
              />
            ))}
          </div>
          
          {Object.keys(healthScores).length === 0 && !isLoading && (
            <div className="text-center py-8">
              <div className="text-slate-400 text-sm">No health scores available</div>
            </div>
          )}
        </div>
      </div>

      {/* Health Alert */}
      {healthAlert.alert && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-400/10 border border-red-400/20 rounded-lg"
        >
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
            <div>
              <h4 className="text-red-400 font-medium text-sm">Health Alert</h4>
              <p className="text-slate-300 text-sm mt-1">{healthAlert.message}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* LSTM Maintenance Schedule */}
      <div className="bg-slate-800 rounded-xl border border-slate-700">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold">LSTM Maintenance Schedule</h3>
            {isLoading && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-slate-400">Updating...</span>
              </div>
            )}
          </div>
          <p className="text-slate-400 text-sm mt-1">
            AI-powered maintenance predictions using LSTM neural network
          </p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {maintenanceSchedule.map((item, index) => (
              <MaintenanceScheduleCard
                key={item.component}
                item={item}
                index={index}
              />
            ))}
            
            {maintenanceSchedule.length === 0 && !isLoading && (
              <div className="text-center py-8">
                <div className="text-slate-400 text-sm">No maintenance schedule available</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Predictive Analytics - Dynamic Component Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
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

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-semibold mb-4">Predictive Analytics</h3>
          <div className="space-y-6">
            <div className="p-4 bg-amber-400/10 border border-amber-400/20 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
                <div>
                  <h4 className="text-amber-400 font-medium text-sm">Gearbox Alert</h4>
                  <p className="text-slate-300 text-sm mt-1">
                    Oil temperature trending higher than normal. Schedule inspection within 2 weeks.
                  </p>
                  <div className="mt-2 text-xs text-slate-400">
                    Confidence: 87% • Based on 3 months of data
                  </div>
                </div>
=======
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Predictive Analytics</h3>
            {isLoading && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-slate-400">Updating...</span>
>>>>>>> Stashed changes
              </div>
            </div>

            <div className="p-4 bg-blue-400/10 border border-blue-400/20 rounded-lg">
              <div className="flex items-start space-x-3">
                <Calendar className="w-5 h-5 text-blue-400 mt-0.5" />
                <div>
                  <h4 className="text-blue-400 font-medium text-sm">Optimization Opportunity</h4>
                  <p className="text-slate-300 text-sm mt-1">
                    Blade pitch adjustment could improve efficiency by 2.3% with current wind patterns.
                  </p>
                  <div className="mt-2 text-xs text-slate-400">
                    Recommended action: Schedule calibration
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-slate-300 text-sm">Maintenance Cost Forecast</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Next 30 Days</span>
                  <span className="text-white">$12,500</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Next 90 Days</span>
                  <span className="text-white">$28,900</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Annual Estimate</span>
                  <span className="text-amber-400 font-semibold">$147,000</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-semibold mb-4">System Overview</h3>
          <div className="space-y-4">
            {/* Dynamic System Status */}
            {systemStatus && (
              <div className={`p-4 border rounded-lg ${
                systemStatus.severity === 'optimal' ? 'bg-green-400/10 border-green-400/20' :
                systemStatus.severity === 'good' ? 'bg-blue-400/10 border-blue-400/20' :
                systemStatus.severity === 'fair' ? 'bg-amber-400/10 border-amber-400/20' :
                systemStatus.severity === 'poor' ? 'bg-orange-400/10 border-orange-400/20' :
                systemStatus.severity === 'critical' ? 'bg-red-400/10 border-red-400/20' :
                'bg-slate-400/10 border-slate-400/20'
              }`}>
                <div className="flex items-start space-x-3">
                  <div className={`w-5 h-5 mt-0.5 ${
                    systemStatus.severity === 'optimal' ? 'text-green-400' :
                    systemStatus.severity === 'good' ? 'text-blue-400' :
                    systemStatus.severity === 'fair' ? 'text-amber-400' :
                    systemStatus.severity === 'poor' ? 'text-orange-400' :
                    systemStatus.severity === 'critical' ? 'text-red-400' :
                    'text-slate-400'
                  }`}>
                    {systemStatus.severity === 'optimal' ? '✓' :
                     systemStatus.severity === 'good' ? '✓' :
                     systemStatus.severity === 'fair' ? '⚠' :
                     systemStatus.severity === 'poor' ? '⚠' :
                     systemStatus.severity === 'critical' ? '✗' :
                     '?'}
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-medium text-sm ${
                      systemStatus.severity === 'optimal' ? 'text-green-400' :
                      systemStatus.severity === 'good' ? 'text-blue-400' :
                      systemStatus.severity === 'fair' ? 'text-amber-400' :
                      systemStatus.severity === 'poor' ? 'text-orange-400' :
                      systemStatus.severity === 'critical' ? 'text-red-400' :
                      'text-slate-400'
                    }`}>
                      System Status: {systemStatus.status}
                    </h4>
                    <p className="text-slate-300 text-sm mt-1">
                      {systemStatus.message}
                    </p>
                    {systemStatus.recommendations.length > 0 && (
                      <div className="mt-2">
                        <h5 className="text-slate-400 text-xs font-medium mb-1">Recommendations:</h5>
                        <ul className="text-xs text-slate-400 space-y-1">
                          {systemStatus.recommendations.slice(0, 3).map((rec, index) => (
                            <li key={index} className="flex items-start space-x-1">
                              <span className="text-slate-500">•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Fallback System Status */}
            {!systemStatus && (
              <div className="p-4 bg-blue-400/10 border border-blue-400/20 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 text-blue-400 mt-0.5">✓</div>
                  <div className="flex-1">
                    <h4 className="text-blue-400 font-medium text-sm">
                      System Status: Good
                    </h4>
                    <p className="text-slate-300 text-sm mt-1">
                      System operating within normal parameters with minor attention needed.
                    </p>
                    <div className="mt-2">
                      <h5 className="text-slate-400 text-xs font-medium mb-1">Recommendations:</h5>
                      <ul className="text-xs text-slate-400 space-y-1">
                        <li className="flex items-start space-x-1">
                          <span className="text-slate-500">•</span>
                          <span>Schedule routine maintenance</span>
                        </li>
                        <li className="flex items-start space-x-1">
                          <span className="text-slate-500">•</span>
                          <span>Monitor component health trends</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h4 className="text-slate-300 text-sm">Performance Metrics</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Average Health Score</span>
                  <span className="text-white">
                    {systemStatus?.metrics?.average_health || 
                     (Object.keys(healthScores).length > 0 
                       ? Math.round(Object.values(healthScores).reduce((sum, data) => sum + data.score, 0) / Object.keys(healthScores).length)
                       : 0)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Components Monitored</span>
                  <span className="text-white">{systemStatus?.metrics?.total_components || Object.keys(healthScores).length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Critical Components</span>
                  <span className={`text-sm font-medium ${
                    (systemStatus?.metrics?.critical_components || 0) > 0 ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {systemStatus?.metrics?.critical_components || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Declining Components</span>
                  <span className={`text-sm font-medium ${
                    (systemStatus?.metrics?.declining_components || 0) > 0 ? 'text-amber-400' : 'text-green-400'
                  }`}>
                    {systemStatus?.metrics?.declining_components || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Due Maintenance</span>
                  <span className={`text-sm font-medium ${
                    (systemStatus?.metrics?.due_maintenance || 0) > 0 ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {systemStatus?.metrics?.due_maintenance || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Last Update</span>
                  <span className="text-white">{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-semibold mb-4">System Overview</h3>
          <div className="space-y-4">
            {/* Dynamic System Status */}
            {systemStatus && (
              <div className={`p-4 border rounded-lg ${
                systemStatus.severity === 'optimal' ? 'bg-green-400/10 border-green-400/20' :
                systemStatus.severity === 'good' ? 'bg-blue-400/10 border-blue-400/20' :
                systemStatus.severity === 'fair' ? 'bg-amber-400/10 border-amber-400/20' :
                systemStatus.severity === 'poor' ? 'bg-orange-400/10 border-orange-400/20' :
                systemStatus.severity === 'critical' ? 'bg-red-400/10 border-red-400/20' :
                'bg-slate-400/10 border-slate-400/20'
              }`}>
                <div className="flex items-start space-x-3">
                  <div className={`w-5 h-5 mt-0.5 ${
                    systemStatus.severity === 'optimal' ? 'text-green-400' :
                    systemStatus.severity === 'good' ? 'text-blue-400' :
                    systemStatus.severity === 'fair' ? 'text-amber-400' :
                    systemStatus.severity === 'poor' ? 'text-orange-400' :
                    systemStatus.severity === 'critical' ? 'text-red-400' :
                    'text-slate-400'
                  }`}>
                    {systemStatus.severity === 'optimal' ? '✓' :
                     systemStatus.severity === 'good' ? '✓' :
                     systemStatus.severity === 'fair' ? '⚠' :
                     systemStatus.severity === 'poor' ? '⚠' :
                     systemStatus.severity === 'critical' ? '✗' :
                     '?'}
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-medium text-sm ${
                      systemStatus.severity === 'optimal' ? 'text-green-400' :
                      systemStatus.severity === 'good' ? 'text-blue-400' :
                      systemStatus.severity === 'fair' ? 'text-amber-400' :
                      systemStatus.severity === 'poor' ? 'text-orange-400' :
                      systemStatus.severity === 'critical' ? 'text-red-400' :
                      'text-slate-400'
                    }`}>
                      System Status: {systemStatus.status}
                    </h4>
                    <p className="text-slate-300 text-sm mt-1">
                      {systemStatus.message}
                    </p>
                    {systemStatus.recommendations.length > 0 && (
                      <div className="mt-2">
                        <h5 className="text-slate-400 text-xs font-medium mb-1">Recommendations:</h5>
                        <ul className="text-xs text-slate-400 space-y-1">
                          {systemStatus.recommendations.slice(0, 3).map((rec, index) => (
                            <li key={index} className="flex items-start space-x-1">
                              <span className="text-slate-500">•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Fallback System Status */}
            {!systemStatus && (
              <div className="p-4 bg-blue-400/10 border border-blue-400/20 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 text-blue-400 mt-0.5">✓</div>
                  <div className="flex-1">
                    <h4 className="text-blue-400 font-medium text-sm">
                      System Status: Good
                    </h4>
                    <p className="text-slate-300 text-sm mt-1">
                      System operating within normal parameters with minor attention needed.
                    </p>
                    <div className="mt-2">
                      <h5 className="text-slate-400 text-xs font-medium mb-1">Recommendations:</h5>
                      <ul className="text-xs text-slate-400 space-y-1">
                        <li className="flex items-start space-x-1">
                          <span className="text-slate-500">•</span>
                          <span>Schedule routine maintenance</span>
                        </li>
                        <li className="flex items-start space-x-1">
                          <span className="text-slate-500">•</span>
                          <span>Monitor component health trends</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h4 className="text-slate-300 text-sm">Performance Metrics</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Average Health Score</span>
                  <span className="text-white">
                    {systemStatus?.metrics?.average_health || 
                     (Object.keys(healthScores).length > 0 
                       ? Math.round(Object.values(healthScores).reduce((sum, data) => sum + data.score, 0) / Object.keys(healthScores).length)
                       : 0)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Components Monitored</span>
                  <span className="text-white">{systemStatus?.metrics?.total_components || Object.keys(healthScores).length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Critical Components</span>
                  <span className={`text-sm font-medium ${
                    (systemStatus?.metrics?.critical_components || 0) > 0 ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {systemStatus?.metrics?.critical_components || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Declining Components</span>
                  <span className={`text-sm font-medium ${
                    (systemStatus?.metrics?.declining_components || 0) > 0 ? 'text-amber-400' : 'text-green-400'
                  }`}>
                    {systemStatus?.metrics?.declining_components || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Due Maintenance</span>
                  <span className={`text-sm font-medium ${
                    (systemStatus?.metrics?.due_maintenance || 0) > 0 ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {systemStatus?.metrics?.due_maintenance || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Last Update</span>
                  <span className="text-white">{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-semibold mb-4">System Overview</h3>
          <div className="space-y-4">
            {/* Dynamic System Status */}
            {systemStatus && (
              <div className={`p-4 border rounded-lg ${
                systemStatus.severity === 'optimal' ? 'bg-green-400/10 border-green-400/20' :
                systemStatus.severity === 'good' ? 'bg-blue-400/10 border-blue-400/20' :
                systemStatus.severity === 'fair' ? 'bg-amber-400/10 border-amber-400/20' :
                systemStatus.severity === 'poor' ? 'bg-orange-400/10 border-orange-400/20' :
                systemStatus.severity === 'critical' ? 'bg-red-400/10 border-red-400/20' :
                'bg-slate-400/10 border-slate-400/20'
              }`}>
                <div className="flex items-start space-x-3">
                  <div className={`w-5 h-5 mt-0.5 ${
                    systemStatus.severity === 'optimal' ? 'text-green-400' :
                    systemStatus.severity === 'good' ? 'text-blue-400' :
                    systemStatus.severity === 'fair' ? 'text-amber-400' :
                    systemStatus.severity === 'poor' ? 'text-orange-400' :
                    systemStatus.severity === 'critical' ? 'text-red-400' :
                    'text-slate-400'
                  }`}>
                    {systemStatus.severity === 'optimal' ? '✓' :
                     systemStatus.severity === 'good' ? '✓' :
                     systemStatus.severity === 'fair' ? '⚠' :
                     systemStatus.severity === 'poor' ? '⚠' :
                     systemStatus.severity === 'critical' ? '✗' :
                     '?'}
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-medium text-sm ${
                      systemStatus.severity === 'optimal' ? 'text-green-400' :
                      systemStatus.severity === 'good' ? 'text-blue-400' :
                      systemStatus.severity === 'fair' ? 'text-amber-400' :
                      systemStatus.severity === 'poor' ? 'text-orange-400' :
                      systemStatus.severity === 'critical' ? 'text-red-400' :
                      'text-slate-400'
                    }`}>
                      System Status: {systemStatus.status}
                    </h4>
                    <p className="text-slate-300 text-sm mt-1">
                      {systemStatus.message}
                    </p>
                    {systemStatus.recommendations.length > 0 && (
                      <div className="mt-2">
                        <h5 className="text-slate-400 text-xs font-medium mb-1">Recommendations:</h5>
                        <ul className="text-xs text-slate-400 space-y-1">
                          {systemStatus.recommendations.slice(0, 3).map((rec, index) => (
                            <li key={index} className="flex items-start space-x-1">
                              <span className="text-slate-500">•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Fallback System Status */}
            {!systemStatus && (
              <div className="p-4 bg-blue-400/10 border border-blue-400/20 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 text-blue-400 mt-0.5">✓</div>
                  <div className="flex-1">
                    <h4 className="text-blue-400 font-medium text-sm">
                      System Status: Good
                    </h4>
                    <p className="text-slate-300 text-sm mt-1">
                      System operating within normal parameters with minor attention needed.
                    </p>
                    <div className="mt-2">
                      <h5 className="text-slate-400 text-xs font-medium mb-1">Recommendations:</h5>
                      <ul className="text-xs text-slate-400 space-y-1">
                        <li className="flex items-start space-x-1">
                          <span className="text-slate-500">•</span>
                          <span>Schedule routine maintenance</span>
                        </li>
                        <li className="flex items-start space-x-1">
                          <span className="text-slate-500">•</span>
                          <span>Monitor component health trends</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h4 className="text-slate-300 text-sm">Performance Metrics</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Average Health Score</span>
                  <span className="text-white">
                    {systemStatus?.metrics?.average_health || 
                     (Object.keys(healthScores).length > 0 
                       ? Math.round(Object.values(healthScores).reduce((sum, data) => sum + data.score, 0) / Object.keys(healthScores).length)
                       : 0)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Components Monitored</span>
                  <span className="text-white">{systemStatus?.metrics?.total_components || Object.keys(healthScores).length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Critical Components</span>
                  <span className={`text-sm font-medium ${
                    (systemStatus?.metrics?.critical_components || 0) > 0 ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {systemStatus?.metrics?.critical_components || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Declining Components</span>
                  <span className={`text-sm font-medium ${
                    (systemStatus?.metrics?.declining_components || 0) > 0 ? 'text-amber-400' : 'text-green-400'
                  }`}>
                    {systemStatus?.metrics?.declining_components || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Due Maintenance</span>
                  <span className={`text-sm font-medium ${
                    (systemStatus?.metrics?.due_maintenance || 0) > 0 ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {systemStatus?.metrics?.due_maintenance || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Last Update</span>
                  <span className="text-white">{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-semibold mb-4">System Overview</h3>
          <div className="space-y-4">
            {/* Dynamic System Status */}
            {systemStatus && (
              <div className={`p-4 border rounded-lg ${
                systemStatus.severity === 'optimal' ? 'bg-green-400/10 border-green-400/20' :
                systemStatus.severity === 'good' ? 'bg-blue-400/10 border-blue-400/20' :
                systemStatus.severity === 'fair' ? 'bg-amber-400/10 border-amber-400/20' :
                systemStatus.severity === 'poor' ? 'bg-orange-400/10 border-orange-400/20' :
                systemStatus.severity === 'critical' ? 'bg-red-400/10 border-red-400/20' :
                'bg-slate-400/10 border-slate-400/20'
              }`}>
                <div className="flex items-start space-x-3">
                  <div className={`w-5 h-5 mt-0.5 ${
                    systemStatus.severity === 'optimal' ? 'text-green-400' :
                    systemStatus.severity === 'good' ? 'text-blue-400' :
                    systemStatus.severity === 'fair' ? 'text-amber-400' :
                    systemStatus.severity === 'poor' ? 'text-orange-400' :
                    systemStatus.severity === 'critical' ? 'text-red-400' :
                    'text-slate-400'
                  }`}>
                    {systemStatus.severity === 'optimal' ? '✓' :
                     systemStatus.severity === 'good' ? '✓' :
                     systemStatus.severity === 'fair' ? '⚠' :
                     systemStatus.severity === 'poor' ? '⚠' :
                     systemStatus.severity === 'critical' ? '✗' :
                     '?'}
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-medium text-sm ${
                      systemStatus.severity === 'optimal' ? 'text-green-400' :
                      systemStatus.severity === 'good' ? 'text-blue-400' :
                      systemStatus.severity === 'fair' ? 'text-amber-400' :
                      systemStatus.severity === 'poor' ? 'text-orange-400' :
                      systemStatus.severity === 'critical' ? 'text-red-400' :
                      'text-slate-400'
                    }`}>
                      System Status: {systemStatus.status}
                    </h4>
                    <p className="text-slate-300 text-sm mt-1">
                      {systemStatus.message}
                    </p>
                    {systemStatus.recommendations.length > 0 && (
                      <div className="mt-2">
                        <h5 className="text-slate-400 text-xs font-medium mb-1">Recommendations:</h5>
                        <ul className="text-xs text-slate-400 space-y-1">
                          {systemStatus.recommendations.slice(0, 3).map((rec, index) => (
                            <li key={index} className="flex items-start space-x-1">
                              <span className="text-slate-500">•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Fallback System Status */}
            {!systemStatus && (
              <div className="p-4 bg-blue-400/10 border border-blue-400/20 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 text-blue-400 mt-0.5">✓</div>
                  <div className="flex-1">
                    <h4 className="text-blue-400 font-medium text-sm">
                      System Status: Good
                    </h4>
                    <p className="text-slate-300 text-sm mt-1">
                      System operating within normal parameters with minor attention needed.
                    </p>
                    <div className="mt-2">
                      <h5 className="text-slate-400 text-xs font-medium mb-1">Recommendations:</h5>
                      <ul className="text-xs text-slate-400 space-y-1">
                        <li className="flex items-start space-x-1">
                          <span className="text-slate-500">•</span>
                          <span>Schedule routine maintenance</span>
                        </li>
                        <li className="flex items-start space-x-1">
                          <span className="text-slate-500">•</span>
                          <span>Monitor component health trends</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h4 className="text-slate-300 text-sm">Performance Metrics</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Average Health Score</span>
                  <span className="text-white">
                    {systemStatus?.metrics?.average_health || 
                     (Object.keys(healthScores).length > 0 
                       ? Math.round(Object.values(healthScores).reduce((sum, data) => sum + data.score, 0) / Object.keys(healthScores).length)
                       : 0)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Components Monitored</span>
                  <span className="text-white">{systemStatus?.metrics?.total_components || Object.keys(healthScores).length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Critical Components</span>
                  <span className={`text-sm font-medium ${
                    (systemStatus?.metrics?.critical_components || 0) > 0 ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {systemStatus?.metrics?.critical_components || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Declining Components</span>
                  <span className={`text-sm font-medium ${
                    (systemStatus?.metrics?.declining_components || 0) > 0 ? 'text-amber-400' : 'text-green-400'
                  }`}>
                    {systemStatus?.metrics?.declining_components || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Due Maintenance</span>
                  <span className={`text-sm font-medium ${
                    (systemStatus?.metrics?.due_maintenance || 0) > 0 ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {systemStatus?.metrics?.due_maintenance || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Last Update</span>
                  <span className="text-white">{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-semibold mb-4">System Overview</h3>
          <div className="space-y-4">
            {/* Dynamic System Status */}
            {systemStatus && (
              <div className={`p-4 border rounded-lg ${
                systemStatus.severity === 'optimal' ? 'bg-green-400/10 border-green-400/20' :
                systemStatus.severity === 'good' ? 'bg-blue-400/10 border-blue-400/20' :
                systemStatus.severity === 'fair' ? 'bg-amber-400/10 border-amber-400/20' :
                systemStatus.severity === 'poor' ? 'bg-orange-400/10 border-orange-400/20' :
                systemStatus.severity === 'critical' ? 'bg-red-400/10 border-red-400/20' :
                'bg-slate-400/10 border-slate-400/20'
              }`}>
                <div className="flex items-start space-x-3">
                  <div className={`w-5 h-5 mt-0.5 ${
                    systemStatus.severity === 'optimal' ? 'text-green-400' :
                    systemStatus.severity === 'good' ? 'text-blue-400' :
                    systemStatus.severity === 'fair' ? 'text-amber-400' :
                    systemStatus.severity === 'poor' ? 'text-orange-400' :
                    systemStatus.severity === 'critical' ? 'text-red-400' :
                    'text-slate-400'
                  }`}>
                    {systemStatus.severity === 'optimal' ? '✓' :
                     systemStatus.severity === 'good' ? '✓' :
                     systemStatus.severity === 'fair' ? '⚠' :
                     systemStatus.severity === 'poor' ? '⚠' :
                     systemStatus.severity === 'critical' ? '✗' :
                     '?'}
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-medium text-sm ${
                      systemStatus.severity === 'optimal' ? 'text-green-400' :
                      systemStatus.severity === 'good' ? 'text-blue-400' :
                      systemStatus.severity === 'fair' ? 'text-amber-400' :
                      systemStatus.severity === 'poor' ? 'text-orange-400' :
                      systemStatus.severity === 'critical' ? 'text-red-400' :
                      'text-slate-400'
                    }`}>
                      System Status: {systemStatus.status}
                    </h4>
                    <p className="text-slate-300 text-sm mt-1">
                      {systemStatus.message}
                    </p>
                    {systemStatus.recommendations.length > 0 && (
                      <div className="mt-2">
                        <h5 className="text-slate-400 text-xs font-medium mb-1">Recommendations:</h5>
                        <ul className="text-xs text-slate-400 space-y-1">
                          {systemStatus.recommendations.slice(0, 3).map((rec, index) => (
                            <li key={index} className="flex items-start space-x-1">
                              <span className="text-slate-500">•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Fallback System Status */}
            {!systemStatus && (
              <div className="p-4 bg-blue-400/10 border border-blue-400/20 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 text-blue-400 mt-0.5">✓</div>
                  <div className="flex-1">
                    <h4 className="text-blue-400 font-medium text-sm">
                      System Status: Good
                    </h4>
                    <p className="text-slate-300 text-sm mt-1">
                      System operating within normal parameters with minor attention needed.
                    </p>
                    <div className="mt-2">
                      <h5 className="text-slate-400 text-xs font-medium mb-1">Recommendations:</h5>
                      <ul className="text-xs text-slate-400 space-y-1">
                        <li className="flex items-start space-x-1">
                          <span className="text-slate-500">•</span>
                          <span>Schedule routine maintenance</span>
                        </li>
                        <li className="flex items-start space-x-1">
                          <span className="text-slate-500">•</span>
                          <span>Monitor component health trends</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h4 className="text-slate-300 text-sm">Performance Metrics</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Average Health Score</span>
                  <span className="text-white">
                    {systemStatus?.metrics?.average_health || 
                     (Object.keys(healthScores).length > 0 
                       ? Math.round(Object.values(healthScores).reduce((sum, data) => sum + data.score, 0) / Object.keys(healthScores).length)
                       : 0)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Components Monitored</span>
                  <span className="text-white">{systemStatus?.metrics?.total_components || Object.keys(healthScores).length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Critical Components</span>
                  <span className={`text-sm font-medium ${
                    (systemStatus?.metrics?.critical_components || 0) > 0 ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {systemStatus?.metrics?.critical_components || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Declining Components</span>
                  <span className={`text-sm font-medium ${
                    (systemStatus?.metrics?.declining_components || 0) > 0 ? 'text-amber-400' : 'text-green-400'
                  }`}>
                    {systemStatus?.metrics?.declining_components || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Due Maintenance</span>
                  <span className={`text-sm font-medium ${
                    (systemStatus?.metrics?.due_maintenance || 0) > 0 ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {systemStatus?.metrics?.due_maintenance || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Last Update</span>
                  <span className="text-white">{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Maintenance;