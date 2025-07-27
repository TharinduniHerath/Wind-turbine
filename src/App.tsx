import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTurbineStore } from './store/turbineStore';
import { generateMockTurbineData } from './data/mockData';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import Overview from './components/Modules/Overview';
import NoiseMonitoring from './components/Modules/NoiseMonitoring';
import PowerOptimization from './components/Modules/PowerOptimization';
import WeatherImpact from './components/Modules/WeatherImpact';
import Maintenance from './components/Modules/Maintenance';

function App() {
  const { 
    activeModule, 
    initializeData, 
    updateTurbineData, 
    addAlert 
  } = useTurbineStore();

  // Initialize data and start mock data updates
  useEffect(() => {
    initializeData();

    // Simulate real-time data updates
    const dataInterval = setInterval(() => {
      const newData = generateMockTurbineData();
      updateTurbineData(newData);

      // Randomly generate alerts
      if (Math.random() < 0.1) { // 10% chance per update
        const alertTypes = ['warning', 'error', 'info'] as const;
        const modules = ['noise', 'power', 'weather', 'maintenance'] as const;
        const alertMessages = [
          'System performance within normal parameters',
          'Blade vibration slightly elevated',
          'Power output optimized for current conditions',
          'Weather conditions favorable for operation',
          'Scheduled maintenance reminder',
        ];

        const alert = {
          id: `alert-${Date.now()}`,
          type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
          message: alertMessages[Math.floor(Math.random() * alertMessages.length)],
          module: modules[Math.floor(Math.random() * modules.length)],
          timestamp: new Date().toISOString(),
        };

        addAlert(alert);
      }
    }, 5000); // Update every 5 seconds

    return () => clearInterval(dataInterval);
  }, [initializeData, updateTurbineData, addAlert]);

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'overview':
        return <Overview />;
      case 'noise':
        return <NoiseMonitoring />;
      case 'power':
        return <PowerOptimization />;
      case 'weather':
        return <WeatherImpact />;
      case 'maintenance':
        return <Maintenance />;
      default:
        return <Overview />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {renderActiveModule()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default App;