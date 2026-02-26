import pandas as pd

# Load your dataset
DATA_PATH = "../noiseData/wind_data.csv"
df = pd.read_csv(DATA_PATH)

# Check noise level range
print("Noise level range:")
print(df["noise level"].min(), "to", df["noise level"].max())

# Count of each unique noise level (or bin them for a range)
print("\nNoise level counts:")
print(df["noise level"].value_counts().sort_index())

# Optional: histogram for better visualization
import matplotlib.pyplot as plt
plt.hist(df["noise level"], bins=20, color='skyblue', edgecolor='black')
plt.xlabel("Noise level (dB)")
plt.ylabel("Count")
plt.title("Distribution of Noise Levels in Dataset")
plt.show()
