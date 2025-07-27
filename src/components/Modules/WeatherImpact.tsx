import React from 'react';
import { motion } from 'framer-motion';
import { Cloud, Wind, Thermometer, Droplets, Gauge, Eye } from 'lucide-react';
import { useTurbineStore } from '../../store/turbineStore';
import TimeSeriesChart from '../Charts/TimeSeriesChart';

const WeatherImpact: React.FC = () => {
  const { currentData, weatherHistory } = useTurbineStore();

  const weather = currentData?.weather;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Weather Impact Analysis</h2>
          <p className="text-slate-400">
            Real-time weather monitoring and operational impact assessment
          </p>
        </div>
        <div className="p-4 rounded-xl bg-blue-400/10 border border-blue-400/20">
          <Cloud className="w-8 h-8 text-blue-400" />
        </div>
      </div>

      {/* Weather Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800 rounded-xl p-4 border border-slate-700"
        >
          <div className="flex items-center justify-between mb-3">
            <Wind className="w-5 h-5 text-blue-400" />
            <span className="text-xs text-green-400">OPTIMAL</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-slate-300 text-xs">Wind Speed</h3>
            <div className="flex items-baseline space-x-1">
              <span className="text-xl font-bold text-white">
                {currentData?.windSpeed.toFixed(1) || '0.0'}
              </span>
              <span className="text-slate-400 text-xs">m/s</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800 rounded-xl p-4 border border-slate-700"
        >
          <div className="flex items-center justify-between mb-3">
            <Thermometer className="w-5 h-5 text-red-400" />
            <span className="text-xs text-green-400">NORMAL</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-slate-300 text-xs">Temperature</h3>
            <div className="flex items-baseline space-x-1">
              <span className="text-xl font-bold text-white">
                {weather?.temperature.toFixed(1) || '0.0'}
              </span>
              <span className="text-slate-400 text-xs">°C</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800 rounded-xl p-4 border border-slate-700"
        >
          <div className="flex items-center justify-between mb-3">
            <Droplets className="w-5 h-5 text-cyan-400" />
            <span className="text-xs text-green-400">NORMAL</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-slate-300 text-xs">Humidity</h3>
            <div className="flex items-baseline space-x-1">
              <span className="text-xl font-bold text-white">
                {weather?.humidity.toFixed(0) || '0'}
              </span>
              <span className="text-slate-400 text-xs">%</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-800 rounded-xl p-4 border border-slate-700"
        >
          <div className="flex items-center justify-between mb-3">
            <Gauge className="w-5 h-5 text-purple-400" />
            <span className="text-xs text-green-400">STABLE</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-slate-300 text-xs">Pressure</h3>
            <div className="flex items-baseline space-x-1">
              <span className="text-xl font-bold text-white">
                {weather?.pressure.toFixed(0) || '0'}
              </span>
              <span className="text-slate-400 text-xs">hPa</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-slate-800 rounded-xl p-4 border border-slate-700"
        >
          <div className="flex items-center justify-between mb-3">
            <Wind className="w-5 h-5 text-amber-400" />
            <span className="text-xs text-blue-400">SW</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-slate-300 text-xs">Direction</h3>
            <div className="flex items-baseline space-x-1">
              <span className="text-xl font-bold text-white">
                {weather?.windDirection.toFixed(0) || '0'}
              </span>
              <span className="text-slate-400 text-xs">°</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-slate-800 rounded-xl p-4 border border-slate-700"
        >
          <div className="flex items-center justify-between mb-3">
            <Eye className="w-5 h-5 text-green-400" />
            <span className="text-xs text-green-400">CLEAR</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-slate-300 text-xs">Visibility</h3>
            <div className="flex items-baseline space-x-1">
              <span className="text-xl font-bold text-white">15</span>
              <span className="text-slate-400 text-xs">km</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts and Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TimeSeriesChart
          data={weatherHistory}
          title="Wind Speed Trend"
          dataKey="value"
          unit="m/s"
          color="#3B82F6"
          height={300}
        />

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-semibold mb-4">Weather Impact Assessment</h3>
          <div className="space-y-4">
            <div className="p-4 bg-green-400/10 border border-green-400/20 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-400 rounded-full" />
                <div>
                  <h4 className="text-green-400 font-medium text-sm">Optimal Conditions</h4>
                  <p className="text-slate-300 text-sm">
                    Wind speed within optimal range for maximum power generation
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-300 text-sm">Power Generation Impact</span>
                <span className="text-green-400 font-semibold">+5.2%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div className="bg-green-400 h-2 rounded-full" style={{ width: '85%' }} />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-300 text-sm">Turbulence Level</span>
                <span className="text-green-400 font-semibold">Low</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div className="bg-green-400 h-2 rounded-full" style={{ width: '25%' }} />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-300 text-sm">Maintenance Risk</span>
                <span className="text-green-400 font-semibold">Minimal</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div className="bg-green-400 h-2 rounded-full" style={{ width: '15%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Weather Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-semibold mb-4">24-Hour Forecast</h3>
          <div className="space-y-4">
            {[
              { time: 'Now', wind: 12.5, temp: 18, icon: Wind, condition: 'Clear' },
              { time: '3h', wind: 14.2, temp: 16, icon: Wind, condition: 'Clear' },
              { time: '6h', wind: 16.8, temp: 15, icon: Cloud, condition: 'Partly Cloudy' },
              { time: '12h', wind: 11.3, temp: 20, icon: Cloud, condition: 'Cloudy' },
              { time: '18h', wind: 9.7, temp: 22, icon: Droplets, condition: 'Light Rain' },
              { time: '24h', wind: 8.1, temp: 19, icon: Cloud, condition: 'Overcast' },
            ].map((forecast, index) => {
              const Icon = forecast.icon;
              return (
                <motion.div
                  key={forecast.time}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-slate-900 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-slate-400 text-sm w-8">{forecast.time}</span>
                    <Icon className="w-4 h-4 text-blue-400" />
                    <span className="text-slate-300 text-sm">{forecast.condition}</span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-white">{forecast.wind.toFixed(1)} m/s</span>
                    <span className="text-slate-400">{forecast.temp}°C</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-semibold mb-4">Wind Rose</h3>
          <div className="relative w-64 h-64 mx-auto">
            {/* Wind Rose visualization */}
            <div className="absolute inset-0 rounded-full border border-slate-600">
              {/* Direction markers */}
              {['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'].map((dir, index) => {
                const angle = index * 45;
                const length = 20 + Math.random() * 80;
                return (
                  <div key={dir} className="absolute inset-0">
                    <div
                      className="absolute top-1/2 left-1/2 origin-bottom"
                      style={{
                        transform: `translate(-50%, -100%) rotate(${angle}deg)`,
                        height: `${length}px`,
                        width: '6px',
                        background: 'linear-gradient(to top, #0EA5E9, transparent)',
                        borderRadius: '3px',
                      }}
                    />
                    <div
                      className="absolute text-xs text-slate-300 font-medium"
                      style={{
                        top: `${50 - Math.cos((angle * Math.PI) / 180) * 45}%`,
                        left: `${50 + Math.sin((angle * Math.PI) / 180) * 45}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      {dir}
                    </div>
                  </div>
                );
              })}
              
              {/* Center dot */}
              <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-sky-400 rounded-full transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            
            {/* Legend */}
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
              <div className="flex items-center space-x-4 text-xs text-slate-400">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-2 bg-blue-400 rounded" />
                  <span>Wind Frequency</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherImpact;