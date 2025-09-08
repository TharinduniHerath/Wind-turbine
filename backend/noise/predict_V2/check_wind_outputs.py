import numpy as np
from predict_V2 import recommend_pitch_with_noise

# Configuration
wind_dir = 180       # fixed wind direction
target_noise = 60.0  # target noise level
wind_speeds = np.arange(0, 23, 1)  # wind speeds 0 to 22 m/s

# Print table header
print(f"{'WindSpeed':>10} | {'PitchAngle':>10} | {'Power(kW)':>10} | {'RPM':>8} | {'Noise(dB)':>10}")
print("-" * 60)

# Loop through wind speeds
for ws in wind_speeds:
    best = recommend_pitch_with_noise(ws, wind_dir, target_noise)
    print(f"{ws:10.1f} | {best['pitch_angle']:10.1f} | {best['power_out']:10.1f} | "
          f"{best['rotor_speed']:8.1f} | {best['noise_level']:10.2f}")
