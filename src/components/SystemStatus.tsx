import React from 'react';
import { Wifi, WifiOff, Power, Clock } from 'lucide-react';

interface SystemStatusProps {
  status: {
    turbineStatus: string;
    connectionStatus: string;
    lastUpdate: string;
    uptime: string;
    totalPowerGenerated: number;
    efficiency: number;
  };
}

const SystemStatus: React.FC<SystemStatusProps> = ({ status }) => {
  const isConnected = status.connectionStatus === 'connected';
  const isOperational = status.turbineStatus === 'operational';

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-full mx-auto px-6 py-4">
        <div className="flex flex-wrap items-center justify-between space-y-2 lg:space-y-0">
          {/* Connection Status */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <Wifi className="h-5 w-5 text-green-600" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-600" />
              )}
              <span className={`text-sm font-medium ${
                isConnected ? 'text-green-700' : 'text-red-700'
              }`}>
                {status.connectionStatus}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <Power className={`h-5 w-5 ${
                isOperational ? 'text-green-600' : 'text-red-600'
              }`} />
              <span className={`text-sm font-medium ${
                isOperational ? 'text-green-700' : 'text-red-700'
              }`}>
                {status.turbineStatus}
              </span>
            </div>
          </div>

          {/* System Stats */}
          <div className="flex items-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>Uptime: {status.uptime}</span>
            </div>
            
            <div>
              <span>Daily Generation: </span>
              <span className="font-medium text-blue-600">
                {status.totalPowerGenerated.toLocaleString()} kWh
              </span>
            </div>
            
            <div>
              <span>Efficiency: </span>
              <span className="font-medium text-green-600">
                {status.efficiency}%
              </span>
            </div>
            
            <div className="text-xs text-gray-500">
              Last update: {new Date(status.lastUpdate).toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default SystemStatus;