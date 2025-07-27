import React from 'react';
import { motion } from 'framer-motion';
import { Zap, TrendingUp, Battery, Settings } from 'lucide-react';
import { useTurbineStore } from '../../store/turbineStore';
import TimeSeriesChart from '../Charts/TimeSeriesChart';

const PowerOptimization: React.FC = () => {
  const { currentData, powerHistory } = useTurbineStore();

  const powerOutput = currentData?.powerOutput || 0;
  const efficiency = currentData ? (powerOutput / 3.0) * 100 : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Power Optimization</h2>
          <p className="text-slate-400">
            Real-time power generation optimization and performance analytics
          </p>
        </div>
        <div className="p-4 rounded-xl bg-green-400/10 border border-green-400/20">
          <Zap className="w-8 h-8 text-green-400" />
        </div>
      </div>

      {/* Power Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800 rounded-xl p-6 border border-slate-700"
        >
          <div className="flex items-center justify-between mb-4">
            <Zap className="w-6 h-6 text-green-400" />
            <TrendingUp className="w-4 h-4 text-green-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-slate-300 text-sm">Current Output</h3>
            <div className="flex items-baseline space-x-1">
              <span className="text-3xl font-bold text-white">{powerOutput.toFixed(2)}</span>
              <span className="text-slate-400">MW</span>
            </div>
            <div className="text-xs text-slate-500">
              Capacity: 3.0 MW
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800 rounded-xl p-6 border border-slate-700"
        >
          <div className="flex items-center justify-between mb-4">
            <Battery className="w-6 h-6 text-blue-400" />
            <span className="text-blue-400 text-xs">OPTIMAL</span>
          </div>
          <div className="space-y-2">
            <h3 className="text-slate-300 text-sm">Efficiency</h3>
            <div className="flex items-baseline space-x-1">
              <span className="text-3xl font-bold text-white">{efficiency.toFixed(1)}</span>
              <span className="text-slate-400">%</span>
            </div>
            <div className="text-xs text-slate-500">
             Target: &gt;80%
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800 rounded-xl p-6 border border-slate-700"
        >
          <div className="flex items-center justify-between mb-4">
            <Settings className="w-6 h-6 text-amber-400" />
            <span className="text-green-400 text-xs">ACTIVE</span>
          </div>
          <div className="space-y-2">
            <h3 className="text-slate-300 text-sm">Pitch Angle</h3>
            <div className="flex items-baseline space-x-1">
              <span className="text-3xl font-bold text-white">
                {currentData?.blades.pitch.toFixed(1) || '0.0'}
              </span>
              <span className="text-slate-400">°</span>
            </div>
            <div className="text-xs text-slate-500">
              Auto-adjusted
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-800 rounded-xl p-6 border border-slate-700"
        >
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-6 h-6 text-purple-400" />
            <span className="text-green-400 text-xs">+2.3%</span>
          </div>
          <div className="space-y-2">
            <h3 className="text-slate-300 text-sm">Daily Generation</h3>
            <div className="flex items-baseline space-x-1">
              <span className="text-3xl font-bold text-white">47.2</span>
              <span className="text-slate-400">MWh</span>
            </div>
            <div className="text-xs text-slate-500">
              vs. yesterday
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TimeSeriesChart
          data={powerHistory.map(point => ({
            ...point,
            predicted: point.value * (0.95 + Math.random() * 0.1)
          }))}
          title="Power Output vs Prediction"
          dataKey="value"
          unit="MW"
          color="#10B981"
          showPredicted
          height={300}
        />

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-semibold mb-4">Optimization Status</h3>
          <div className="space-y-4">
            {[
              { label: 'Blade Pitch Control', status: 'Active', efficiency: 98, color: 'bg-green-400' },
              { label: 'Yaw Alignment', status: 'Active', efficiency: 95, color: 'bg-green-400' },
              { label: 'Power Curve Tracking', status: 'Active', efficiency: 92, color: 'bg-green-400' },
              { label: 'Load Balancing', status: 'Standby', efficiency: 0, color: 'bg-slate-400' },
            ].map((item, index) => (
              <div key={item.label} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 text-sm">{item.label}</span>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      item.status === 'Active' ? 'bg-green-400/10 text-green-400' : 'bg-slate-400/10 text-slate-400'
                    }`}>
                      {item.status}
                    </span>
                    {item.efficiency > 0 && (
                      <span className="text-white text-sm">{item.efficiency}%</span>
                    )}
                  </div>
                </div>
                {item.efficiency > 0 && (
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <motion.div
                      className={`h-2 rounded-full ${item.color}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${item.efficiency}%` }}
                      transition={{ delay: index * 0.1, duration: 1 }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Power Curve */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-white font-semibold mb-4">Power Curve Analysis</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="text-slate-300 text-sm mb-3">Wind Speed vs Power Output</h4>
            <div className="h-48 bg-slate-900 rounded-lg p-4 flex items-end justify-center">
              {Array.from({ length: 15 }, (_, i) => {
                const windSpeed = i + 3;
                const theoreticalPower = windSpeed < 3 ? 0 : windSpeed > 25 ? 0 : 
                  Math.min(3, Math.pow(windSpeed / 12, 3) * 3);
                const actualPower = theoreticalPower * (0.85 + Math.random() * 0.15);
                
                return (
                  <div key={i} className="flex flex-col items-center mx-1">
                    <div className="flex flex-col items-center justify-end h-32">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${(theoreticalPower / 3) * 100}%` }}
                        transition={{ delay: i * 0.05 }}
                        className="w-3 bg-blue-400/50 rounded-t mb-1"
                      />
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${(actualPower / 3) * 100}%` }}
                        transition={{ delay: i * 0.05 + 0.1 }}
                        className="w-3 bg-green-400 rounded-t"
                      />
                    </div>
                    <span className="text-xs text-slate-400 mt-1">{windSpeed}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-center space-x-4 mt-2 text-xs">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-2 bg-blue-400/50 rounded" />
                <span className="text-slate-400">Theoretical</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-2 bg-green-400 rounded" />
                <span className="text-slate-400">Actual</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="text-slate-300 text-sm mb-3">Performance Summary</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Cut-in Speed</span>
                  <span className="text-white">3.0 m/s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Rated Speed</span>
                  <span className="text-white">12.0 m/s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Cut-out Speed</span>
                  <span className="text-white">25.0 m/s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Capacity Factor</span>
                  <span className="text-green-400">42.3%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Availability</span>
                  <span className="text-green-400">98.7%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PowerOptimization;