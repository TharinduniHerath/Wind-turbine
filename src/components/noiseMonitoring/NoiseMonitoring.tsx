// import React, { useEffect } from "react";
// import { Canvas } from "@react-three/fiber";
// import { useNoiseStore } from "../../store/noiseStore";
// import NoiseChart from "./NoiseChart";
// import TurbineModel from "../Turbine3DModelV2/WindTurbine"; // Update path if necessary
// import { OrbitControls } from "@react-three/drei";
// import { useTurbineStore } from '../../store/turbineStore';

// const NoiseMonitoring: React.FC = () => {
//   const addData = useNoiseStore((state) => state.addData);
//   const latest = useNoiseStore((state) => state.latest);
//   const history = useNoiseStore((state) => state.history);
//   const setActiveModule = useTurbineStore(state => state.setActiveModule);

//   useEffect(() => {
//     const ws = new WebSocket("ws://localhost:8000/ws/stream");

//     ws.onopen = () => {
//       console.log("✅ WebSocket connected.");
//     };

//     ws.onmessage = (event) => {
//       const data = JSON.parse(event.data);
//       addData(data);
//     };

//     ws.onclose = () => {
//       console.log("WebSocket disconnected.");
//     };

//     return () => ws.close();
//   }, [addData]);

//   return (
//     <div className="p-6 bg-black text-white min-h-screen">
//       {/* Header with Predict Button */}
//       <div className="flex justify-between items-center mb-4">
//         <h1 className="text-2xl font-bold">Real-Time Noise Monitoring</h1>
//         <button
//           onClick={() => setActiveModule('noisePrediction')}
//           className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded shadow"
//         >
//           Predict Noise
//         </button>
//       </div>

//       {/* Realtime latest values display */}
//       {latest && (
//         <div className="mb-6 bg-gray-800 p-4 rounded-xl shadow-sm text-white">
//           <p><strong>Noise Level:</strong> {latest.noise_level} dB</p>
//           <p><strong>Wind Speed:</strong> {latest.wind_speed} m/s</p>
//           <p><strong>Wind Direction:</strong> {latest.wind_direction}°</p>
//           <p><strong>Power Output:</strong> {latest.power_out}</p>
//           <p><strong>Rotor Speed:</strong> {latest.rotor_speed} RPM</p>
//           <p><strong>Pitch Angle:</strong> {latest.pitch_angle}</p>
//         </div>
//       )}

//       {/* Noise chart */}
//       <NoiseChart data={history} />

//       {/* 3D Turbine Simulation */}
//       <div className="h-[500px] mt-6 border rounded bg-gray-900">
//         <Canvas camera={{ position: [0, 5, 10], fov: 50 }}>
//           <color attach="background" args={["lightblue"]} />
//           <ambientLight intensity={0.5} />
//           <directionalLight position={[5, 5, 5]} />
//           <TurbineModel
//             rpm={latest?.rotor_speed || 0}
//             pitch={latest?.pitch_angle || 0}
//             wind_direction={latest?.wind_direction || 0}
//             position={[0, -5, 0]}
//             scale={[0.5, 0.5, 0.5]}
//           />
//           <OrbitControls />
//         </Canvas>
//       </div>
//     </div>
//   );
// };

// export default NoiseMonitoring;


// NoiseMonitoring.tsx
import React, { useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { useNoiseStore } from "../../store/noiseStore";
import NoiseChart from "./NoiseChart";
import TurbineModel from "../Turbine3DModelV2/WindTurbine";
import { OrbitControls } from "@react-three/drei";
import { useTurbineStore } from '../../store/turbineStore';

const NoiseMonitoring: React.FC = () => {
  const addData = useNoiseStore((state) => state.addData);
  const latest = useNoiseStore((state) => state.latest);
  const history = useNoiseStore((state) => state.history);
  const setActiveModule = useTurbineStore(state => state.setActiveModule);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws/stream");

    ws.onopen = () => console.log("✅ WebSocket connected.");
    ws.onmessage = (event) => addData(JSON.parse(event.data));
    ws.onclose = () => console.log("WebSocket disconnected.");

    return () => ws.close();
  }, [addData]);

  return (
    <div className="p-6 bg-black text-white min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Real-Time Noise Monitoring</h1>
        <button
          onClick={() => setActiveModule('noisePrediction')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded shadow"
        >
          Predict Noise
        </button>
      </div>

      {latest && (
        <div className="mb-6 bg-gray-800 p-4 rounded-xl shadow-sm text-white">
          <p><strong>Noise Level:</strong> {latest.noise_level} dB</p>
          <p><strong>Wind Speed:</strong> {latest.wind_speed} m/s</p>
          <p><strong>Wind Direction:</strong> {latest.wind_direction}°</p>
          <p><strong>Power Output:</strong> {latest.power_out}</p>
          <p><strong>Rotor Speed:</strong> {latest.rotor_speed} RPM</p>
          <p><strong>Pitch Angle:</strong> {latest.pitch_angle}</p>
        </div>
      )}

      <NoiseChart data={history} />

      <div className="h-[500px] mt-6 border rounded bg-gray-900">
        <Canvas camera={{ position: [0, 5, 10], fov: 50 }}>
          <color attach="background" args={["lightblue"]} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} />
          <TurbineModel
              rpm={latest?.rotor_speed || 0}  // updates continuously
             pitch={latest?.pitch_angle || 0}
             windDirection={latest?.wind_direction || 0}
             position={[0, -5, 0]}
             scale={[0.5, 0.5, 0.5]} 
          />
          <OrbitControls />
        </Canvas>
      </div>
    </div>
  );
};

export default NoiseMonitoring;
