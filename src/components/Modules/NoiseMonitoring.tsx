import React from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX, AlertTriangle, TrendingDown } from 'lucide-react';
import { useTurbineStore } from '../../store/turbineStore';
import TimeSeriesChart from '../Charts/TimeSeriesChart';

const NoiseMonitoring: React.FC = () => {
  const { currentData, noiseHistory } = useTurbineStore();

  const noiseLevel = currentData?.noise.level || 0;
  const noiseStatus = noiseLevel < 45 ? 'normal' : noiseLevel < 50 ? 'warning' : 'critical';
  
  const statusColors = {
    normal: 'text-green-400 bg-green-400/10 border-green-400/20',
    warning: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    critical: 'text-red-400 bg-red-400/10 border-red-400/20',
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Noise Monitoring</h2>
          <p className="text-slate-400">
            Real-time acoustic emission monitoring and environmental compliance
          </p>
        </div>
        <div className={`p-4 rounded-xl ${statusColors[noiseStatus]}`}>
          <Volume2 className="w-8 h-8" />
        </div>
      </div>

      {/* Current Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800 rounded-xl p-6 border border-slate-700"
        >
          <div className="flex items-center justify-between mb-4">
            <Volume2 className="w-6 h-6 text-sky-400" />
            <span className={`px-2 py-1 rounded-full text-xs ${
              noiseStatus === 'normal' ? 'bg-green-400/10 text-green-400' :
              noiseStatus === 'warning' ? 'bg-amber-400/10 text-amber-400' :
              'bg-red-400/10 text-red-400'
            }`}>
              {noiseStatus.toUpperCase()}
            </span>
          </div>
          <div className="space-y-2">
            <h3 className="text-slate-300 text-sm">Current Level</h3>
            <div className="flex items-baseline space-x-1">
              <span className="text-3xl font-bold text-white">{noiseLevel.toFixed(1)}</span>
              <span className="text-slate-400">dB</span>
            </div>
            <div className="text-xs text-slate-500">
              Limit: 50 dB
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
            <TrendingDown className="w-6 h-6 text-green-400" />
            <span className="text-green-400 text-xs">WITHIN LIMITS</span>
          </div>
          <div className="space-y-2">
            <h3 className="text-slate-300 text-sm">Frequency</h3>
            <div className="flex items-baseline space-x-1">
              <span className="text-3xl font-bold text-white">
                {currentData?.noise.frequency.toFixed(0) || '0'}
              </span>
              <span className="text-slate-400">Hz</span>
            </div>
            <div className="text-xs text-slate-500">
              Dominant frequency
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
            <VolumeX className="w-6 h-6 text-slate-400" />
            <span className="text-slate-400 text-xs">COMPLIANT</span>
          </div>
          <div className="space-y-2">
            <h3 className="text-slate-300 text-sm">Night Level</h3>
            <div className="flex items-baseline space-x-1">
              <span className="text-3xl font-bold text-white">38.2</span>
              <span className="text-slate-400">dB</span>
            </div>
            <div className="text-xs text-slate-500">
              Night limit: 40 dB
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts and Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TimeSeriesChart
          data={noiseHistory}
          title="Noise Level Trend"
          dataKey="value"
          unit="dB"
          color="#F59E0B"
          height={300}
        />

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-semibold mb-4">Compliance Analysis</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Day Time Compliance</span>
                <span className="text-green-400 font-semibold">98.2%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div className="bg-green-400 h-2 rounded-full" style={{ width: '98.2%' }} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Night Time Compliance</span>
                <span className="text-green-400 font-semibold">99.8%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div className="bg-green-400 h-2 rounded-full" style={{ width: '99.8%' }} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Weekly Average</span>
                <span className="text-green-400 font-semibold">42.1 dB</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div className="bg-green-400 h-2 rounded-full" style={{ width: '84%' }} />
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-slate-900 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
              <div>
                <h4 className="text-amber-400 font-medium text-sm">Advisory</h4>
                <p className="text-slate-300 text-sm mt-1">
                  Noise levels are within acceptable limits. Monitor during high wind conditions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Frequency Analysis */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-white font-semibold mb-4">Frequency Spectrum</h3>
        <div className="grid grid-cols-8 gap-2 h-32">
          {Array.from({ length: 8 }, (_, i) => {
            const height = 20 + Math.random() * 60;
            const frequency = (i + 1) * 25;
            return (
              <div key={i} className="flex flex-col items-center justify-end">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: i * 0.1 }}
                  className="w-full bg-sky-400 rounded-t"
                />
                <span className="text-xs text-slate-400 mt-2">{frequency}Hz</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default NoiseMonitoring;