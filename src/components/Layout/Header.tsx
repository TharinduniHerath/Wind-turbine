import React from 'react';
import { Bell, Settings, Power, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTurbineStore } from '../../store/turbineStore';

const Header: React.FC = () => {
  const { alerts, currentData } = useTurbineStore();
  const activeAlerts = alerts.filter(alert => alert.type === 'error').length;
  const isOnline = currentData !== null;

  return (
    <header className="bg-slate-900 border-b border-slate-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 text-sky-400"
          >
            <Power className="w-8 h-8" />
          </motion.div>
          <div>
            <h1 className="text-2xl font-bold text-white">WindTurbine DT</h1>
            <p className="text-sm text-slate-400">Digital Twin Monitoring System</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-sm text-slate-300">
              {isOnline ? 'Connected' : 'Offline'}
            </span>
          </div>
          
          {/* Alerts */}
          <div className="relative">
            <button className="p-2 text-slate-400 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              {activeAlerts > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {activeAlerts}
                </span>
              )}
            </button>
          </div>
          
          {/* Settings */}
          <button className="p-2 text-slate-400 hover:text-white transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* System Status Bar */}
      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="flex items-center space-x-6">
          <div className="text-slate-400">
            Status: <span className="text-green-400">Operational</span>
          </div>
          <div className="text-slate-400">
            Last Update: <span className="text-white">{currentData ? new Date(currentData.timestamp).toLocaleTimeString() : 'N/A'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;