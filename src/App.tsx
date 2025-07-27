import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import SensorCard from './components/SensorCard';
import WindTurbine3D from './components/WindTurbine3D';
import PowerChart from './components/PowerChart';
import TemperatureChart from './components/TemperatureChart';
import MaintenanceSchedule from './components/MaintenanceSchedule';
import NotificationPanel from './components/NotificationPanel';
import SystemStatus from './components/SystemStatus';
import {
  sensorData,
  powerGenerationData,
  temperatureData,
  maintenanceTasks,
  notifications as initialNotifications,
  systemStatus,
} from './data/mockData';

function App() {
  const [activeSection, setActiveSection] = useState('power');
  const [notifications, setNotifications] = useState(initialNotifications);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleDismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const renderMainContent = () => {
    switch (activeSection) {
      case 'noise':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Noise Monitoring</h3>
              <p className="text-gray-600 mb-4">
                Acoustic analysis and sound level monitoring for environmental compliance.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900">Current Sound Level</h4>
                  <p className="text-2xl font-bold text-blue-600">42.3 dB</p>
                  <p className="text-sm text-blue-700">Within normal range</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900">Daily Average</h4>
                  <p className="text-2xl font-bold text-green-600">41.8 dB</p>
                  <p className="text-sm text-green-700">-1.2 dB from yesterday</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-medium text-yellow-900">Peak Level</h4>
                  <p className="text-2xl font-bold text-yellow-600">48.5 dB</p>
                  <p className="text-sm text-yellow-700">Recorded at 14:30</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'weather':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Weather Impact Analysis</h3>
              <p className="text-gray-600 mb-4">
                Environmental conditions and their impact on turbine performance.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900">Wind Direction</h4>
                  <p className="text-2xl font-bold text-blue-600">WSW</p>
                  <p className="text-sm text-blue-700">245°</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900">Humidity</h4>
                  <p className="text-2xl font-bold text-green-600">68%</p>
                  <p className="text-sm text-green-700">Optimal range</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium text-purple-900">Pressure</h4>
                  <p className="text-2xl font-bold text-purple-600">1013 hPa</p>
                  <p className="text-sm text-purple-700">Stable</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-medium text-orange-900">Visibility</h4>
                  <p className="text-2xl font-bold text-orange-600">15 km</p>
                  <p className="text-sm text-orange-700">Excellent</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'maintenance':
        return (
          <div className="space-y-6">
            <MaintenanceSchedule tasks={maintenanceTasks} />
          </div>
        );

      default: // 'power'
        return (
          <div className="space-y-6">
            {/* Sensor Data Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sensorData.map((sensor) => (
                <SensorCard key={sensor.id} sensor={sensor} />
              ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PowerChart data={powerGenerationData} />
              <TemperatureChart data={temperatureData} />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navigation */}
      <Navbar notifications={unreadCount} />
      
      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
        
        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Primary Content Area */}
              <div className="xl:col-span-2 space-y-6">
                {renderMainContent()}
              </div>
              
              {/* Right Sidebar */}
              <div className="space-y-6">
                {/* 3D Model */}
                <WindTurbine3D />
                
                {/* Notifications */}
                <NotificationPanel 
                  notifications={notifications}
                  onDismiss={handleDismissNotification}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
      
      {/* System Status Footer */}
      <SystemStatus status={systemStatus} />
    </div>
  );
}

export default App;