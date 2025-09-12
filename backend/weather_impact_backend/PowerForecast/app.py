from flask import Flask, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import joblib
from datetime import datetime, timedelta
import warnings
import json
import os
import threading
import time
import requests
warnings.filterwarnings('ignore')

app = Flask(__name__)
CORS(app)

# Global variables
model_package = None
data = None
auto_update_enabled = False
auto_update_thread = None

class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        return super(NumpyEncoder, self).default(obj)

app.json.encoder = NumpyEncoder

# ==================== LIVE WEATHER DATA ====================

def get_live_weather_data():
    """Get current weather data (simulation - you can replace with real API)"""
    # For now, return simulated live weather
    # You can replace this with actual weather API calls
    now = datetime.now()
    
    # Simulate realistic weather for Sri Lanka
    return {
        'Temperature': 28.5 + np.random.normal(0, 1),  # Around 28.5°C with variation
        'Relative_Humidity': 82.0 + np.random.normal(0, 3),  # Around 82% humidity
        'Wind_Speed_10m': 6.2 + np.random.normal(0, 0.8),  # Around 6.2 m/s wind
        'Wind_Direction_50m': 45.0 + np.random.normal(0, 15),  # Prevailing direction with variation
        'Surface_Pressure': 100.9 + np.random.normal(0, 0.2),  # Around 1009 hPa
        'Wind_Speed_50m': (6.2 + np.random.normal(0, 0.8)) * 1.25,  # Higher at 50m
        'datetime': now,
        'Hour': int(now.hour),
        'Month': int(now.month)
    }

# To use real weather API, uncomment and modify this function:
"""
def get_live_weather_data():
    try:
        # Example using OpenWeatherMap API (you need API key)
        api_key = "YOUR_API_KEY"
        lat, lon = 9.0319, 79.5673  # Mannar coordinates
        url = f"http://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}&units=metric"
        
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            weather_data = response.json()
            
            return {
                'Temperature': float(weather_data['main']['temp']),
                'Relative_Humidity': float(weather_data['main']['humidity']),
                'Wind_Speed_10m': float(weather_data['wind']['speed']),
                'Wind_Direction_50m': float(weather_data['wind'].get('deg', 180)),
                'Surface_Pressure': float(weather_data['main']['pressure']),
                'Wind_Speed_50m': float(weather_data['wind']['speed']) * 1.25,
                'datetime': datetime.now(),
                'Hour': int(datetime.now().hour),
                'Month': int(datetime.now().month)
            }
    except Exception as e:
        print(f"Weather API error: {e}")
        
    # Fallback to simulated data
    return get_simulated_weather()
"""

# ==================== FEATURE ENGINEERING ====================

def create_physics_features_exact(weather_conditions, turbine_id, label_encoder=None):
    """Create features exactly matching training code"""
    
    wind_speed_10m = float(weather_conditions.get('Wind_Speed_10m', 5.6))
    wind_speed_50m = float(weather_conditions.get('Wind_Speed_50m', wind_speed_10m * 1.25))
    temperature = float(weather_conditions.get('Temperature', 27.9))
    humidity = float(weather_conditions.get('Relative_Humidity', 79.4))
    pressure = float(weather_conditions.get('Surface_Pressure', 100.7))
    wind_direction = float(weather_conditions.get('Wind_Direction_50m', 155.6))
    
    if 'datetime' in weather_conditions:
        dt = pd.to_datetime(weather_conditions['datetime'])
        hour = dt.hour
        month = dt.month
    else:
        hour = int(weather_conditions.get('Hour', datetime.now().hour))
        month = int(weather_conditions.get('Month', datetime.now().month))
    
    temp_data = {
        'Wind_Speed_10m': wind_speed_10m,
        'Wind_Speed_50m': wind_speed_50m,
        'Wind_Direction_50m': wind_direction,
        'Temperature': temperature,
        'Surface_Pressure': pressure,
        'Relative_Humidity': humidity,
        'Turbine_ID': turbine_id,
        'datetime': weather_conditions.get('datetime', '2024-01-01 12:00:00')
    }
    
    features_df = pd.DataFrame([temp_data])
    features_df['datetime'] = pd.to_datetime(features_df['datetime'])
    
    # Physics-based feature engineering
    features_df['Wind_Speed_Squared'] = features_df['Wind_Speed_10m'] ** 2
    features_df['Wind_Speed_Cubed'] = features_df['Wind_Speed_10m'] ** 3
    features_df['Wind_Shear'] = features_df['Wind_Speed_50m'] / (features_df['Wind_Speed_10m'] + 0.1)
    features_df['Air_Density'] = (features_df['Surface_Pressure'] * 1000) / (287.05 * (features_df['Temperature'] + 273.15))
    features_df['Wind_Power_Density'] = 0.5 * features_df['Air_Density'] * features_df['Wind_Speed_Cubed']
    
    wind_dir_rad = np.radians(features_df['Wind_Direction_50m'])
    features_df['Wind_Dir_Sin'] = np.sin(wind_dir_rad)
    features_df['Wind_Dir_Cos'] = np.cos(wind_dir_rad)
    
    features_df['Hour'] = hour
    features_df['Month'] = month
    features_df['Hour_Sin'] = np.sin(2 * np.pi * features_df['Hour'] / 24)
    features_df['Hour_Cos'] = np.cos(2 * np.pi * features_df['Hour'] / 24)
    features_df['Month_Sin'] = np.sin(2 * np.pi * features_df['Month'] / 12)
    features_df['Month_Cos'] = np.cos(2 * np.pi * features_df['Month'] / 12)
    
    features_df['Temp_Deviation'] = features_df['Temperature'] - 28.414123  # 2024 data mean
    
    if label_encoder is not None:
        try:
            features_df['Turbine_Encoded'] = label_encoder.transform([turbine_id])[0]
        except:
            turbine_num = int(turbine_id.replace('WTG', '').lstrip('0') or '1') - 1
            features_df['Turbine_Encoded'] = turbine_num
    else:
        turbine_num = int(turbine_id.replace('WTG', '').lstrip('0') or '1') - 1
        features_df['Turbine_Encoded'] = turbine_num
    
    return features_df

