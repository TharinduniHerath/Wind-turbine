import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error
import joblib
import os

# Load dataset
file_path = os.path.join("..", "noiseData", "wind_data.csv")
df = pd.read_csv(file_path)
df = df[['WindSpeed at 80m', 'Wind Direction', 'noise level', 'Rotor Speed', 'pitch angle','power out']]
df.dropna(inplace=True)

# Split features and targets
X = df[['WindSpeed at 80m', 'Wind Direction', 'pitch angle']]
y = df[['noise level', 'Rotor Speed','power out']]
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train model
model = RandomForestRegressor()
model.fit(X_train, y_train)

# Evaluate model
y_pred = model.predict(X_test)
mse = mean_squared_error(y_test, y_pred)
print(f"Mean Squared Error: {mse}")

# Save model
joblib.dump(model, 'wind_predictor_random_forest.pkl')
print("✅ Model saved as wind_predictor_random_forest.pkl")
