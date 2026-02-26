import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Info, X, Clock } from 'lucide-react';
import { useTurbineStore } from '../../store/turbineStore';
import { Alert } from '../../types';

const AlertPanel: React.FC = () => {
  const { alerts, removeAlert } = useTurbineStore();

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'error': return AlertTriangle;
      case 'warning': return AlertTriangle;
      case 'info': return Info;
    }
  };

  const getAlertStyles = (type: Alert['type']) => {
    switch (type) {
      case 'error': return 'border-red-500 bg-red-500/10 text-red-400';
      case 'warning': return 'border-amber-500 bg-amber-500/10 text-amber-400';
      case 'info': return 'border-blue-500 bg-blue-500/10 text-blue-400';
    }
  };

  if (alerts.length === 0) {
    return (
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-white font-semibold mb-4">System Alerts</h3>
        <div className="text-center py-8">
          <Info className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <p className="text-slate-400">All systems operating normally</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">System Alerts</h3>
        <span className="text-slate-400 text-sm">{alerts.length} active</span>
      </div>
      
      <div className="space-y-3 max-h-64 overflow-y-auto">
        <AnimatePresence>
          {alerts.map((alert) => {
            const Icon = getAlertIcon(alert.type);
            const styles = getAlertStyles(alert.type);
            
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`border rounded-lg p-4 ${styles}`}
              >
                <div className="flex items-start space-x-3">
                  <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{alert.message}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs opacity-75">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <span className="px-2 py-1 bg-black/20 rounded capitalize">
                        {alert.module}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeAlert(alert.id)}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AlertPanel;