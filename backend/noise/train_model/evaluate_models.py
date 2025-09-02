import pandas as pd
import os
import joblib
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# Load data
file_path = os.path.join("..", "noiseData", "wind_data.csv")
df = pd.read_csv(file_path)
df = df[['WindSpeed at 80m', 'Wind Direction', 'noise level', 'Rotor Speed', 'pitch angle','power out']]
df.dropna(inplace=True)

# Features and targets
X = df[['WindSpeed at 80m', 'Wind Direction', 'pitch angle']]
y = df[['noise level', 'Rotor Speed','power out']]
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# List of model files
model_files = {
    "Linear Regression": "wind_predictor_linear_regression.pkl",
    "Decision Tree": "wind_predictor_decision_tree.pkl",
    "Random Forest": "wind_predictor_random_forest.pkl",
    
    "KNN": "wind_predictor_knn.pkl",
    "XGBoost": "wind_predictor_xgboost.pkl"
}

# Evaluate each model
print("📊 Model Evaluation Results\n")
for model_name, file_name in model_files.items():
    print(f"🔍 Evaluating {model_name}")
    model = joblib.load(file_name)
    y_pred = model.predict(X_test)

    # For multi-output
    if y.shape[1] > 1:
        target_names = ['noise level', 'Rotor Speed', 'pitch angle']
        for i, target in enumerate(target_names):
            mae = mean_absolute_error(y_test.iloc[:, i], y_pred[:, i])
            mse = mean_squared_error(y_test.iloc[:, i], y_pred[:, i])
            r2 = r2_score(y_test.iloc[:, i], y_pred[:, i])
            print(f"  ➤ {target}: MAE={mae:.3f}, MSE={mse:.3f}, R2={r2:.3f}")
    else:
        mae = mean_absolute_error(y_test, y_pred)
        mse = mean_squared_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        print(f"  ➤ MAE={mae:.3f}, MSE={mse:.3f}, R2={r2:.3f}")
    print()
