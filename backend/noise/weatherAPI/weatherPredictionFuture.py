import os
import numpy as np
import joblib
from .weatherPrediction import fetch_5day_forecast
from datetime import datetime

# --- Config ---
# MODEL_PATH = os.path.abspath(
#     os.path.join(os.path.dirname(__file__), "..", "models", "rf_model.pkl")
# )
MODEL_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "models", "xgb_model.pkl")
)
if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"Model file not found at {MODEL_PATH}")

model = joblib.load(MODEL_PATH)

# --- Limits ---
MAX_WIND_SPEED = 25.0
MIN_WIND_SPEED = 0.0
PITCH_RANGE = (0, 70)   # match your RF model's PITCH_MIN/PITCH_MAX
PITCH_STEP = 5          # pitch increment in degrees
MAX_RPM = 2000
MIN_RPM = 0
MAX_POWER = 3450        # match RATED_POWER in RF model
MIN_POWER = 0

def predict_future_weather(lat: float, lon: float, target_noise_level: float = 35.0):
    """
    Fetch 5-day forecast and predict turbine performance (noise, rpm, power) using RF model.
    Returns a list of predictions for frontend.
    """
    try:
        forecast_data = fetch_5day_forecast(lat, lon)
    except Exception as e:
        return {"error": f"Failed to fetch weather forecast: {str(e)}"}

    results = []

    for entry in forecast_data:
        wind_speed = np.clip(entry.get("wind_speed", 0.0), MIN_WIND_SPEED, MAX_WIND_SPEED)
        wind_direction = entry.get("wind_direction", 0.0) % 360  # normalize

        best_result = None

        for pitch in range(PITCH_RANGE[0], PITCH_RANGE[1] + 1, PITCH_STEP):
            features = np.array([[wind_speed, wind_direction, pitch]])
            
            try:
                # RF model expects DataFrame with correct column names
                import pandas as pd
                features_df = pd.DataFrame([{
                    "WindSpeed at 80m": wind_speed,
                    "Wind Direction": wind_direction,
                    "pitch angle": pitch
                }])
                pred = model.predict(features_df)[0]
            except Exception as e:
                continue  # skip if prediction fails

            # RF model returns [power, rotor_speed, noise]
            predicted_power = float(np.clip(pred[0], MIN_POWER, MAX_POWER))
            predicted_rpm = float(np.clip(pred[1], MIN_RPM, MAX_RPM))
            predicted_noise = float(pred[2])
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

        # Append the best result for this forecast entry
        results.append({
            "timestamp": datetime.fromtimestamp(entry.get("timestamp", datetime.now().timestamp())).isoformat(),
            "wind_speed": float(wind_speed),
            "wind_direction": float(wind_direction),
            "best_pitch_angle": int(best_result["pitch_angle"]),
            "predicted_noise": round(best_result["noise_level"], 2),
            "predicted_rpm": round(best_result["rotor_speed"], 0),
            "predicted_power": round(best_result["power_out"], 2)
        })

    return results

# --- Example usage ---
if __name__ == "__main__":
    data = predict_future_weather(51.5085, -0.1257)  # London
    import json
    print(json.dumps(data, indent=2))
