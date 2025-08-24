import os
import numpy as np
import joblib

# Load your trained xgboost model (multi-output regressor)
model_path = os.path.abspath(os.path.join("train_model", "wind_predictor_xgboost.pkl"))
model = joblib.load(model_path)

# Define realistic limits based on your turbine specs
MAX_WIND_SPEED = 25.0      # max wind speed (m/s)
MIN_WIND_SPEED = 0.0       # min wind speed
PITCH_RANGE = (0, 30)      # pitch angle limits (degrees)
MAX_RPM = 2000             # max rotor speed (rpm)
MIN_RPM = 0                # min rotor speed
MAX_POWER = 3000           # max power output (kW)
MIN_POWER = 0              # min power output

def predict_optimal_pitch_xgb(
    wind_speed: float,
    wind_direction: float,
    target_noise_level: float = 35.0,
    pitch_range: tuple = PITCH_RANGE,
    pitch_step: float = 1.0
):
    """
    Sweep pitch angle to find best pitch minimizing noise near target and maximizing power.
    Clamps inputs and outputs within realistic limits.
    Returns dict with best pitch angle and predicted values.
    """

    # Clamp inputs to safe ranges
    wind_speed = np.clip(wind_speed, MIN_WIND_SPEED, MAX_WIND_SPEED)
    # Normalize wind direction to [0,360)
    wind_direction = wind_direction % 360

    pitch_angles = np.arange(pitch_range[0], pitch_range[1] + pitch_step, pitch_step)
    results = []

    for pitch in pitch_angles:
        # Clamp pitch angle for safety
        pitch = np.clip(pitch, pitch_range[0], pitch_range[1])

        features = np.array([[wind_speed, wind_direction, pitch]])

        pred = model.predict(features)[0]

        # Clamp outputs as well
        predicted_noise = pred[0]  # noise level might not need clamping, but you can if you want
        predicted_rpm = np.clip(pred[1], MIN_RPM, MAX_RPM)
        predicted_power = np.clip(pred[2], MIN_POWER, MAX_POWER)

        noise_diff = abs(predicted_noise - target_noise_level)

        results.append({
            "pitch_angle": pitch,
            "noise_level": predicted_noise,
            "rotor_speed": predicted_rpm,
            "power_out": predicted_power,
            "noise_diff": noise_diff
        })

    # Sort by noise difference ascending, then power output descending
    results.sort(key=lambda x: (x["noise_diff"], -x["power_out"]))

    best = results[0]

    return {
         "best_pitch_angle": float(round(best["pitch_angle"], 2)),
         "predicted_noise": float(round(best["noise_level"], 2)),
         "predicted_rpm": float(round(best["rotor_speed"], 2)),
         "predicted_power": float(round(best["power_out"], 2)),
    }
