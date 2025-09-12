import React, { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Sky } from "@react-three/drei";
import TurbineModel from "../Turbine3DModelV2/WindTurbine";
import { Volume2, Wind, Zap, Gauge } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const OverviewWS: React.FC = () => {
  const [latest, setLatest] = useState<any>({
    noise_level: 0,
    power_out: 0,
    rotor_speed: 0,
    wind_speed: 0,
    pitch_angle: 0,
    wind_direction: 0,
  });
  const [history, setHistory] = useState<any[]>([]);
  const [wsConnected, setWsConnected] = useState(false);

  // WebSocket
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/noise/ws/stream");

    ws.onopen = () => {
      console.log("✅ WebSocket connected.");
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLatest(data);
        setHistory((prev) => [...prev, { ...data, timestamp: Date.now() }]);
      } catch (err) {
        console.error("Error parsing WS message:", err);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected.");
      setWsConnected(false);
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
      ws.close();
    };

    return () => ws.close();
  }, []);

  // KPI cards data
  const kpis = [
    { id: "noise", label: "Noise Level", value: latest.noise_level, unit: "dB" },
    { id: "power", label: "Power Output", value: latest.power_out, unit: "kW" },
    { id: "rotor", label: "Rotor Speed", value: latest.rotor_speed, unit: "RPM" },
    { id: "wind", label: "Wind Speed", value: latest.wind_speed, unit: "m/s" },
  ];

  return (
    <div className="p-6 bg-black text-white min-h-screen space-y-6">
      <h2 className="text-2xl font-bold">System Overview</h2>
      <p className="text-slate-400">
        {wsConnected ? "Real-time monitoring" : "Connecting to WebSocket..."}
      </p>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => {
          const percentage = Math.min(Math.max(kpi.value, 0), 100);

          let Icon;
          switch (kpi.id) {
            case "noise":
              Icon = Volume2;
              break;
            case "power":
              Icon = Zap;
              break;
            case "rotor":
              Icon = Gauge;
              break;
            case "wind":
              Icon = Wind;
              break;
            default:
              Icon = Volume2;
          }

          return (
            <div
              key={kpi.id}
              className="bg-gray-800 p-4 rounded shadow-lg text-center space-y-2"
            >
              <Icon className="mx-auto text-green-400" size={28} />
              <p className="text-gray-400">{kpi.label}</p>
              <h2 className="text-white font-bold">
                {kpi.value} {kpi.unit}
              </h2>

              {/* Horizontal Level Meter */}
              <div className="w-full bg-gray-700 h-2 rounded-full mt-2">
                <div
                  className="h-2 rounded-full bg-green-400 transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3D Model + Power Chart Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* 3D Turbine Model */}
        <div className="h-[450px] border rounded bg-gray-900 p-2">
          <Canvas camera={{ position: [30, 10, 38], fov: 50 }}>
            <color attach="background" args={["lightblue"]} />
            <Sky sunPosition={[100, 20, 10]} />
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 5, 5]} />
            <TurbineModel
              rpm={latest.rotor_speed || 0}
              pitch={latest.pitch_angle || 0}
              windDirection={latest.wind_direction || 0}
              position={[0, -2, 0]}
              scale={[0.3, 0.3, 0.3]}
            />
            <OrbitControls />
          </Canvas>
        </div>

        {/* Power Output Chart */}
        <div className="h-[450px] bg-gray-900 p-4 rounded shadow-lg">
          <h3 className="text-white mb-2 font-semibold">Power Output Over Time</h3>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={history}>
              <CartesianGrid stroke="#2a2a2a" strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                stroke="#8884d8"
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getHours()}:${date.getMinutes()}`;
                }}
              />
              <YAxis stroke="#8884d8" unit="kW" />
              <Tooltip
                contentStyle={{ backgroundColor: "#1f1f1f", border: "none", borderRadius: 8 }}
                labelStyle={{ color: "#fff" }}
                itemStyle={{ color: "#10B981" }}
                labelFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleTimeString();
                }}
              />
              <defs>
                <linearGradient id="powerGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#10B981" stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <Line
                type="monotone"
                dataKey="power_out"
                stroke="url(#powerGradient)"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default OverviewWS;
