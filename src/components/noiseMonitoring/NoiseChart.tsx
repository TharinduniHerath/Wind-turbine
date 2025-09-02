// NoiseChart.tsx
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

interface NoiseChartProps {
  data: { timestamp: number; noise_level: number }[];
}

const NoiseChart: React.FC<NoiseChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="timestamp"
          type="number"
          domain={["dataMin", "dataMax"]}
          scale="time"
          tickFormatter={(tick) =>
            new Date(tick).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })
          }
        />
        <YAxis />
        <Tooltip
          labelFormatter={(label) =>
            new Date(label).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })
          }
        />
        <Line type="monotone" dataKey="noise_level" stroke="#8884d8" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default NoiseChart;
