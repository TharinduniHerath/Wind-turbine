import pandas as pd
import matplotlib.pyplot as plt

# --- Load your dataset ---
DATA_PATH = "../noiseData/wind_data.csv"  # adjust if needed
df = pd.read_csv(DATA_PATH)

# --- Target noise levels to check ---
target_noise_levels = [40, 45, 50, 55, 60, 65]
colors = ['red', 'orange', 'yellow', 'green', 'blue', 'purple']

plt.figure(figsize=(12, 6))
plt.hist(df["noise level"], bins=30, color='skyblue', edgecolor='black')
plt.title("Noise Level Distribution in Dataset")
plt.xlabel("Noise Level (dB)")
plt.ylabel("Count")

# Draw vertical lines for each target noise level
for tn, color in zip(target_noise_levels, colors):
    plt.axvline(tn, color=color, linestyle='--', label=f"Target {tn} dB")

plt.legend()
plt.grid(alpha=0.3)
plt.show()
