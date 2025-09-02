import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import NoiseChart from "./NoiseChart";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import { useTurbineStore } from '../../store/turbineStore';

interface FuturePrediction {
  timestamp: string;
  wind_speed: number;
  wind_direction: number;
  best_pitch_angle: number;
  predicted_noise: number;
  predicted_rpm: number;
  predicted_power: number;
}

const containerStyle = {
  width: "100%",
  height: "400px",
};

const defaultCenter = {
  lat: 6.9271,
  lng: 79.8612,
};

const FutureNoisePrediction: React.FC = () => {
  const [predictions, setPredictions] = useState<FuturePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number }>(defaultCenter);
  const setActiveModule = useTurbineStore(state => state.setActiveModule);

  const fetchPredictions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:8000/noise/predict-future", {
        params: {
          lat: location.lat,
          lon: location.lng,
          target_noise: 35,
        },
      });

      const data = response.data?.predictions ?? response.data ?? [];
      setPredictions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching future predictions:", err);
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  }, [location]);

  useEffect(() => {
    fetchPredictions();
  }, [fetchPredictions]);

  // Aggregate predictions for chart: 1 point per day (5-day forecast)
  const dailyNoiseData = Array.from(
    predictions.reduce((map, p) => {
      const date = new Date(p.timestamp);
      const dayKey = date.toISOString().slice(0, 10); // YYYY-MM-DD format
      if (!map.has(dayKey)) {
        map.set(dayKey, { timestamp: date.getTime(), noise_level: p.predicted_noise });
      }
      return map;
    }, new Map<string, { timestamp: number; noise_level: number }>())
    .values()
  );

  return (
    <div className="p-6 bg-black text-white min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Predict 5-Day Noise</h1>
        <div className="space-x-2">
          <button
            onClick={() => setActiveModule('noise')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded shadow"
          >
            Live
          </button>
           <button
            onClick={() => setActiveModule('noisePrediction')}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded shadow"
          >
            Predict Noise
          </button>
        </div>
      </div>

      {/* Google Map */}
      <div className="mb-6">
        <LoadScript googleMapsApiKey="AIzaSyD8JLkZIXnhtbCg_ByyafoyfodA-1kr8Ms">
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={location}
            zoom={7}
            onClick={(e) =>
              setLocation({
                lat: e.latLng?.lat() || defaultCenter.lat,
                lng: e.latLng?.lng() || defaultCenter.lng,
              })
            }
          >
            <Marker position={location} />
          </GoogleMap>
        </LoadScript>
      </div>

      <p className="mb-4 text-gray-300">
        Selected Location: 🌍 {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
      </p>

      {loading ? (
        <p>Loading predictions...</p>
      ) : predictions.length === 0 ? (
        <p className="text-gray-400">No prediction data available.</p>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-x-auto mb-6">
            <div className="max-h-96 overflow-y-auto">
              <table className="min-w-full bg-gray-800 rounded-xl">
                <thead className="sticky top-0 bg-gray-900 z-10">
                  <tr>
                    <th className="px-4 py-2">Time</th>
                    <th className="px-4 py-2">Wind Speed (m/s)</th>
                    <th className="px-4 py-2">Wind Direction (°)</th>
                    <th className="px-4 py-2">Pitch Angle (°)</th>
                    <th className="px-4 py-2">Noise (dB)</th>
                    <th className="px-4 py-2">Rotor Speed (RPM)</th>
                    <th className="px-4 py-2">Power (kW)</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions.map((p, idx) => (
                    <tr key={idx} className="border-t border-gray-700">
                      <td className="px-4 py-2">{p.timestamp}</td>
                      <td className="px-4 py-2">{p.wind_speed}</td>
                      <td className="px-4 py-2">{p.wind_direction}</td>
                      <td className="px-4 py-2">{p.best_pitch_angle}</td>
                      <td className="px-4 py-2">{p.predicted_noise}</td>
                      <td className="px-4 py-2">{p.predicted_rpm}</td>
                      <td className="px-4 py-2">{p.predicted_power}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

         
         
          
        </>
      )}
    </div>
  );
};

export default FutureNoisePrediction;
