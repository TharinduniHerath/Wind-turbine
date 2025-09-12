# predict_pitch_v3.py
import pandas as pd
import numpy as np
import joblib
import os

# --- Config ---  
MODEL_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "models", "rf_model_physics_aware.pkl")
)

CUT_IN = 3.0
RATED = 11.5
CUT_OUT = 22.0
RATED_POWER = 3450
PITCH_MIN = 0
PITCH_MAX = 70
PITCH_STEP = 5.0

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"Model file not found at {MODEL_PATH}")

# --- Load model ---
model = joblib.load(MODEL_PATH)

# --- Physics guard ---

def physics_guard(preds, wind_speed):
    y = preds.copy().astype(float)
    
    # Ensure wind_speed is an array
    wind_speed = np.array([wind_speed]) if np.isscalar(wind_speed) else np.array(wind_speed)

    # Cut-in wind: no power, no rpm, no noise
    stopped = wind_speed < CUT_IN
    y[stopped, 0] = 0.0  # power out
    y[stopped, 1] = 0.0  # rotor speed
    y[stopped, 2] = 0.0  # noise level

    # Cut-out wind: no power, no rpm, no noise
    over = wind_speed >= CUT_OUT
    y[over, 0] = 0.0
    y[over, 1] = 0.0
    y[over, 2] = 0.0

    # Rated wind: cap power
    rated_zone = (wind_speed >= RATED) & (wind_speed < CUT_OUT)
    y[rated_zone, 0] = np.minimum(y[rated_zone, 0], RATED_POWER)

    return y
# --- Main function to recommend pitch ---
def recommend_pitch_with_noise(wind_speed: float, wind_dir: float, target_noise: float):
    pitch_angles = np.arange(PITCH_MIN, PITCH_MAX + PITCH_STEP, PITCH_STEP)
    results = []

    for pitch in pitch_angles:
        features = pd.DataFrame({
            "WindSpeed at 80m": [wind_speed],
            "Wind Direction": [wind_dir],
            "pitch angle": [pitch]
        })

        pred = model.predict(features)[0]
        pred = physics_guard(np.array([pred]), np.array([wind_speed]))[0]

        results.append({
            "pitch_angle": pitch,
            "power_out": pred[0],
            "rotor_speed": pred[1],
            "noise_level": pred[2]
        })

    # Filter results that are <= target noise
    feasible = [r for r in results if r["noise_level"] <= target_noise]

    if feasible:
        # Sort feasible by closest to target noise, then max power
        feasible.sort(key=lambda x: (target_noise - x["noise_level"], -x["power_out"]))
        best = feasible[0]
    else:
        # No feasible noise level → return max power anyway
        results.sort(key=lambda x: -x["power_out"])
        best = results[0]

    return best  # return plain dict, not pd.Series

# --- Example usage ---
if __name__ == "__main__":
    wind_speed = 0.0       # m/s
    wind_dir = 180          # degrees
    required_noise = 40.0   # dB

    best_setting = recommend_pitch_with_noise(wind_speed, wind_dir, required_noise)
    print("Best operating point:")
    print(best_setting)
