import os
import numpy as np
import joblib
from .weatherPrediction import fetch_5day_forecast
from datetime import datetime

# Load your trained XGBoost model
MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "train_model", "wind_predictor_xgboost.pkl")
model = joblib.load(MODEL_PATH)

# Define limits
MAX_WIND_SPEED = 25.0
MIN_WIND_SPEED = 0.0
PITCH_RANGE = (0, 30)
MAX_RPM = 2000
MIN_RPM = 0
MAX_POWER = 3000
MIN_POWER = 0

def predict_future_weather(lat: float, lon: float, target_noise_level: float = 35.0):
    """
    Fetch 5-day forecast and predict turbine performance (noise, rpm, power).
    Returns list of predictions for frontend.
    """
    forecast_data = fetch_5day_forecast(lat, lon)
    results = []

    for entry in forecast_data:
        wind_speed = np.clip(entry["wind_speed"], MIN_WIND_SPEED, MAX_WIND_SPEED)
        wind_direction = entry["wind_direction"] % 360  # normalize

        # Sweep pitch angles to find best
        best_result = None
        for pitch in range(PITCH_RANGE[0], PITCH_RANGE[1] + 1):
            features = np.array([[wind_speed, wind_direction, pitch]])
            pred = model.predict(features)[0]

            predicted_noise = float(pred[0])
            predicted_rpm = float(np.clip(pred[1], MIN_RPM, MAX_RPM))
            predicted_power = float(np.clip(pred[2], MIN_POWER, MAX_POWER))
            noise_diff = abs(predicted_noise - target_noise_level)

            candidate = {
                "pitch_angle": pitch,
                "noise_level": predicted_noise,
                "rotor_speed": predicted_rpm,
                "power_out": predicted_power,
                "noise_diff": noise_diff
            }

            if not best_result or (candidate["noise_diff"], -candidate["power_out"]) < (
                best_result["noise_diff"], -best_result["power_out"]
            ):
                best_result = candidate

        # Append the rounded best result for this entry
        results.append({
    "timestamp": datetime.fromtimestamp(entry["timestamp"]).strftime('%Y-%m-%d %H:%M:%S'),
    "wind_speed": float(wind_speed),
    "wind_direction": float(wind_direction),
    "best_pitch_angle": int(best_result["pitch_angle"]),
    "predicted_noise": round(best_result["noise_level"], 2),
    "predicted_rpm": round(best_result["rotor_speed"], 0),
    "predicted_power": round(best_result["power_out"], 2)
})

    return results

# Example usage
if __name__ == "__main__":
    data = predict_future_weather(51.5085, -0.1257)  # London
    import json
    print(json.dumps(data, indent=2))
