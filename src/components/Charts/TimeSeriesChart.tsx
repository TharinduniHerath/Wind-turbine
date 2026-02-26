import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ChartDataPoint } from '../../types';

interface TimeSeriesChartProps {
  data: ChartDataPoint[];
  title: string;
  dataKey: string;
  unit: string;
  color?: string;
  showPredicted?: boolean;
  height?: number;
}

const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  data,
  title,
  dataKey,
  unit,
  color = '#0EA5E9',
  showPredicted = false,
  height = 300,
}) => {
  const formatXAxis = (tickItem: string) => {
    const date = new Date(tickItem);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
          <p className="text-slate-300 text-sm mb-2">
            {new Date(label).toLocaleString()}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value?.toFixed(2)} {unit}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <h3 className="text-white font-semibold mb-4">{title}</h3>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={formatXAxis}
              stroke="#9CA3AF"
              fontSize={12}
            />
            <YAxis 
              stroke="#9CA3AF"
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            {showPredicted && <Legend />}
            
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={false}
              name="Actual"
              activeDot={{ r: 4, stroke: color, strokeWidth: 2 }}
            />
            
            {showPredicted && (
              <Line
                type="monotone"
                dataKey="predicted"
                stroke="#F59E0B"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Predicted"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TimeSeriesChart;