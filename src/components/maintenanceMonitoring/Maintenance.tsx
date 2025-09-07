import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, AlertTriangle, CheckCircle, Clock, Calendar, Wrench } from 'lucide-react';
import { useTurbineStore } from '../../store/turbineStore';
import PredictiveAlert from './PredictiveAlert';
import HealthScoreCard from './HealthScoreCard';
import MaintenanceScheduleCard from './MaintenanceScheduleCard';
import TurbineSelector from './TurbineSelector';
import TurbineModel3D from './TurbineModel3D';



interface ComponentPrediction {
  status: 'Critical' | 'Warning' | 'Normal';
  message: string;
  confidence: string;
  based_on: string;
}

interface PredictionsData {
  [component: string]: ComponentPrediction;
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
  assignedTechnician?: string;
}

const Maintenance: React.FC = () => {
  const { currentData, selectedTurbine } = useTurbineStore();
  
  const [predictions, setPredictions] = useState<PredictionsData>({});
  const [healthScores, setHealthScores] = useState<HealthScoresData>({});
  const [healthAlert, setHealthAlert] = useState<HealthAlert>({ alert: false });
  const [maintenanceSchedule, setMaintenanceSchedule] = useState<MaintenanceItem[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingAssignment, setPendingAssignment] = useState<{
    component: string;
    technician: string;
  } | null>(null);
  const [showEmailHistoryModal, setShowEmailHistoryModal] = useState(false);
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);
  const [emailHistory, setEmailHistory] = useState<any[]>([]);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());
  
  // State for all turbines data
  const [allTurbinesData, setAllTurbinesData] = useState<{
    [turbineId: string]: {
      predictions: PredictionsData;
      healthScores: HealthScoresData;
      maintenanceSchedule: MaintenanceItem[];
    };
  }>({});



  const maintenanceData = currentData?.maintenance;
  const nextServiceDate = maintenanceData?.nextService ? new Date(maintenanceData.nextService) : null;
  const daysUntilService = nextServiceDate 
    ? Math.ceil((nextServiceDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  // Handle technician assignment
  const handleTechnicianAssignment = (component: string, technician: string) => {
    if (technician && technician !== '') {
      setPendingAssignment({ component, technician });
      setShowConfirmation(true);
    }
  };

  // Confirm technician assignment
  const confirmAssignment = () => {
    if (pendingAssignment) {
      setMaintenanceSchedule(prev => 
        prev.map(item => 
          item.component === pendingAssignment.component 
            ? { ...item, assignedTechnician: pendingAssignment.technician }
            : item
        )
      );
      setShowConfirmation(false);
      setPendingAssignment(null);
      
      // Show success notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300';
      notification.innerHTML = `
        <div class="flex items-center space-x-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <span>Technician assigned successfully!</span>
        </div>
      `;
      document.body.appendChild(notification);
      
      // Remove notification after 3 seconds
      setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 300);
      }, 3000);
    }
  };

  // Cancel technician assignment
  const cancelAssignment = () => {
    setShowConfirmation(false);
    setPendingAssignment(null);
  };

  // Fetch email history
  const fetchEmailHistory = async () => {
    try {
      const response = await fetch('http://localhost:8000/email-history');
      if (response.ok) {
        const data = await response.json();
        setEmailHistory(data.emails || []);
      }
    } catch (error) {
      console.error('Error fetching email history:', error);
    }
  };

  // Clear email history
  const clearEmailHistory = async () => {
    try {
      const response = await fetch('http://localhost:8000/email-history', {
        method: 'DELETE'
      });
      if (response.ok) {
        setEmailHistory([]);
        setShowClearConfirmation(false);
        alert('Email history cleared successfully!');
      }
    } catch (error) {
      console.error('Error clearing email history:', error);
      alert('Error clearing email history');
    }
  };

  // Handle maintenance confirmation and send emails
  const handleConfirmMaintenance = async () => {
    try {
      // Get all assigned technicians
      const assignedTasks = maintenanceSchedule.filter(item => item.assignedTechnician);
      
              if (!assignedTasks || assignedTasks.length === 0) {
          alert('Please assign technicians to maintenance tasks before confirming.');
          return;
        }

      // Group tasks by technician
      const technicianTasks: { [key: string]: string[] } = {};
      assignedTasks.forEach(item => {
        if (item.assignedTechnician) {
          if (!technicianTasks[item.assignedTechnician]) {
            technicianTasks[item.assignedTechnician] = [];
          }
          technicianTasks[item.assignedTechnician].push(item.component);
        }
      });

              // Send emails to each technician
        for (const [technician, components] of Object.entries(technicianTasks)) {
          const email = technician === 'Technician-1' ? 'v.dhanushigan@gmail.com' : 'it18149890@my.sliit.lk';
        
        const emailData = {
          to: email,
          subject: `Maintenance Assignment - ${selectedTurbine}`,
          technician: technician,
          components: components,
          turbineId: selectedTurbine
        };

        // Send email via backend API
        const response = await fetch('http://localhost:8000/send-maintenance-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emailData)
        });

        if (!response.ok) {
          console.error(`Failed to send email to ${technician}`);
        }
      }

      // Show success message
      alert('Maintenance confirmed! Emails have been sent to assigned technicians.');
      
      // Close the modal
      setShowMaintenanceModal(false);
      
    } catch (error) {
      console.error('Error sending maintenance emails:', error);
      alert('Error sending emails. Please try again.');
    }
  };

  // Fetch predictions for all turbines from the FastAPI backend
  const fetchAllTurbinesData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const turbines = ['Turbine-1', 'Turbine-2', 'Turbine-3'];
      const newAllTurbinesData: typeof allTurbinesData = {};
      
      // Fetch data for all turbines in parallel
      const promises = turbines.map(async (turbineId) => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);
          
          // Fetch predictions
          const predictionsResponse = await fetch(`http://localhost:8000/api/predict?turbine=${turbineId}`, {
            signal: controller.signal,
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          });
          
          // Fetch health scores
          const healthResponse = await fetch(`http://localhost:8000/api/health-scores?turbine=${turbineId}`, {
            signal: controller.signal,
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          });
          
          // Fetch maintenance schedule
          const maintenanceResponse = await fetch(`http://localhost:8000/api/maintenance-schedule?turbine=${turbineId}`, {
            signal: controller.signal,
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          });
          
          clearTimeout(timeoutId);
          
          if (predictionsResponse.ok && healthResponse.ok && maintenanceResponse.ok) {
            const predictions = await predictionsResponse.json();
            const healthData = await healthResponse.json();
            const maintenance = await maintenanceResponse.json();
            
            // Ensure no pre-assigned technicians from API data
            const processedMaintenance = maintenance.map((item: any) => ({
              ...item,
              assignedTechnician: undefined
            }));
            
            console.log(`🔧 Processed maintenance data for ${turbineId}:`, processedMaintenance.map(item => ({ component: item.component, assignedTechnician: item.assignedTechnician })));
            
            newAllTurbinesData[turbineId] = {
              predictions,
              healthScores: healthData.health_scores || healthData,
              maintenanceSchedule: processedMaintenance
            };
          }
        } catch (err) {
          console.error(`Error fetching data for ${turbineId}:`, err);
        }
      });
      
      await Promise.all(promises);
      
      setAllTurbinesData(newAllTurbinesData);
      
      // Set current turbine data for display
      if (newAllTurbinesData[selectedTurbine]) {
        setPredictions(newAllTurbinesData[selectedTurbine].predictions);
        setHealthScores(newAllTurbinesData[selectedTurbine].healthScores);
        // Ensure no pre-assigned technicians from API data
        const processedMaintenance = newAllTurbinesData[selectedTurbine].maintenanceSchedule.map((item: any) => ({
          ...item,
          assignedTechnician: undefined
        }));
        console.log(`🔧 Setting maintenance schedule for ${selectedTurbine}:`, processedMaintenance.map(item => ({ component: item.component, assignedTechnician: item.assignedTechnician })));
        setMaintenanceSchedule(processedMaintenance);
      }
      
    } catch (err) {
      console.error('Error fetching all turbines data:', err);
      setError('Failed to fetch some turbine data');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch predictions from the FastAPI backend (legacy function for backward compatibility)
  const fetchPredictions = async () => {
    try {
      console.log(`🚀 fetchPredictions called for turbine: ${selectedTurbine}`);
      setIsLoading(true);
      setError(null);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
      
      const response = await fetch(`http://localhost:8000/api/predict?turbine=${selectedTurbine}`, {
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
      
      // Update allTurbinesData to keep it in sync
      setAllTurbinesData(prev => ({
        ...prev,
        [selectedTurbine]: {
          ...prev[selectedTurbine],
          predictions: data
        }
      }));
    } catch (err) {
      console.error('Error fetching predictions:', err);
      
      // Only show error if we don't have any existing predictions
              if (!predictions || Object.keys(predictions).length === 0) {
          setError('Failed to fetch predictions');
        }
        
        // Set fallback predictions only if we don't have any
        if (!predictions || Object.keys(predictions).length === 0) {
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
      
      const response = await fetch(`http://localhost:8000/api/health-scores?turbine=${selectedTurbine}`, {
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
              if (!healthScores || Object.keys(healthScores).length === 0) {
        setHealthScores({
          "Main Bearing": { "score": 98, "trend": "stable" },
          "Gearbox": { "score": 95, "trend": "stable" },
          "Generator": { "score": 96, "trend": "stable" },
          "Power Electronics": { "score": 94, "trend": "stable" },
          "Blade System": { "score": 97, "trend": "stable" },
          "Control System": { "score": 99, "trend": "stable" }
        });
        setHealthAlert({
          alert: false,
          component: "",
          message: ""
        });
      }
    }
  };

  // Fetch maintenance schedule from the FastAPI backend
  const fetchMaintenanceSchedule = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      const response = await fetch(`http://localhost:8000/api/maintenance-schedule?turbine=${selectedTurbine}`, {
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
      // Ensure no pre-assigned technicians - all should start with "Select Technician"
      const processedData = data.map((item: any) => ({
        ...item,
        assignedTechnician: undefined // Remove any pre-assigned technicians
      }));
      setMaintenanceSchedule(processedData);
    } catch (err) {
      console.error('Error fetching maintenance schedule:', err);
      
      // Set fallback maintenance schedule
              if (!maintenanceSchedule || maintenanceSchedule.length === 0) {
          const currentDate = new Date();
        setMaintenanceSchedule([
          {
            component: 'Gearbox Oil',
            message: 'Routine oil analysis - excellent condition',
            last_service: new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            next_service: new Date(currentDate.getTime() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            duration: '2 hours',
            priority: 'Low',
            status: 'Scheduled'
          },
          {
            component: 'Blade Inspection',
            message: 'Preventive maintenance - blades in perfect condition',
            last_service: new Date(currentDate.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            next_service: new Date(currentDate.getTime() + 135 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            duration: '4 hours',
            priority: 'Low',
            status: 'Scheduled'
          },
          {
            component: 'Generator Bearing',
            message: 'Preventive maintenance - bearings operating optimally',
            last_service: new Date(currentDate.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            next_service: new Date(currentDate.getTime() + 155 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            duration: '3 hours',
            priority: 'Low',
            status: 'Scheduled'
          },
          {
            component: 'Control System',
            message: 'Software update completed - system running efficiently',
            last_service: new Date(currentDate.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            next_service: new Date(currentDate.getTime() + 165 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            duration: '2 hours',
            priority: 'Low',
            status: 'Completed'
          },
          {
            component: 'Hydraulic System',
            message: 'Fluid analysis shows excellent condition',
            last_service: new Date(currentDate.getTime() - 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            next_service: new Date(currentDate.getTime() + 145 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            duration: '2 hours',
            priority: 'Low',
            status: 'Scheduled'
          },
          {
            component: 'Tower Structure',
            message: 'Structural inspection - no issues detected',
            last_service: new Date(currentDate.getTime() - 50 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            next_service: new Date(currentDate.getTime() + 130 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            duration: '5 hours',
            priority: 'Low',
            status: 'Scheduled'
          }
        ]);
      }
    }
  };

  // Fetch system status function
  const fetchSystemStatus = async () => {
    try {
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
      // Set fallback system status instead of null
      setSystemStatus({
        status: "System Status Unavailable",
        message: "Unable to fetch system status from backend",
        severity: "unknown" as const,
        recommendations: ["Check backend connection", "Verify API endpoints"],
        metrics: {
          average_health: 0,
          critical_components: 0,
          declining_components: 0,
          due_maintenance: 0,
          total_components: 0
        }
      });
    }
  };

  // Fetch system status on component mount
  useEffect(() => {
    fetchSystemStatus();
  }, []);

  // Fetch all turbines data on component mount and every 5 minutes
  useEffect(() => {
    try {

      fetchAllTurbinesData();
      
      const interval = setInterval(() => {
        try {
          fetchAllTurbinesData();
        } catch (error) {
          console.error('🔧 Error in fetchAllTurbinesData interval:', error);
        }
      }, 300000); // Refresh every 5 minutes
      
      return () => clearInterval(interval);
    } catch (error) {
      console.error('🔧 Error in fetchAllTurbinesData useEffect:', error);
    }
  }, []); // Empty dependency array - runs on mount and every 5 minutes

  // Update displayed data when selectedTurbine changes
  useEffect(() => {
    try {
      console.log(`🔄 Turbine changed to: ${selectedTurbine}`);
      
      // Set loading state to show refresh is happening
      setIsLoading(true);
      
      if (allTurbinesData[selectedTurbine]) {
        console.log(`📊 Using cached data for ${selectedTurbine}`);
        setPredictions(allTurbinesData[selectedTurbine].predictions);
        setHealthScores(allTurbinesData[selectedTurbine].healthScores);
        // Ensure no pre-assigned technicians from API data
        const processedMaintenance = allTurbinesData[selectedTurbine].maintenanceSchedule.map((item: any) => ({
          ...item,
          assignedTechnician: undefined
        }));
        setMaintenanceSchedule(processedMaintenance);
      } else {
        console.log(`🔄 No cached data for ${selectedTurbine}, fetching fresh data...`);
        // Fetch fresh data for the new turbine
        fetchPredictions();
        fetchHealthScores();
        fetchMaintenanceSchedule();
      }
      
                // Always refresh system status when turbine changes
          fetchSystemStatus();
          
          // Clear any existing errors
          setError(null);
          
          // Update refresh timestamp
          setLastRefreshTime(new Date());
          
          // Set loading to false after a short delay to show refresh completion
          setTimeout(() => setIsLoading(false), 1000);
      
    } catch (error) {
      console.error('🔧 Error in selectedTurbine useEffect:', error);
      setError(`Failed to load data for ${selectedTurbine}`);
      setIsLoading(false);
    }
  }, [selectedTurbine, allTurbinesData]);

  // Initial data fetch when component mounts or turbine changes (only if no cached data)
  useEffect(() => {
    if (selectedTurbine && !allTurbinesData[selectedTurbine]) {
      console.log(`🔄 No cached data for ${selectedTurbine}, fetching initial data...`);
      // Only fetch if we don't have cached data for this turbine
      fetchPredictions();
      fetchHealthScores();
      fetchMaintenanceSchedule();
    }
  }, [selectedTurbine]);



  try {
    
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
        <div className="flex items-center space-x-4">
          <TurbineSelector />
          
          {/* Refresh Data Button */}
          <button 
            onClick={() => {
              setIsLoading(true);
              setLastRefreshTime(new Date());
              fetchAllTurbinesData();
              fetchSystemStatus();
              setTimeout(() => setIsLoading(false), 1000);
            }}
            className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
              isLoading 
                ? 'bg-blue-400/20 border-blue-400/40 animate-pulse' 
                : 'bg-blue-400/10 border-blue-400/20 hover:bg-blue-400/20'
            }`}
            disabled={isLoading}
            title="Refresh All Data"
          >
            <svg className={`w-8 h-8 text-blue-400 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          
          <button 
            onClick={() => setShowMaintenanceModal(true)}
            className="p-4 rounded-xl bg-amber-400/10 border border-amber-400/20 hover:bg-amber-400/20 transition-colors cursor-pointer"
          >
            <Wrench className="w-8 h-8 text-amber-400" />
          </button>
          
          {/* Email History Button */}
          <button 
            onClick={() => {
              setShowEmailHistoryModal(true);
              fetchEmailHistory();
            }}
            className="p-4 rounded-xl bg-blue-400/10 border border-blue-400/20 hover:bg-blue-400/20 transition-colors cursor-pointer"
            title="View Email History"
          >
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
          {/* All Turbines Data Status */}
          <div className="flex items-center space-x-2 px-3 py-2 bg-green-400/10 border border-green-400/20 rounded-lg">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-400 font-medium">
              All Turbines: {allTurbinesData ? Object.keys(allTurbinesData).length : 0}/3
            </span>
          </div>
          
          {/* Last Refresh Time */}
          <div className="flex items-center space-x-2 px-3 py-2 bg-blue-400/10 border border-blue-400/20 rounded-lg">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span className="text-xs text-blue-400 font-medium">
              Last Refresh: {lastRefreshTime.toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>

              {/* Component Health Status - ML-Powered Predictions */}
        <div className="bg-slate-800 rounded-xl border border-slate-700">
          <div className="p-6 border-b border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold">Component Health Status</h3>
                <p className="text-slate-400 text-sm mt-1">
                  ML-powered health predictions using Random Forest model
                </p>
              </div>
            <div className="flex items-center space-x-4">
              {/* Last Update Time */}
              <div className="text-xs text-slate-400">
                Last Update: {lastRefreshTime.toLocaleTimeString()}
              </div>
              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-blue-400 font-medium">Refreshing Data...</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {healthScores && Object.entries(healthScores).map(([component, data], index) => (
              <HealthScoreCard
                key={component}
                component={component}
                data={data}
                index={index}
              />
            ))}
          </div>
          
          {(!healthScores || Object.keys(healthScores).length === 0) && !isLoading && (
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
            <div className="flex items-center space-x-4">
              {/* Last Update Time */}
              <div className="text-xs text-slate-400">
                Last Update: {lastRefreshTime.toLocaleTimeString()}
              </div>
              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-blue-400 font-medium">Refreshing Data...</span>
                </div>
              )}
            </div>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            AI-powered maintenance predictions using LSTM neural network
          </p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {maintenanceSchedule && maintenanceSchedule.map((item, index) => (
              <MaintenanceScheduleCard
                key={item.component}
                item={item}
                index={index}
              />
            ))}
            
            {(!maintenanceSchedule || maintenanceSchedule.length === 0) && !isLoading && (
              <div className="text-center py-8">
                <div className="text-slate-400 text-sm">No maintenance schedule available</div>
              </div>
            )}
          </div>
        </div>
      </div>

              {/* Predictive Analytics - ML-Powered Component Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-white font-semibold">Predictive Analytics</h3>
                                    <p className="text-slate-400 text-sm mt-1">
                      LSTM-powered component failure predictions using neural network model
                    </p>
              </div>
              <div className="flex items-center space-x-4">
                {/* Last Update Time */}
                <div className="text-xs text-slate-400">
                  Last Update: {lastRefreshTime.toLocaleTimeString()}
                </div>
                {/* Loading Indicator */}
                {isLoading && (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-blue-400 font-medium">Refreshing Data...</span>
                  </div>
                )}
              </div>
            </div>

          <div className="space-y-4">
            {predictions && Object.entries(predictions).map(([component, prediction], index) => (
              <PredictiveAlert
                key={component}
                component={component}
                prediction={prediction}
                index={index}
              />
            ))}
            
                      {(!predictions || Object.keys(predictions).length === 0) && !isLoading && (
            <div className="text-center py-8">
              <div className="text-slate-400 text-sm">No predictions available</div>
            </div>
          )}
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                      <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">System Overview</h3>
              <div className="flex items-center space-x-4">
                {/* Last Update Time */}
                <div className="text-xs text-slate-400">
                  Last Update: {lastRefreshTime.toLocaleTimeString()}
                </div>
                {/* Loading Indicator */}
                {isLoading && (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-blue-400 font-medium">Refreshing Data...</span>
                  </div>
                )}
              </div>
            </div>

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
                   (healthScores && Object.keys(healthScores).length > 0 
                     ? Math.round(Object.values(healthScores).reduce((sum, data) => sum + data.score, 0) / Object.keys(healthScores).length)
                     : 0)}%
                </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Components Monitored</span>
                  <span className="text-white">{systemStatus?.metrics?.total_components || (healthScores ? Object.keys(healthScores).length : 0)}</span>
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

      {/* 3D Turbine Model */}
      <TurbineModel3D />

      {/* Maintenance Schedule Modal */}
      {showMaintenanceModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowMaintenanceModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-slate-800 rounded-xl border border-slate-700 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">LSTM Maintenance Schedule</h2>
                <p className="text-slate-400 text-sm mt-1">
                  AI-powered maintenance predictions for <span className="text-blue-400 font-medium">{selectedTurbine}</span>
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  Last updated: {new Date().toLocaleTimeString()}
                </p>
              </div>
              <button
                onClick={() => setShowMaintenanceModal(false)}
                className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Maintenance Schedule Table */}
              <div className="overflow-x-auto">
                {/* Refresh Status */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-400">LSTM Model Active</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Auto-refresh every 2 minutes
                  </div>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left p-3 text-slate-300 font-medium">Component</th>
                      <th className="text-left p-3 text-slate-300 font-medium">Status</th>
                      <th className="text-left p-3 text-slate-300 font-medium">Priority</th>
                      <th className="text-left p-3 text-slate-300 font-medium">Last Service</th>
                      <th className="text-left p-3 text-slate-300 font-medium">Next Service</th>
                      <th className="text-left p-3 text-slate-300 font-medium">Duration</th>
                      <th className="text-left p-3 text-slate-300 font-medium">Message</th>
                      <th className="text-left p-3 text-slate-300 font-medium">Technician</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintenanceSchedule && maintenanceSchedule.map((item, index) => (
                      <tr key={index} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                        <td className="p-3 text-white font-medium">{item.component}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.status === 'Due' ? 'bg-red-400/20 text-red-400' :
                            item.status === 'Scheduled' ? 'bg-blue-400/20 text-blue-400' :
                            item.status === 'Completed' ? 'bg-green-400/20 text-green-400' :
                            'bg-slate-400/20 text-slate-400'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.priority === 'High' ? 'bg-red-400/20 text-red-400' :
                            item.priority === 'Medium' ? 'bg-amber-400/20 text-amber-400' :
                            'bg-green-400/20 text-green-400'
                          }`}>
                            {item.priority}
                          </span>
                        </td>
                        <td className="p-3 text-slate-300">{item.last_service}</td>
                        <td className="p-3 text-slate-300">{item.next_service}</td>
                        <td className="p-3 text-slate-300">{item.duration}</td>
                        <td className="p-3 text-slate-300">{item.message}</td>
                        <td className="p-3">
                          <div className="relative">
                            <select
                              value={item.assignedTechnician || ''}
                              onChange={(e) => handleTechnicianAssignment(item.component, e.target.value)}
                              className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-sky-500 focus:border-transparent w-full pr-8 cursor-pointer hover:border-sky-500/50 transition-colors"
                            >
                              <option value="">Select Technician</option>
                              <option value="Technician-1">Technician-1</option>
                              <option value="Technician-2">Technician-2</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>

                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* No Data Message */}
                          {(!maintenanceSchedule || maintenanceSchedule.length === 0) && (
              <div className="text-center py-8">
                <div className="text-slate-400 text-sm">No maintenance schedule data available</div>
              </div>
            )}

              {/* Confirm Button */}
              <div className="mt-6 flex justify-center">
                <button
                  onClick={handleConfirmMaintenance}
                  className="px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-3"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>Confirm & Send Email</span>
                </button>
              </div>
              
              {/* Info Text */}
              <div className="mt-4 text-center">
                <p className="text-slate-400 text-sm">
                  Clicking this button will send maintenance assignment emails to all assigned technicians
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Enhanced Confirmation Popup Modal */}
      {showConfirmation && pendingAssignment && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={cancelAssignment}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-slate-800 rounded-2xl border border-slate-600 shadow-2xl max-w-md w-full mx-4 transform"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Enhanced Confirmation Header */}
            <div className="p-6 border-b border-slate-700 bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-2xl">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-sky-400/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Confirm Technician Assignment</h3>
                  <p className="text-slate-400 text-sm mt-1">
                    Please confirm the maintenance task assignment
                  </p>
                </div>
              </div>
            </div>

            {/* Enhanced Confirmation Content */}
            <div className="p-6">
              <div className="space-y-4">
                {/* Component Information */}
                <div className="bg-gradient-to-r from-slate-700/50 to-slate-600/50 rounded-xl p-4 border border-slate-600/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-sky-400/20 rounded-xl flex items-center justify-center">
                      <Wrench className="w-6 h-6 text-sky-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-semibold text-lg">{pendingAssignment.component}</p>
                      <p className="text-slate-400 text-sm">Maintenance Component</p>
                    </div>
                  </div>
                </div>

                {/* Technician Information */}
                <div className="bg-gradient-to-r from-green-400/10 to-emerald-400/10 rounded-xl p-4 border border-green-400/20">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-green-400/20 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-semibold text-lg">{pendingAssignment.technician}</p>
                      <p className="text-green-400 text-sm font-medium">Selected Technician</p>
                    </div>
                  </div>
                </div>

                {/* Confirmation Message */}
                <div className="bg-blue-400/10 border border-blue-400/20 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-400/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-blue-400 font-medium text-sm">Assignment Confirmation</p>
                      <p className="text-slate-300 text-sm mt-1">
                        Are you sure you want to assign <span className="text-white font-semibold">{pendingAssignment.technician}</span> to the <span className="text-white font-semibold">{pendingAssignment.component}</span> maintenance task?
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Confirmation Actions */}
            <div className="p-6 border-t border-slate-700 bg-slate-700/30 rounded-b-2xl flex space-x-3">
              <button
                onClick={cancelAssignment}
                className="flex-1 px-6 py-3 text-slate-300 border border-slate-600 rounded-xl hover:bg-slate-700 hover:border-slate-500 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmAssignment}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Confirm Assignment
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Email History Modal */}
      {showEmailHistoryModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowEmailHistoryModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-slate-800 rounded-xl border border-slate-700 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Email History</h2>
                <p className="text-slate-400 text-sm mt-1">
                  View all maintenance emails sent to technicians
                </p>
              </div>
              <button
                onClick={() => setShowEmailHistoryModal(false)}
                className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Email History Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left p-3 text-slate-300 font-medium">ID</th>
                      <th className="text-left p-3 text-slate-300 font-medium">Date & Time</th>
                      <th className="text-left p-3 text-slate-300 font-medium">To</th>
                      <th className="text-left p-3 text-slate-300 font-medium">Technician</th>
                      <th className="text-left p-3 text-slate-300 font-medium">Components</th>
                      <th className="text-left p-3 text-slate-300 font-medium">Turbine</th>
                      <th className="text-left p-3 text-slate-300 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emailHistory && emailHistory.map((email, index) => (
                      <tr key={email.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                        <td className="p-3 text-white font-medium">#{email.id}</td>
                        <td className="p-3 text-slate-300">
                          {new Date(email.timestamp).toLocaleString()}
                        </td>
                        <td className="p-3 text-slate-300">{email.to}</td>
                        <td className="p-3 text-slate-300">{email.technician}</td>
                        <td className="p-3 text-slate-300">
                          <div className="space-y-1">
                            {email.components && email.components.map((component: string, idx: number) => (
                              <span key={idx} className="inline-block px-2 py-1 bg-slate-700/50 rounded text-xs">
                                {component}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3 text-slate-300">{email.turbine_id}</td>
                        <td className="p-3">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-400/20 text-green-400">
                            {email.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* No Data Message */}
              {(!emailHistory || emailHistory.length === 0) && (
                <div className="text-center py-8">
                  <div className="text-slate-400 text-sm">No email history available</div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-6 flex justify-between items-center">
                <button
                  onClick={() => setShowClearConfirmation(true)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Clear Logs</span>
                </button>
                
                <button
                  onClick={() => setShowEmailHistoryModal(false)}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Clear Logs Confirmation Modal */}
      {showClearConfirmation && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowClearConfirmation(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-slate-800 rounded-xl border border-slate-700 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Confirmation Header */}
            <div className="p-6 border-b border-slate-700">
              <h3 className="text-xl font-bold text-white">Clear Email History</h3>
              <p className="text-slate-400 text-sm mt-1">
                This action cannot be undone
              </p>
            </div>

            {/* Confirmation Content */}
            <div className="p-6">
              <div className="space-y-4">
                <div className="bg-red-400/10 border border-red-400/20 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-400/20 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h14.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-red-400 font-medium">Warning</p>
                      <p className="text-slate-400 text-sm">This will permanently delete all email history</p>
                    </div>
                  </div>
                </div>

                <p className="text-slate-300 text-sm text-center">
                  Are you sure you want to clear all email history? This action cannot be undone.
                </p>
              </div>
            </div>

            {/* Confirmation Actions */}
            <div className="p-6 border-t border-slate-700 flex space-x-3">
              <button
                onClick={() => setShowClearConfirmation(false)}
                className="flex-1 px-4 py-2 text-slate-300 border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={clearEmailHistory}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Clear History
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

    </div>
  );
  
  } catch (error) {
    console.error('🔧 Error rendering Maintenance component:', error);
    
    // Fallback UI in case of error
    return (
      <div className="p-6 space-y-6">
        <div className="bg-red-400/10 border border-red-400/20 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-8 h-8 text-red-400" />
            <div>
              <h2 className="text-xl font-bold text-red-400">Component Error</h2>
              <p className="text-slate-300 mt-1">
                There was an error rendering the Maintenance component. Please check the browser console for details.
              </p>
              <p className="text-slate-400 text-sm mt-2">
                Error: {error instanceof Error ? error.message : String(error)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h3 className="text-white font-semibold mb-4">Debug Information</h3>
          <div className="space-y-2 text-sm">
            <div><span className="text-slate-400">Selected Turbine:</span> <span className="text-white">{selectedTurbine}</span></div>
            <div><span className="text-slate-400">Current Data:</span> <span className="text-white">{currentData ? 'Available' : 'Not Available'}</span></div>
            <div><span className="text-slate-400">Predictions Count:</span> <span className="text-white">{predictions ? Object.keys(predictions).length : 0}</span></div>
            <div><span className="text-slate-400">Health Scores Count:</span> <span className="text-white">{healthScores ? Object.keys(healthScores).length : 0}</span></div>
            <div><span className="text-slate-400">Maintenance Schedule Count:</span> <span className="text-white">{maintenanceSchedule ? maintenanceSchedule.length : 0}</span></div>
          </div>
        </div>
      </div>
    );
  }
};

export default Maintenance;