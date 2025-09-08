# evaluation_models_auto.py
import pandas as pd
import numpy as np
import joblib
import os
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
from sklearn.preprocessing import StandardScaler
import matplotlib.pyplot as plt

# --- Config ---
DATA_PATH = "../noiseData/wind_data.csv"
MODEL_DIR = "../models"

models_info = {
    "Linear": {"model": "linear_model.pkl", "scaler": "scaler_linear_model.pkl"},
    "MLP": {"model": "mlp_model.pkl", "scaler": "scaler_mlp_model.pkl"},
    "RandomForest": {"model": "rf_model.pkl", "scaler": None},  # tree-based may not need scaler
    "XGBoost": {"model": "xgb_model.pkl", "scaler": None},
}

INPUT_COLS = ["WindSpeed at 80m", "Wind Direction", "pitch angle"]
OUTPUT_COLS = ["power out", "Rotor Speed", "noise level"]

# --- Load dataset ---
df = pd.read_csv(DATA_PATH)
X = df[INPUT_COLS]
y = df[OUTPUT_COLS]

# --- Train-test split ---
from sklearn.model_selection import train_test_split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# --- Store evaluation results ---
results = []

for name, files in models_info.items():
    model_path = os.path.join(MODEL_DIR, files["model"])
    scaler_path = files["scaler"]
    
    model = joblib.load(model_path)
    
    # Apply scaler if exists
    if scaler_path:
        scaler = joblib.load(os.path.join(MODEL_DIR, scaler_path))
        X_test_scaled = scaler.transform(X_test)
    else:
        X_test_scaled = X_test.values  # no scaling
    
    # Predictions
    y_pred = model.predict(X_test_scaled)
    
    # Compute metrics
    mse = mean_squared_error(y_test, y_pred, multioutput="raw_values")
    mae = mean_absolute_error(y_test, y_pred, multioutput="raw_values")
    r2 = r2_score(y_test, y_pred, multioutput="variance_weighted")
    
    results.append({
        "Model": name,
        "MSE_Power": mse[0],
        "MSE_RPM": mse[1],
        "MSE_Noise": mse[2],
        "MAE_Power": mae[0],
        "MAE_RPM": mae[1],
        "MAE_Noise": mae[2],
        "R2_weighted": r2
    })

# --- Convert to DataFrame ---
df_results = pd.DataFrame(results)
print(df_results)

# --- Save results ---
os.makedirs("../results", exist_ok=True)
df_results.to_csv("../results/model_comparison_metrics.csv", index=False)

# --- Plot R2 comparison ---
plt.figure(figsize=(8,5))
plt.bar(df_results["Model"], df_results["R2_weighted"], color=["skyblue","lightgreen","orange","salmon"])
plt.ylabel("Weighted R²")
plt.title("Model Comparison: Weighted R²")
plt.ylim(0,1)
plt.grid(axis="y", linestyle="--", alpha=0.7)
plt.savefig("../results/model_comparison_r2.png", dpi=300)
plt.show()
