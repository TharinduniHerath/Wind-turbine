import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { SensorData } from '../data/mockData';

interface SensorCardProps {
  sensor: SensorData;
}

const SensorCard: React.FC<SensorCardProps> = ({ sensor }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'normal':
        return <TrendingUp className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'critical':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">{sensor.name}</h3>
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(sensor.status)}`}>
          {getStatusIcon(sensor.status)}
          <span className="ml-1 capitalize">{sensor.status}</span>
        </span>
      </div>
      
      <div className="flex items-baseline">
        <span className="text-3xl font-bold text-gray-900">{sensor.value}</span>
        <span className="ml-2 text-sm font-medium text-gray-500">{sensor.unit}</span>
      </div>
      
      <div className="mt-3 text-xs text-gray-500">
        Last updated: {new Date(sensor.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
};

export default SensorCard;