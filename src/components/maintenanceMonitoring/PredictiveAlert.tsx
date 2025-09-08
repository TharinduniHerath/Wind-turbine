import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface ComponentPrediction {
  status: 'Critical' | 'Warning' | 'Normal';
  message: string;
  confidence: string;
  based_on: string;
}

interface PredictiveAlertProps {
  component: string;
  prediction: ComponentPrediction;
  index: number;
}

const PredictiveAlert: React.FC<PredictiveAlertProps> = ({ component, prediction, index }) => {
  const getAlertIcon = (status: string) => {
    switch (status) {
      case 'Critical': return AlertTriangle;
      case 'Warning': return AlertTriangle;
      case 'Normal': return CheckCircle;
      default: return Info;
    }
  };

  const getAlertStyles = (status: string) => {
    switch (status) {
      case 'Critical': return 'bg-red-400/10 border-red-400/20 text-red-400';
      case 'Warning': return 'bg-amber-400/10 border-amber-400/20 text-amber-400';
      case 'Normal': return 'bg-green-400/10 border-green-400/20 text-green-400';
      default: return 'bg-blue-400/10 border-blue-400/20 text-blue-400';
    }
  };

  const Icon = getAlertIcon(prediction.status);
  const styles = getAlertStyles(prediction.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`p-4 border rounded-lg ${styles}`}
    >
      <div className="flex items-start space-x-3">
        <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="font-medium text-sm">{component}</h4>
          <p className="text-slate-300 text-sm mt-1">{prediction.message}</p>
          <div className="mt-2 text-xs text-slate-400">
            Confidence: {prediction.confidence} • Based on {prediction.based_on}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PredictiveAlert; 