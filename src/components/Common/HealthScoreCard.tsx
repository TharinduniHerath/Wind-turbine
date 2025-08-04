import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface HealthScoreData {
  score: number;
  trend: 'stable' | 'improving' | 'declining';
}

interface HealthScoreCardProps {
  component: string;
  data: HealthScoreData;
  index: number;
}

const HealthScoreCard: React.FC<HealthScoreCardProps> = ({ component, data, index }) => {
  const { score, trend } = data;

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return TrendingUp;
      case 'declining':
        return TrendingDown;
      default:
        return Minus;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'text-green-400';
      case 'declining':
        return 'text-red-400';
      default:
        return 'text-blue-400';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 80) return 'text-amber-400';
    return 'text-red-400';
  };

  const getProgressColor = (score: number) => {
    if (score >= 90) return 'bg-green-400';
    if (score >= 80) return 'bg-amber-400';
    return 'bg-red-400';
  };

  const TrendIcon = getTrendIcon(trend);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:bg-slate-700 transition-colors"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-sm">{component}</h3>
        <div className="flex items-center space-x-2">
          <TrendIcon className={`w-4 h-4 ${getTrendColor(trend)}`} />
          <span className={`text-xs px-2 py-1 rounded-full capitalize ${
            trend === 'improving' ? 'bg-green-400/10 text-green-400' :
            trend === 'declining' ? 'bg-red-400/10 text-red-400' :
            'bg-blue-400/10 text-blue-400'
          }`}>
            {trend}
          </span>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-baseline space-x-2">
          <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
            {score}%
          </span>
          <span className="text-slate-400 text-sm">health</span>
        </div>
        
        <div className="w-full bg-slate-700 rounded-full h-2">
          <motion.div
            className={`h-2 rounded-full ${getProgressColor(score)}`}
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ delay: index * 0.1 + 0.2, duration: 1 }}
          />
        </div>
        
        <div className="text-xs text-slate-500">
          {score >= 90 ? 'Excellent condition' :
           score >= 80 ? 'Good condition' :
           score >= 70 ? 'Fair condition' : 'Poor condition'}
        </div>
      </div>
    </motion.div>
  );
};

export default HealthScoreCard; 