def get_model_prediction(weather_conditions, turbine_id):
    """Get prediction using trained model"""
    try:
        if isinstance(model_package, dict) and 'model' in model_package:
            actual_model = model_package['model']
            feature_columns = model_package.get('feature_columns', [])
            label_encoder = model_package.get('label_encoder')
            
            if hasattr(actual_model, 'predict') and feature_columns:
                features_df = create_physics_features_exact(weather_conditions, turbine_id, label_encoder)
                
                feature_array = []
                for col in feature_columns:
                    if col in features_df.columns:
                        feature_array.append(float(features_df[col].iloc[0]))
                    else:
                        feature_array.append(0.0)
                
                prediction = float(actual_model.predict(np.array(feature_array).reshape(1, -1))[0])
                return float(max(0, min(prediction, 3500)))
        
        return fallback_prediction(weather_conditions)
        
    except Exception as e:
        print(f"Prediction error for {turbine_id}: {e}")
        return fallback_prediction(weather_conditions)

def fallback_prediction(weather_conditions):
    """Physics-based fallback prediction"""
    try:
        wind_speed = float(weather_conditions.get('Wind_Speed_10m', 5.6))
        if wind_speed < 3:
            return 0.0
        elif wind_speed > 25:
            return 0.0
        elif wind_speed > 12:
            return min(2200 + (wind_speed - 12) * 50, 2500)
        else:
            return min((wind_speed ** 3) * 18, 2500)
    except:
        return 1200.0

# ==================== DATA LOADING ====================

def load_model_and_data():
    """Load trained model and 2024 demo data"""
    global model_package, data
    
    print("="*60)
    print("REAL-TIME WIND FARM DIGITAL TWIN SYSTEM (2024 SIMULATION)")
    print("="*60)
    
    # Load model
    model_files = ['optimized_wind_turbine_model.pkl', 'wind_turbine_model.pkl']
    
    model_loaded = False
    for model_file in model_files:
        try:
            if os.path.exists(model_file):
                model_package = joblib.load(model_file)
                print(f"Model loaded from: {model_file}")
                model_loaded = True
                break
        except Exception as e:
            print(f"Failed to load {model_file}: {e}")
            continue
    
    if not model_loaded:
        print("No model file found")
        return False
    
    # Load data
    data_files = ['model_ready_2024_data.csv']
    
    data_loaded = False
    for data_file in data_files:
        try:
            if os.path.exists(data_file):
                data = pd.read_csv(data_file)
                data['datetime'] = pd.to_datetime(data['datetime'])
                data = data.sort_values(['datetime', 'Turbine_ID']).reset_index(drop=True)
                print(f"Data loaded from: {data_file}")
                print(f"Date range: {data['datetime'].min()} to {data['datetime'].max()}")
                data_loaded = True
                break
        except Exception as e:
            print(f"Failed to load {data_file}: {e}")
            continue
    
    if not data_loaded:
        print("No data file found")
        return False
    
    print("="*60)
    print("SYSTEM READY FOR 2024 SIMULATION MODE")
    print("Current real time will be treated as 2024 time")
    print("="*60)
    return True

