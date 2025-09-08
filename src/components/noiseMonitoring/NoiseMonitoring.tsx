import React, { useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { useNoiseStore } from "../../store/noiseStore";
import TurbineModel from "../Turbine3DModelV2/WindTurbine";
import { OrbitControls,Sky } from "@react-three/drei";
import { Volume2, Wind, Compass, Zap, Gauge, Move } from "lucide-react";

import { useTurbineStore } from '../../store/turbineStore';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const NoiseMonitoring: React.FC = () => {
  const addData = useNoiseStore((state) => state.addData);
  const latest = useNoiseStore((state) => state.latest);
  const history = useNoiseStore((state) => state.history);
  const setActiveModule = useTurbineStore(state => state.setActiveModule);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/noise/ws/stream");

    ws.onopen = () => console.log("✅ WebSocket connected.");
    ws.onmessage = (event) => addData(JSON.parse(event.data));
    ws.onclose = () => console.log("WebSocket disconnected.");

    return () => ws.close();
  }, [addData]);

  return (
    <div className="p-6 bg-black text-white min-h-screen">
      {/* Header & Buttons */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Real-Time Noise Monitoring</h1>
        <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
          <button
            onClick={() => setActiveModule('noisePrediction')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded shadow"
          >
            Predict Noise
          </button>

          <button
            onClick={() => setActiveModule('futureNoisePrediction')}
            className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded shadow"
          >
            Predict 5-Day Noise
          </button>
        </div>
      </div>

      {/* Latest Values Cards */}
      {latest && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-gray-800 p-4 rounded text-center">
            <p className="text-gray-400">Noise Level</p>
            <h2 className="text-white font-bold">{latest.noise_level} dB</h2>
          </div>
          <div className="bg-gray-800 p-4 rounded text-center">
            <p className="text-gray-400">Wind Speed</p>
            <h2 className="text-white font-bold">{latest.wind_speed} m/s</h2>
          </div>
          <div className="bg-gray-800 p-4 rounded text-center">
            <p className="text-gray-400">Wind Direction</p>
            <h2 className="text-white font-bold">{latest.wind_direction}°</h2>
          </div>
          <div className="bg-gray-800 p-4 rounded text-center">
            <p className="text-gray-400">Power Output</p>
            <h2 className="text-white font-bold">{latest.power_out} kW</h2>
          </div>
          <div className="bg-gray-800 p-4 rounded text-center">
            <p className="text-gray-400">Rotor Speed</p>
            <h2 className="text-white font-bold">{latest.rotor_speed} RPM</h2>
          </div>
          <div className="bg-gray-800 p-4 rounded text-center">
            <p className="text-gray-400">Pitch Angle</p>
            <h2 className="text-white font-bold">{latest.pitch_angle}°</h2>
          </div>
        </div>
      )}

      {/* Multi-Series Line Chart */}

      <div className="bg-gray-900 p-4 rounded mb-6 h-[300px]">
  <h3 className="text-white mb-2">Noise Level vs Time</h3>
  <ResponsiveContainer width="100%" height="90%">
    <LineChart data={history}>
      <CartesianGrid stroke="#444" strokeDasharray="5 5" />
      <XAxis
        dataKey="timestamp"
        stroke="#ccc"
        tickFormatter={(value) => {
          const date = new Date(value * 1000);
          return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        }}
      />
      <YAxis stroke="#ccc" unit="dB" />
      <Tooltip
        labelFormatter={(value) => {
          const date = new Date(value);
          return date.toLocaleString(); // full date + time in tooltip
        }}
      />
      <Line type="monotone" dataKey="noise_level" stroke="#F59E0B" name="Noise Level" />
    </LineChart>
  </ResponsiveContainer>
</div>


     <div className="bg-gray-900 p-4 rounded mb-6 h-[300px]">
  <h3 className="text-white mb-2">Power Output vs Time</h3>
  <ResponsiveContainer width="100%" height="90%">
    <LineChart data={history}>
      <CartesianGrid stroke="#444" strokeDasharray="5 5" />
      <XAxis
        dataKey="timestamp"
        stroke="#ccc"
        tickFormatter={(value) => {
          const date = new Date(value * 1000);
          return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        }}
      />
      <YAxis stroke="#ccc" unit="kW" />
      <Tooltip
        labelFormatter={(value) => {
          const date = new Date(value);
          return date.toLocaleString(); // Full date & time inside tooltip
        }}
      />
      <Line type="monotone" dataKey="power_out" stroke="#10B981" name="Power Output" />
    </LineChart>
  </ResponsiveContainer>
</div>

      {/* 3D Turbine Model */}
       <div className="h-[500px] mt-6 border rounded bg-gray-900 relative">
        <Canvas camera={{ position: [0, 5, 10], fov: 50 }}>
          <color attach="background" args={["lightblue"]} />
          <Sky sunPosition={[100, 20, 10]} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} />
          <TurbineModel
            rpm={latest?.rotor_speed || 0}
            pitch={latest?.pitch_angle || 0}
            windDirection={latest?.wind_direction || 0}
            position={[0, -5, 0]}
            scale={[0.5, 0.5, 0.5]}
          />
          <OrbitControls />
        </Canvas>

        {/* ✅ HUD fixed bottom-left */}
        {latest && (
          <div className="absolute top-4 left-4 bg-black/70 text-white p-3 rounded-lg text-xs space-y-1 shadow-md">
            <p><strong>Wind Speed:</strong> {latest.wind_speed} m/s</p>
            <p><strong>Wind Dir:</strong> {latest.wind_direction}°</p>
            <p><strong>Noise:</strong> {latest.noise_level} dB</p>
            <p><strong>Pitch:</strong> {latest.pitch_angle}°</p>
            <p><strong>Power:</strong> {latest.power_out} kW</p>
            <p><strong>RPM:</strong> {latest.rotor_speed}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoiseMonitoring;
