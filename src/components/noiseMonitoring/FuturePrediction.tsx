import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
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
  height: "50vh",
};

const defaultCenter = {
  lat: 9.05028,
  lng: 79.78694,
};

const FutureNoisePrediction: React.FC = () => {
  const [predictions, setPredictions] = useState<FuturePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number }>(defaultCenter);
  const setActiveModule = useTurbineStore(state => state.setActiveModule);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "",
  });

  const fetchPredictions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:8000/noise/predict-future", {
        params: {
          lat: location.lat,
          lon: location.lng,
          target_noise: 50,
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

  // Group by date and calculate averages for summary table
  const dailySummaryMap = predictions.reduce((acc: Record<string, { count: number; noiseSum: number; powerSum: number }>, curr) => {
    const date = new Date(curr.timestamp).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = { count: 1, noiseSum: curr.predicted_noise, powerSum: curr.predicted_power };
    } else {
      acc[date].count += 1;
      acc[date].noiseSum += curr.predicted_noise;
      acc[date].powerSum += curr.predicted_power;
    }
    return acc;
  }, {});

  const dailySummaryArray = Object.entries(dailySummaryMap).map(([date, values]) => ({
    date,
    avg_noise: values.noiseSum / values.count,
    avg_power: values.powerSum / values.count,
  }));

  return (
    <div className="p-6 bg-black text-white min-h-screen">
      {/* Header & Buttons */}
      <div className="flex justify-between items-center mb-4 flex-wrap">
        <h1 className="text-2xl font-bold">Predict 5-Day Noise</h1>
        <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0 mt-2 sm:mt-0">
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
        {isLoaded ? (
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
        ) : (
          <p>Loading map...</p>
        )}
      </div>

      <p className="mb-4 text-gray-300">
        Selected Location: 🌍 {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
      </p>

      {/* Summary Table */}
      {predictions.length > 0 && (
        <div className="overflow-x-auto mt-6 mb-10 bg-gray-900 p-4 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">Daily Average Noise & Power</h2>
          <table className="min-w-full bg-gray-800 rounded-lg">
            <thead className="sticky top-0 bg-gray-900 z-10">
              <tr>
                <th className="px-4 py-2 text-center">Date</th>
                <th className="px-4 py-2 text-center">Average Predicted Noise (dB)</th>
                <th className="px-4 py-2 text-center">Average Predicted Power Output (kW)</th>
              </tr>
            </thead>
            <tbody>
              {dailySummaryArray.map((p, idx) => (
                <tr
                  key={idx}
                  className={`border-t border-gray-700 hover:bg-gray-700 transition ${idx % 2 === 0 ? "bg-gray-800" : "bg-gray-700"}`}
                >
                  <td className="px-4 py-2 text-center">{p.date}</td>
                  <td className="px-4 py-2 text-center">{p.avg_noise.toFixed(2)}</td>
                  <td className="px-4 py-2 text-center">{p.avg_power.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detailed Table */}
      {loading ? (
        <p>Loading predictions...</p>
      ) : predictions.length === 0 ? (
        <p className="text-gray-400">No prediction data available.</p>
      ) : (
        <div className="overflow-x-auto bg-gray-900 p-4 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">Detailed Predictions (3-hour intervals)</h2>
          <div className="max-h-96 overflow-y-auto">
            <table className="min-w-full bg-gray-800 rounded-lg">
              <thead className="sticky top-0 bg-gray-900 z-10">
                <tr>
                  <th className="px-4 py-2 text-center">Time</th>
                  <th className="px-4 py-2 text-center">Wind Speed (m/s)</th>
                  <th className="px-4 py-2 text-center">Wind Direction (°)</th>
                  <th className="px-4 py-2 text-center">Best Pitch Angle (°)</th>
                  <th className="px-4 py-2 text-center">Predicted Noise (dB)</th>
                  <th className="px-4 py-2 text-center">Rotor Speed (RPM)</th>
                  <th className="px-4 py-2 text-center">Predicted Power (kW)</th>
                </tr>
              </thead>
              <tbody>
  {predictions.map((p, idx) => {
    const date = new Date(p.timestamp);
    const formatted = date.toLocaleString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true, // AM/PM format
    });

    return (
      <tr
        key={idx}
        className={`border-t border-gray-700 hover:bg-gray-700 transition ${idx % 2 === 0 ? "bg-gray-800" : "bg-gray-700"}`}
      >
        <td className="px-4 py-2 text-center">{formatted}</td>
        <td className="px-4 py-2 text-center">{p.wind_speed}</td>
        <td className="px-4 py-2 text-center">{p.wind_direction}</td>
        <td className="px-4 py-2 text-center">{p.best_pitch_angle}</td>
        <td className="px-4 py-2 text-center">{p.predicted_noise}</td>
        <td className="px-4 py-2 text-center">{p.predicted_rpm}</td>
        <td className="px-4 py-2 text-center">{p.predicted_power}</td>
      </tr>
    );
  })}
</tbody>

            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default FutureNoisePrediction;