# ==================== TIME SIMULATION ====================

def get_simulated_2024_time():
    """Convert current real time to simulated 2024 time"""
    real_now = datetime.now()
    
    # Map current date/time to 2024 equivalent
    simulated_2024 = datetime(2024, real_now.month, real_now.day, real_now.hour, real_now.minute, real_now.second)
    
    # Handle Feb 29 for non-leap years
    if real_now.month == 2 and real_now.day == 29:
        simulated_2024 = datetime(2024, 2, 28, real_now.hour, real_now.minute, real_now.second)
    
    return simulated_2024

def get_data_for_timestamp(target_timestamp):
    """Get turbine data for specific timestamp"""
    if data is None:
        return None
    
    # Find closest timestamp in data
    data_slice = data[data['datetime'] == target_timestamp]
    
    if len(data_slice) == 0:
        # Find closest timestamp
        time_diffs = abs(data['datetime'] - target_timestamp)
        closest_idx = time_diffs.idxmin()
        closest_time = data.loc[closest_idx, 'datetime']
        data_slice = data[data['datetime'] == closest_time]
    
    if len(data_slice) == 0:
        return None
    
    # Extract weather conditions from historical data
    first_row = data_slice.iloc[0]
    historical_weather = {
        'Temperature': float(first_row['Temperature']),
        'Relative_Humidity': float(first_row['Relative_Humidity']),
        'Wind_Speed_10m': float(first_row['Wind_Speed_10m']),
        'Wind_Direction_50m': float(first_row['Wind_Direction_50m']),
        'Surface_Pressure': float(first_row.get('Surface_Pressure', 100.7)),
        'Wind_Speed_50m': float(first_row.get('Wind_Speed_50m', first_row['Wind_Speed_10m'] * 1.25)),
        'datetime': target_timestamp,
        'Hour': int(target_timestamp.hour),
        'Month': int(target_timestamp.month)
    }
    
    # Extract actual power data
    scada_data = {}
    for _, row in data_slice.iterrows():
        scada_data[row['Turbine_ID']] = float(row['Active_Power'])
    
    return {
        'timestamp': target_timestamp,
        'weather': historical_weather,
        'scada': scada_data
    }

def determine_turbine_status(actual_power, predicted_power):
    """Determine turbine operational status"""
    if actual_power < 50:
        return {
            'status': 'SHUTDOWN',
            'color': '#6b7280',
            'explanation': 'Turbine not operating (< 50 kW)'
        }
    
    if predicted_power <= 50:
        return {
            'status': 'UNKNOWN',
            'color': '#6b7280',
            'explanation': 'Low expected power - unable to assess performance'
        }
    
    performance_ratio = actual_power / predicted_power
    
    if performance_ratio >= 0.90:
        return {
            'status': 'OPTIMAL',
            'color': '#10b981', 
            'explanation': f'Performing normally ({performance_ratio*100:.1f}% of expected)'
        }
    elif performance_ratio >= 0.70:
        return {
            'status': 'SUBOPTIMAL',
            'color': '#f59e0b',
            'explanation': f'Below expected performance ({performance_ratio*100:.1f}% of expected)'
        }
    else:
        return {
            'status': 'CRITICAL',
            'color': '#ef4444',
            'explanation': f'Poor performance - maintenance needed ({performance_ratio*100:.1f}% of expected)'
        }

def analyze_weather_impact(weather_data):
    """Generate weather impact analysis"""
    analysis = []
    
    wind_speed = weather_data.get('Wind_Speed_10m', 0)
    temperature = weather_data.get('Temperature', 25)
    wind_direction = weather_data.get('Wind_Direction_50m', 180)
    humidity = weather_data.get('Relative_Humidity', 80)
    
    # Wind speed analysis
    if wind_speed < 3:
        analysis.append("Very low wind speed - minimal power generation expected")
    elif wind_speed < 5:
        analysis.append("Low wind speed - reduced power generation expected")
    elif wind_speed > 12:
        analysis.append("High wind speed - potential for maximum power generation")
    elif wind_speed > 20:
        analysis.append("Very high wind speed - safety systems may activate")
    
    # Temperature analysis
    if temperature > 35:
        analysis.append("High temperature - reduced air density may impact efficiency")
    elif temperature < 20:
        analysis.append("Cool conditions - increased air density may boost efficiency")
    
    # Wind direction analysis (assuming optimal direction is around 45-90 degrees for this site)
    optimal_range = range(45, 91)
    if wind_direction not in optimal_range:
        analysis.append("Suboptimal wind direction - reduced power expected")
    
    # Humidity analysis
    if humidity > 90:
        analysis.append("High humidity - potential weather front approaching")
    
    return analysis

