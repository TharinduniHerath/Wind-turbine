import pandas as pd
import os
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_squared_error

# Load dataset
file_path = os.path.join("..", "data", "wind_data.csv")
df = pd.read_csv(file_path)
df = df[['WindSpeed at 80m', 'Wind Direction', 'noise level', 'Rotor Speed', 'pitch angle','power out']]
df.dropna(inplace=True)

X = df[['WindSpeed at 80m', 'Wind Direction', 'pitch angle']]
targets = ['noise level', 'Rotor Speed','power out']

for target in targets:
    print(f"📘 Training Gradient Boosting for target: {target}")
    y = df[target]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = GradientBoostingRegressor()
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    mse = mean_squared_error(y_test, y_pred)
    print(f"  {target} - MSE: {mse:.4f}")

    # Save each model separately
    filename = f"wind_predictor_gradient_boosting_{target.replace(' ', '_')}.pkl"
    joblib.dump(model, filename)
    print(f"  ✅ Saved model: {filename}\n")
