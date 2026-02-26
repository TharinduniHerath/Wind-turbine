import React from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle, CheckCircle, Settings, Calendar, Wrench } from 'lucide-react';

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

interface MaintenanceScheduleCardProps {
  item: MaintenanceItem;
  index: number;
}

const MaintenanceScheduleCard: React.FC<MaintenanceScheduleCardProps> = ({ item, index }) => {
  const {
    component,
    message,
    last_service,
    next_service,
    duration,
    priority,
    status,
    rul_days
  } = item;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Due': return AlertTriangle;
      case 'Scheduled': return Clock;
      case 'Completed': return CheckCircle;
      case 'Monitoring': return Settings;
      default: return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Due': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'Scheduled': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'Completed': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'Monitoring': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'text-red-400';
      case 'Medium': return 'text-amber-400';
      case 'Low': return 'text-green-400';
      default: return 'text-slate-400';
    }
  };

  const getPriorityBgColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-400/10 text-red-400';
      case 'Medium': return 'bg-amber-400/10 text-amber-400';
      case 'Low': return 'bg-green-400/10 text-green-400';
      default: return 'bg-slate-400/10 text-slate-400';
    }
  };

  const StatusIcon = getStatusIcon(status);

  // Calculate days until next service
  const nextServiceDate = new Date(next_service);
  const currentDate = new Date();
  const daysUntilService = Math.ceil((nextServiceDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex items-start space-x-4 p-4 bg-slate-900 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700"
    >
      <div className={`p-2 rounded-lg ${getStatusColor(status)}`}>
        <StatusIcon className="w-5 h-5" />
      </div>
      
      <div className="flex-1 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="text-white font-medium text-sm">{component}</h4>
            <p className="text-slate-400 text-sm mt-1">{message}</p>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            <span className={`text-xs px-2 py-1 rounded-full capitalize ${getPriorityBgColor(priority)}`}>
              {priority}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full capitalize ${getStatusColor(status)}`}>
              {status}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="space-y-1">
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3 text-slate-500" />
              <span className="text-slate-500 text-xs">Last Service:</span>
            </div>
            <div className="text-slate-300 text-xs">{new Date(last_service).toLocaleDateString()}</div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3 text-slate-500" />
              <span className="text-slate-500 text-xs">Next Service:</span>
            </div>
            <div className="text-slate-300 text-xs">{new Date(next_service).toLocaleDateString()}</div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center space-x-1">
              <Wrench className="w-3 h-3 text-slate-500" />
              <span className="text-slate-500 text-xs">Duration:</span>
            </div>
            <div className="text-slate-300 text-xs">{duration}</div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center space-x-1">
              <AlertTriangle className="w-3 h-3 text-slate-500" />
              <span className="text-slate-500 text-xs">Days Left:</span>
            </div>
            <div className={`text-xs font-medium ${
              daysUntilService <= 7 ? 'text-red-400' :
              daysUntilService <= 30 ? 'text-amber-400' :
              'text-green-400'
            }`}>
              {daysUntilService} days
            </div>
          </div>
        </div>
        
        {rul_days && (
          <div className="pt-2 border-t border-slate-700">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Predicted RUL:</span>
              <span className="text-blue-400 font-medium">{rul_days} days</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MaintenanceScheduleCard; 