# ==================== AUTO-UPDATE SYSTEM ====================

def auto_update_worker():
    """Background worker for hourly auto-updates"""
    global auto_update_enabled
    
    while auto_update_enabled:
        real_now = datetime.now()
        # Calculate seconds until next hour
        next_hour = real_now.replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)
        seconds_to_wait = (next_hour - real_now).total_seconds()
        
        print(f"Next update in {seconds_to_wait/60:.1f} minutes at {next_hour.strftime('%H:%M')} (2024 simulation)")
        
        # Wait until next hour
        time.sleep(seconds_to_wait)
        
        if auto_update_enabled:
            simulated_time = get_simulated_2024_time()
            print(f"Auto-update triggered at {real_now.strftime('%Y-%m-%d %H:%M:%S')} (simulated: {simulated_time.strftime('%Y-%m-%d %H:%M:%S')})")

# ==================== API ENDPOINTS ====================

@app.route('/api/status')
def system_status():
    """System health check"""
    real_now = datetime.now()
    simulated_now = get_simulated_2024_time()
    
    return jsonify({
        'status': 'running',
        'real_time': real_now.strftime('%Y-%m-%d %H:%M:%S'),
        'simulated_2024_time': simulated_now.strftime('%Y-%m-%d %H:%M:%S'),
        'auto_update_enabled': auto_update_enabled,
        'model_loaded': model_package is not None,
        'data_loaded': data is not None,
        'mode': '2024_simulation'
    })

@app.route('/api/real-time-turbines')
def real_time_turbines():
    """Get real-time turbine status with 2024 simulation - 3 time periods"""
    real_now = datetime.now()
    simulated_now = get_simulated_2024_time()
    current_hour = simulated_now.replace(minute=0, second=0, microsecond=0)
    
    # Last hour (for actual vs predicted comparison)
    last_hour = current_hour - timedelta(hours=1)
    last_hour_data = get_data_for_timestamp(last_hour)
    
    # Current hour (for forecast using 2024 weather data)
    current_hour_data = get_data_for_timestamp(current_hour)
    
    # Next hour (for forecast using 2024 weather data)
    next_hour = current_hour + timedelta(hours=1)
    next_hour_data = get_data_for_timestamp(next_hour)
    
    if not last_hour_data or not current_hour_data or not next_hour_data:
        return jsonify({'error': f'No historical data available for required time periods'}), 500
    
    turbines = []
    
    for turbine_id in sorted(['WTG01', 'WTG02', 'WTG03', 'WTG04', 'WTG05', 'WTG06', 'WTG07', 'WTG08', 'WTG09', 'WTG10']):
        # Last hour: actual power from 2024 data (simulating historical actual)
        actual_power_last = last_hour_data['scada'].get(turbine_id, 0)
        
        # Last hour: predicted power using 2024 weather + model
        predicted_power_last = get_model_prediction(last_hour_data['weather'], turbine_id)
        
        # Current hour: forecast using 2024 weather + model
        forecast_power_current = get_model_prediction(current_hour_data['weather'], turbine_id)
        
        # Next hour: forecast using 2024 weather + model  
        forecast_power_next = get_model_prediction(next_hour_data['weather'], turbine_id)
        
        # Status based on last hour actual vs predicted comparison
        status = determine_turbine_status(actual_power_last, predicted_power_last)
        
        # Performance metrics
        performance_gap = actual_power_last - predicted_power_last
        performance_ratio = actual_power_last / predicted_power_last if predicted_power_last > 0 else 0
        
        turbines.append({
            'id': turbine_id,
            'last_hour': {
                'actual_power': float(round(actual_power_last, 1)),
                'predicted_power': float(round(predicted_power_last, 1)),
                'performance_gap': float(round(performance_gap, 1)),
                'performance_ratio': float(round(performance_ratio, 3)),
                'status': status['status'],
                'color': status['color'],
                'explanation': status['explanation']
            },
            'current_hour': {
                'forecast_power': float(round(forecast_power_current, 1))
            },
            'next_hour': {
                'forecast_power': float(round(forecast_power_next, 1))
            }
        })
    
    # Summary statistics
    status_counts = {}
    for status in ['OPTIMAL', 'SUBOPTIMAL', 'CRITICAL', 'SHUTDOWN', 'UNKNOWN']:
        status_counts[status.lower()] = len([t for t in turbines if t['last_hour']['status'] == status])
    
    valid_turbines = [t for t in turbines if t['last_hour']['performance_ratio'] > 0]
    
    summary = {
        'total_turbines': len(turbines),
        'total_actual_power': float(round(sum(t['last_hour']['actual_power'] for t in turbines), 1)),
        'total_predicted_power': float(round(sum(t['last_hour']['predicted_power'] for t in turbines), 1)),
        'total_current_forecast': float(round(sum(t['current_hour']['forecast_power'] for t in turbines), 1)),
        'total_next_forecast': float(round(sum(t['next_hour']['forecast_power'] for t in turbines), 1)),
        'average_performance_ratio': float(round(
            sum(t['last_hour']['performance_ratio'] for t in valid_turbines) / len(valid_turbines), 3
        )) if valid_turbines else 0,
        **status_counts
    }
    
    # Weather analysis for all three periods
    weather_analysis_last = analyze_weather_impact(last_hour_data['weather'])
    weather_analysis_current = analyze_weather_impact(current_hour_data['weather'])
    weather_analysis_next = analyze_weather_impact(next_hour_data['weather'])
    
    return jsonify({
        'current_time': real_now.strftime('%Y-%m-%d %H:%M:%S'),
        'simulated_time': simulated_now.strftime('%Y-%m-%d %H:%M:%S'),
        'analysis_periods': {
            'last_hour': f"{last_hour.strftime('%H:%M')}-{current_hour.strftime('%H:%M')} (2024-{last_hour.strftime('%m-%d')})",
            'current_hour': f"{current_hour.strftime('%H:%M')}-{next_hour.strftime('%H:%M')} (2024-{current_hour.strftime('%m-%d')})",
            'next_hour': f"{next_hour.strftime('%H:%M')}-{(next_hour + timedelta(hours=1)).strftime('%H:%M')} (2024-{next_hour.strftime('%m-%d')})"
        },
        'weather_last_hour': last_hour_data['weather'],
        'weather_current_hour': current_hour_data['weather'],
        'weather_next_hour': next_hour_data['weather'],
        'weather_analysis': {
            'last_hour': weather_analysis_last,
            'current_hour': weather_analysis_current, 
            'next_hour': weather_analysis_next
        },
        'turbines': turbines,
        'summary': summary
    })

