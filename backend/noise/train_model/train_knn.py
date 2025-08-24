import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsRegressor
from sklearn.metrics import mean_squared_error
import joblib
import os

file_path = os.path.join("..", "data", "wind_data.csv")
df = pd.read_csv(file_path)
df = df[['WindSpeed at 80m', 'Wind Direction', 'noise level', 'Rotor Speed', 'pitch angle','power out']]
df.dropna(inplace=True)

X = df[['WindSpeed at 80m', 'Wind Direction','pitch angle']]
y = df[['noise level', 'Rotor Speed', 'pitch angle','power out']]
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = KNeighborsRegressor()
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
mse = mean_squared_error(y_test, y_pred)
print(f"Mean Squared Error: {mse}")

joblib.dump(model, 'wind_predictor_knn.pkl')
print("✅ Model saved as wind_predictor_knn.pkl")
