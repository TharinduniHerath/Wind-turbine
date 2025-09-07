import React, { useState } from "react";
import axios from "axios";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import TurbineModel from "../Turbine3DModelV2/WindTurbine"; // Adjust path as needed
import { useTurbineStore } from "../../store/turbineStore"; // import your store hook

interface PredictionResult {
  pitch_angle: number;
  noise_level: number;
  rotor_speed: number;
  power_out: number;
}
const PredictionPage: React.FC = () => {
  const [windSpeed, setWindSpeed] = useState("");
  const [windDirection, setWindDirection] = useState("");
  const [targetNoiseLevel, setTargetNoiseLevel] = useState("35");
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Get setActiveModule from the global store to change active module
  const setActiveModule = useTurbineStore(state => state.setActiveModule);

  const handlePredict = async () => {
    setError("");
    setPrediction(null);

    if (!windSpeed || !windDirection || !targetNoiseLevel) {
      setError("Wind speed, wind direction, and target noise level are required.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post("http://localhost:8000/noise/predict", {
        wind_speed: parseFloat(windSpeed),
        wind_direction: parseFloat(windDirection),
        target_noise_level: parseFloat(targetNoiseLevel),
      });

      setPrediction(response.data);
    } catch (err) {
      console.error("Prediction error:", err);
      setError("Prediction failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-slate-900 text-white min-h-screen">
      {/* Header with title and Live button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Predict Noise & Turbine Behavior</h1>
          <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
        <button
          onClick={() => setActiveModule('noise')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded shadow"
          type="button"
        >
          Live
        </button>
          <button
            onClick={() => setActiveModule('futureNoisePrediction')}
           className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded shadow"
          >
            Predict 5-Day Noise
          </button>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
        <div>
          <label className="block mb-1 font-medium">Wind Speed (m/s)</label>
          <input
            type="number"
            value={windSpeed}
            onChange={(e) => setWindSpeed(e.target.value)}
            className="w-full p-2 rounded bg-white text-black"
            placeholder="Enter wind speed"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Wind Direction (°)</label>
          <input
            type="number"
            value={windDirection}
            onChange={(e) => setWindDirection(e.target.value)}
            className="w-full p-2 rounded bg-white text-black"
            placeholder="Enter wind direction"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Target Noise Level (dB)</label>
          <input
            type="number"
            value={targetNoiseLevel}
            onChange={(e) => setTargetNoiseLevel(e.target.value)}
            className="w-full p-2 rounded bg-white text-black"
            placeholder="e.g. 35"
          />
        </div>
      </div>

      {error && (
        <div className="text-red-400 mb-4">⚠️ {error}</div>
      )}

      <button
        onClick={handlePredict}
        className={`px-6 py-2 rounded font-semibold transition ${
          loading ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
        }`}
        disabled={loading}
      >
        {loading ? "Predicting..." : "Predict"}
      </button>

      {prediction && (
  <>
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">Prediction Results</h2>

      {/* Card-style grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-gray-800 p-4 rounded text-center">
          <p className="text-gray-400">Noise Level</p>
          <h2 className="text-white font-bold">
            {prediction.noise_level !== undefined
              ? prediction.noise_level.toFixed(2)
              : "N/A"}{" "}
            dB
          </h2>
        </div>

        <div className="bg-gray-800 p-4 rounded text-center">
          <p className="text-gray-400">Rotor Speed</p>
          <h2 className="text-white font-bold">
            {prediction.rotor_speed !== undefined
              ? prediction.rotor_speed.toFixed(2)
              : "N/A"}{" "}
            RPM
          </h2>
        </div>

        <div className="bg-gray-800 p-4 rounded text-center">
          <p className="text-gray-400">Pitch Angle</p>
          <h2 className="text-white font-bold">
            {prediction.pitch_angle !== undefined
              ? prediction.pitch_angle.toFixed(2)
              : "N/A"}°
          </h2>
        </div>

        <div className="bg-gray-800 p-4 rounded text-center">
          <p className="text-gray-400">Power Output</p>
          <h2 className="text-white font-bold">
            {prediction.power_out !== undefined
              ? prediction.power_out.toFixed(2)
              : "N/A"}{" "}
            kW
          </h2>
        </div>
      </div>
    </div>

    {/* Turbine canvas */}
    <div className="mt-8 h-[500px] border rounded bg-gray-900">
      <Canvas camera={{ position: [0, 8, 20], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} />
        <TurbineModel
          rpm={prediction.rotor_speed}
          pitch={prediction.pitch_angle}
          windDirection={parseFloat(windDirection)}
          windSpeed={parseFloat(windSpeed)}
          position={[0, -5, 0]}
          scale={[0.5, 0.5, 0.5]}
        />
        <OrbitControls />
      </Canvas>
    </div>
  </>
)}

    </div>
  );
};

export default PredictionPage;
