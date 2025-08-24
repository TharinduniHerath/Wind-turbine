// src/components/noiseMonitoring/NoiseChart.tsx
import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

interface Props {
  data: { timestamp: number; noise_level: number }[];
}

const NoiseChart: React.FC<Props> = ({ data }) => {
  const formattedData = data.map((d) => ({
    ...d,
    time: new Date(d.timestamp * 1000).toLocaleTimeString(),
  }));

  return (
    <div className="p-4 bg-white rounded-2xl shadow-md w-full">
      <h2 className="text-xl font-semibold mb-2">Noise Level Over Time</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis label={{ value: "dB", angle: -90, position: "insideLeft" }} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="noise_level"
            stroke="#FF4136"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default NoiseChart;
