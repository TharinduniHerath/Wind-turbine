import requests
import os

API_KEY = "5d53c32e665aca6cd4fe2e5a7e4e8f5d"
def fetch_5day_forecast(lat, lon):
    url = f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={API_KEY}&units=metric"
    response = requests.get(url)
    data = response.json()
    
    if 'list' not in data or len(data['list']) == 0:
        raise ValueError(f"Unexpected response from API: {data}")
    
    forecasts = []
    for entry in data['list']:  # loop through all 40 entries
        forecasts.append({
            "timestamp": entry['dt'],
            "wind_speed": entry['wind']['speed'],
            "wind_direction": entry['wind']['deg']
        })
    
    return forecasts

# Example usage
forecast_5days = fetch_5day_forecast(51.5085, -0.1257)
print(forecast_5days[:5])  # show first 5 entries