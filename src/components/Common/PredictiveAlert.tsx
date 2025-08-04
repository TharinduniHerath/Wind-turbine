import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface PredictiveAlertProps {
  component: string;
  status: 'Critical' | 'Warning' | 'Normal';
  message: string;
  confidence: string;
  based_on: string;
}

const PredictiveAlert: React.FC<PredictiveAlertProps> = ({
  component,
  status,
  message,
  confidence,
  based_on
}) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Critical':
        return {
          icon: AlertTriangle,
          color: 'text-red-400',
          bgColor: 'bg-red-400/10',
          borderColor: 'border-red-400/20',
          titleColor: 'text-red-400'
        };
      case 'Warning':
        return {
          icon: AlertTriangle,
          color: 'text-amber-400',
          bgColor: 'bg-amber-400/10',
          borderColor: 'border-amber-400/20',
          titleColor: 'text-amber-400'
        };
      case 'Normal':
        return {
          icon: CheckCircle,
          color: 'text-blue-400',
          bgColor: 'bg-blue-400/10',
          borderColor: 'border-blue-400/20',
          titleColor: 'text-blue-400'
        };
      default:
        return {
          icon: Info,
          color: 'text-slate-400',
          bgColor: 'bg-slate-400/10',
          borderColor: 'border-slate-400/20',
          titleColor: 'text-slate-400'
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`p-4 ${config.bgColor} border ${config.borderColor} rounded-lg`}
    >
      <div className="flex items-start space-x-3">
        <Icon className={`w-5 h-5 ${config.color} mt-0.5`} />
        <div className="flex-1">
          <h4 className={`${config.titleColor} font-medium text-sm`}>
            {component} Alert
          </h4>
          <p className="text-slate-300 text-sm mt-1">
            {message}
          </p>
          <div className="mt-2 text-xs text-slate-400">
            Confidence: {confidence} • Based on {based_on}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PredictiveAlert; 