import React from 'react';
import { motion } from 'framer-motion';
import { useTurbineStore } from '../../store/turbineStore';
import KPICard from '../Common/KPICard';
import AlertPanel from '../Common/AlertPanel';
import TimeSeriesChart from '../Charts/TimeSeriesChart';
import TurbineSimulation from '../Simulation/TurbineSimulation';

const Overview: React.FC = () => {
  const { kpis, powerHistory } = useTurbineStore();

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">System Overview</h2>
        <p className="text-slate-400">
          Real-time monitoring and control of wind turbine operations
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => (
          <KPICard key={kpi.id} kpi={kpi} index={index} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 3D Simulation */}
        <div className="lg:col-span-1">
          <TurbineSimulation />
        </div>

        {/* Alerts Panel */}
        <div className="lg:col-span-1">
          <AlertPanel />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TimeSeriesChart
          data={powerHistory}
          title="Power Output Trend"
          dataKey="value"
          unit="MW"
          color="#10B981"
          height={250}
        />
        
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-semibold mb-4">System Health</h3>
          <div className="space-y-4">
            {[
              { label: 'Blade Condition', value: 95, color: 'bg-green-400' },
              { label: 'Gearbox Health', value: 88, color: 'bg-green-400' },
              { label: 'Generator Status', value: 92, color: 'bg-green-400' },
              { label: 'Control System', value: 98, color: 'bg-green-400' },
            ].map((item, index) => (
              <div key={item.label} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">{item.label}</span>
                  <span className="text-white">{item.value}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <motion.div
                    className={`h-2 rounded-full ${item.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${item.value}%` }}
                    transition={{ delay: index * 0.1, duration: 1 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;