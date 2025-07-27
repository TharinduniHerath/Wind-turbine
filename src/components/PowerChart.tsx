import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { PowerData } from '../data/mockData';

interface PowerChartProps {
  data: PowerData[];
}

const PowerChart: React.FC<PowerChartProps> = ({ data }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Power Generation Trend</h3>
        <p className="text-sm text-gray-500">24-hour power output and efficiency monitoring</p>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <defs>
            <linearGradient id="powerGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="efficiencyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="time" 
            stroke="#6B7280"
            fontSize={12}
          />
          <YAxis 
            yAxisId="power"
            orientation="left"
            stroke="#6B7280"
            fontSize={12}
            label={{ value: 'Power (MW)', angle: -90, position: 'insideLeft' }}
          />
          <YAxis 
            yAxisId="efficiency"
            orientation="right"
            stroke="#6B7280"
            fontSize={12}
            label={{ value: 'Efficiency (%)', angle: 90, position: 'insideRight' }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Legend />
          
          <Area
            yAxisId="power"
            type="monotone"
            dataKey="power"
            stroke="#3B82F6"
            strokeWidth={2}
            fill="url(#powerGradient)"
            name="Power Output (MW)"
          />
          <Line
            yAxisId="efficiency"
            type="monotone"
            dataKey="efficiency"
            stroke="#10B981"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: '#10B981', r: 4 }}
            name="Efficiency (%)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PowerChart;