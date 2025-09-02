import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LinearRegression
from sklearn.multioutput import MultiOutputRegressor
from sklearn.metrics import mean_squared_error, r2_score
import joblib
import os

# --- Config ---
DATA_PATH = "../noiseData/wind_data.csv"
MODEL_SAVE_DIR = "../models"
os.makedirs(MODEL_SAVE_DIR, exist_ok=True)

CUT_IN = 3.0
RATED = 11.5
CUT_OUT = 22.0
RATED_POWER = 3450  # kW, for your Vestas V126/3450 turbine

# --- Define inputs/outputs ---
INPUT_COLUMNS = ["WindSpeed at 80m", "Wind Direction", "pitch angle"]
OUTPUT_COLUMNS = ["power out", "Rotor Speed", "noise level"]

# --- Load data ---
df = pd.read_csv(DATA_PATH)
X = df[INPUT_COLUMNS]
y = df[OUTPUT_COLUMNS]

# --- Train-test split ---
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# --- Scaling (important for MLP, optional for Linear) ---
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# --- Physics-aware sample weights ---
weights = np.ones(len(X_train))
weights[X_train["WindSpeed at 80m"] < CUT_IN] = 50.0
weights[X_train["WindSpeed at 80m"] >= CUT_OUT] = 50.0

# --- Physics guard function ---
def physics_guard(preds, X):
    wind = np.asarray(X["WindSpeed at 80m"])
    y = preds.copy().astype(float)

    # Below cut-in → no power, no rpm
    stopped = wind < CUT_IN
    y[stopped, 0] = 0.0  # Power out
    y[stopped, 1] = 0.0  # Rotor Speed

    # Above cut-out → no power, no rpm
    over = wind >= CUT_OUT
    y[over, 0] = 0.0
    y[over, 1] = 0.0

    # Rated zone → cap power at rated
    rated_zone = (wind >= RATED) & (wind < CUT_OUT)
    y[rated_zone, 0] = np.minimum(y[rated_zone, 0], RATED_POWER)

    return y

# --- Violation metrics ---
def violation_metrics(X, y_pred):
    wind = np.asarray(X["WindSpeed at 80m"])
    power = y_pred[:, 0]
    rpm = y_pred[:, 1]

    v = {}
    v["zero_wind_rpm_violation"] = np.mean((wind < CUT_IN) & (rpm > 0))
    v["zero_wind_power_violation"] = np.mean((wind < CUT_IN) & (power > 0))
    v["cutout_power_violation"] = np.mean((wind >= CUT_OUT) & (power > 0))
    return v

# --- Train model ---
model = MultiOutputRegressor(LinearRegression())
model.fit(X_train, y_train, sample_weight=weights)

# --- Predict and apply physics guard ---
preds = model.predict(X_test)
preds_guarded = physics_guard(preds, X_test)

# --- Evaluate ---
mse = mean_squared_error(y_test, preds_guarded, multioutput="raw_values")
r2 = r2_score(y_test, preds_guarded, multioutput="variance_weighted")
violations = violation_metrics(X_test, preds_guarded)

print("MSE per output:", dict(zip(OUTPUT_COLUMNS, mse)))
print("R2:", r2)
print("Violations:", violations)

# --- Save model and scaler ---
joblib.dump(model, os.path.join(MODEL_SAVE_DIR, "linear_model.pkl"))
joblib.dump(scaler, os.path.join(MODEL_SAVE_DIR, "scaler_linear_model.pkl"))
print("Linear Regression model saved successfully.")
