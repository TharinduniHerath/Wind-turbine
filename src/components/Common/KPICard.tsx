import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, DivideIcon as LucideIcon } from 'lucide-react';
import * as Icons from 'lucide-react';
import { KPI } from '../../types';

interface KPICardProps {
  kpi: KPI;
  index?: number;
}

const KPICard: React.FC<KPICardProps> = ({ kpi, index = 0 }) => {
  const IconComponent = (Icons as any)[kpi.icon] as LucideIcon || Icons.Activity;
  
  const statusColors = {
    normal: 'text-green-400 bg-green-400/10 border-green-400/20',
    warning: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    critical: 'text-red-400 bg-red-400/10 border-red-400/20',
  };
  
  const trendIcons = {
    up: TrendingUp,
    down: TrendingDown,
    stable: Minus,
  };
  
  const TrendIcon = trendIcons[kpi.trend];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`bg-slate-800 rounded-xl p-6 border ${statusColors[kpi.status]} hover:shadow-lg transition-all duration-300`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${statusColors[kpi.status]}`}>
          <IconComponent className="w-6 h-6" />
        </div>
        <div className="flex items-center space-x-1 text-slate-400">
          <TrendIcon className="w-4 h-4" />
        </div>
      </div>
      
      <div className="space-y-1">
        <h3 className="text-slate-300 text-sm font-medium">{kpi.label}</h3>
        <div className="flex items-baseline space-x-1">
          <span className="text-2xl font-bold text-white">{kpi.value}</span>
          <span className="text-slate-400 text-sm">{kpi.unit}</span>
        </div>
      </div>
      
      {/* Status indicator */}
      <div className="mt-4 flex items-center justify-between">
        <span className={`text-xs px-2 py-1 rounded-full capitalize ${
          kpi.status === 'normal' ? 'bg-green-400/10 text-green-400' :
          kpi.status === 'warning' ? 'bg-amber-400/10 text-amber-400' :
          'bg-red-400/10 text-red-400'
        }`}>
          {kpi.status}
        </span>
        <div className="w-16 h-1 bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${
              kpi.status === 'normal' ? 'bg-green-400' :
              kpi.status === 'warning' ? 'bg-amber-400' :
              'bg-red-400'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (kpi.value / (kpi.value * 1.2)) * 100)}%` }}
            transition={{ delay: index * 0.1 + 0.5, duration: 1 }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default KPICard;