@app.route('/api/auto-update/start')
def start_auto_update():
    """Start automatic hourly updates"""
    global auto_update_enabled, auto_update_thread
    
    if not auto_update_enabled:
        auto_update_enabled = True
        auto_update_thread = threading.Thread(target=auto_update_worker, daemon=True)
        auto_update_thread.start()
        
        real_next_update = (datetime.now().replace(minute=0, second=0, microsecond=0) + timedelta(hours=1))
        simulated_next_update = get_simulated_2024_time().replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)
        
        return jsonify({
            'status': 'started',
            'message': 'Auto-update started - will update every hour using 2024 simulation',
            'next_update_real': real_next_update.strftime('%Y-%m-%d %H:%M:%S'),
            'next_update_simulated': simulated_next_update.strftime('%Y-%m-%d %H:%M:%S')
        })
    
    return jsonify({
        'status': 'already_running',
        'message': 'Auto-update is already active'
    })

@app.route('/api/auto-update/stop')
def stop_auto_update():
    """Stop automatic updates"""
    global auto_update_enabled
    
    auto_update_enabled = False
    
    return jsonify({
        'status': 'stopped',
        'message': 'Auto-update stopped'
    })

if __name__ == '__main__':
    print("="*60)
    print("REAL-TIME WIND FARM DIGITAL TWIN SYSTEM")
    print("2024 SIMULATION MODE")
    print("Current time will be treated as 2024 equivalent")
    print("="*60)
    
    system_ready = load_model_and_data()
    
    if system_ready:
        real_now = datetime.now()
        simulated_now = get_simulated_2024_time()
        
        print("System Status: READY FOR 2024 SIMULATION")
        print(f"Real time: {real_now.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Simulated time: {simulated_now.strftime('%Y-%m-%d %H:%M:%S')}")
        print("\nOperation mode:")
        print("- Previous hour analysis: Historical 2024 actual vs predicted")
        print("- Current hour forecast: Live weather + trained model")
        print("- Updates: Every hour at the top of the hour")
        print("\nReal-time endpoints:")
        print("- http://127.0.0.1:5002/api/status")
        print("- http://127.0.0.1:5002/api/real-time-turbines")
        print("- http://127.0.0.1:5002/api/auto-update/start")
        print("- http://127.0.0.1:5002/api/auto-update/stop")
        print("="*60)
        app.run(debug=True, host='127.0.0.1', port=5002)
    else:
        print("System Status: FAILED")
        print("="*60)